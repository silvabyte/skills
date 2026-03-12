import type { WhisperSegment } from "./audetic";
import type { Edl } from "./edl";
import { parseTimestamp } from "./edl";

// ---------- Types ----------

export interface CaptionWord {
  word: string;
  startMs: number;
  endMs: number;
}

export interface CaptionGroup {
  text: string;
  startMs: number;
  endMs: number;
}

export interface CaptionStyle {
  fontName: string;
  fontSize: number;
  primaryColor: string;
  outlineColor: string;
  outlineWidth: number;
  bold: boolean;
  alignment: number;
  marginV: number;
}

// ---------- Extract words from segments ----------

/** Extract words from segments. Uses word-level timestamps when available, falls back to even distribution. */
export function extractWords(segments: WhisperSegment[]): CaptionWord[] {
  const words: CaptionWord[] = [];

  for (const seg of segments) {
    if (seg.words?.length) {
      for (const w of seg.words) {
        words.push({ word: w.word, startMs: w.startMs, endMs: w.endMs });
      }
    } else {
      // Fallback: evenly distribute words across segment duration
      const segWords = seg.text.trim().split(/\s+/).filter(Boolean);
      if (segWords.length === 0) continue;

      const startMs = seg.offsets.from;
      const endMs = seg.offsets.to;
      const duration = endMs - startMs;
      const perWord = duration / segWords.length;

      for (let i = 0; i < segWords.length; i++) {
        words.push({
          word: segWords[i],
          startMs: Math.round(startMs + i * perWord),
          endMs: Math.round(startMs + (i + 1) * perWord),
        });
      }
    }
  }

  return words;
}

// ---------- Group words into display chunks ----------

/** Group words into display chunks for captions. Text is uppercased. */
export function groupWords(words: CaptionWord[], wordsPerGroup = 2): CaptionGroup[] {
  const groups: CaptionGroup[] = [];
  for (let i = 0; i < words.length; i += wordsPerGroup) {
    const chunk = words.slice(i, i + wordsPerGroup);
    groups.push({
      text: chunk.map((w) => w.word).join(" ").toUpperCase(),
      startMs: chunk[0].startMs,
      endMs: chunk[chunk.length - 1].endMs,
    });
  }
  return groups;
}

// ---------- ASS subtitle generation ----------

function formatAssTime(ms: number): string {
  const totalCs = Math.round(ms / 10);
  const h = Math.floor(totalCs / 360000);
  const m = Math.floor((totalCs % 360000) / 6000);
  const s = Math.floor((totalCs % 6000) / 100);
  const cs = totalCs % 100;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

const DEFAULT_STYLE: CaptionStyle = {
  fontName: "Arial Black",
  fontSize: 154, // overridden by videoHeight
  primaryColor: "&H00FFFFFF", // white
  outlineColor: "&H00000000", // black
  outlineWidth: 4,
  bold: true,
  alignment: 5, // center-center
  marginV: 0,
};

/** Generate a complete ASS subtitle file with Hormozi-style captions */
export function generateAss(
  groups: CaptionGroup[],
  videoWidth: number,
  videoHeight: number,
  style?: Partial<CaptionStyle>,
): string {
  const s = { ...DEFAULT_STYLE, ...style };
  s.fontSize = style?.fontSize ?? Math.round(videoHeight * 0.08);

  const boldFlag = s.bold ? -1 : 0;

  const lines = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${videoWidth}`,
    `PlayResY: ${videoHeight}`,
    "WrapStyle: 0",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Default,${s.fontName},${s.fontSize},${s.primaryColor},&H000000FF,${s.outlineColor},&H00000000,${boldFlag},0,0,0,100,100,0,0,1,${s.outlineWidth},0,${s.alignment},10,10,${s.marginV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];

  for (const group of groups) {
    const start = formatAssTime(group.startMs);
    const end = formatAssTime(group.endMs);
    lines.push(`Dialogue: 0,${start},${end},Default,,0,0,0,,${group.text}`);
  }

  return lines.join("\n") + "\n";
}

// ---------- EDL remapping ----------

/** Remap transcript times from source-video time to output-video time based on EDL cuts */
export function remapTranscript(segments: WhisperSegment[], edl: Edl): WhisperSegment[] {
  const remapped: WhisperSegment[] = [];

  // Build EDL timeline: each EDL segment maps source time range → output time range
  let outputOffsetMs = 0;
  const edlMap = edl.segments.map((edlSeg) => {
    const srcStart = parseTimestamp(edlSeg.start);
    const srcEnd = parseTimestamp(edlSeg.end);
    const duration = srcEnd - srcStart;
    const entry = {
      source: edlSeg.source,
      srcStartMs: srcStart,
      srcEndMs: srcEnd,
      outStartMs: outputOffsetMs,
      outEndMs: outputOffsetMs + duration,
    };
    outputOffsetMs += duration;
    return entry;
  });

  for (const seg of segments) {
    const segStart = seg.offsets.from;
    const segEnd = seg.offsets.to;

    // Find the EDL segment this transcript segment belongs to
    const edlEntry = edlMap.find((e) => {
      const sourceMatch = !seg.source || e.source === seg.source;
      // Segment overlaps with EDL entry
      return sourceMatch && segStart < e.srcEndMs && segEnd > e.srcStartMs;
    });

    if (!edlEntry) continue; // segment outside any EDL cut — discard

    // Clamp segment boundaries to EDL boundaries
    const clampedStart = Math.max(segStart, edlEntry.srcStartMs);
    const clampedEnd = Math.min(segEnd, edlEntry.srcEndMs);

    // Map to output timeline
    const shift = edlEntry.outStartMs - edlEntry.srcStartMs;
    const outStart = clampedStart + shift;
    const outEnd = clampedEnd + shift;

    const remappedSeg: WhisperSegment = {
      ...seg,
      offsets: { from: outStart, to: outEnd },
      timestamps: {
        from: formatOffsetTimestamp(outStart),
        to: formatOffsetTimestamp(outEnd),
      },
    };

    // Remap words if present
    if (seg.words?.length) {
      remappedSeg.words = seg.words
        .filter((w) => w.startMs < edlEntry.srcEndMs && w.endMs > edlEntry.srcStartMs)
        .map((w) => ({
          word: w.word,
          startMs: Math.max(w.startMs, edlEntry.srcStartMs) + shift,
          endMs: Math.min(w.endMs, edlEntry.srcEndMs) + shift,
        }));
    }

    remapped.push(remappedSeg);
  }

  return remapped;
}

function formatOffsetTimestamp(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const remainder = ms % 1000;
  return [
    String(h).padStart(2, "0"),
    String(m).padStart(2, "0"),
    String(s).padStart(2, "0"),
  ].join(":") + "," + String(remainder).padStart(3, "0");
}
