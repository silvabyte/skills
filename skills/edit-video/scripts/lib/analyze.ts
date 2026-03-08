import type { WhisperResult } from "./whisper";

export interface SegmentAnalysis {
  index: number;
  text: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  gapBeforeMs: number;
  wordCount: number;
  wordsPerSecond: number;
  flags: string[];
}

export interface AnalysisResult {
  segments: SegmentAnalysis[];
  totalDurationMs: number;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function analyzeTranscript(result: WhisperResult): AnalysisResult {
  const segments: SegmentAnalysis[] = [];

  for (let i = 0; i < result.transcription.length; i++) {
    const seg = result.transcription[i];
    const startMs = seg.offsets.from;
    const endMs = seg.offsets.to;
    const durationMs = endMs - startMs;
    const durationSec = durationMs / 1000;
    const text = seg.text.trim();

    const prevEnd = i > 0 ? result.transcription[i - 1].offsets.to : startMs;
    const gapBeforeMs = startMs - prevEnd;

    const words = countWords(text);
    const wordsPerSecond = durationSec > 0 ? words / durationSec : 0;

    const flags: string[] = [];
    if (gapBeforeMs > 1000) flags.push(`gap:${(gapBeforeMs / 1000).toFixed(1)}s`);
    if (wordsPerSecond < 0.5 && durationSec > 2) flags.push("slow");
    if (words === 0) flags.push("silence");

    segments.push({
      index: i + 1,
      text,
      startMs,
      endMs,
      durationMs,
      gapBeforeMs,
      wordCount: words,
      wordsPerSecond,
      flags,
    });
  }

  const lastSeg = result.transcription[result.transcription.length - 1];
  const totalDurationMs = lastSeg ? lastSeg.offsets.to : 0;

  return { segments, totalDurationMs };
}

/** Markdown table with signal flags — no keep/cut decisions, that's the LLM's job */
export function analysisToMarkdown(analysis: AnalysisResult): string {
  const lines: string[] = [
    "| #  | Time                | Dur  | WPS  | Flags           | Text |",
    "|----|---------------------|------|------|-----------------|------|",
  ];

  for (const seg of analysis.segments) {
    const num = String(seg.index).padEnd(2);
    const from = formatMs(seg.startMs);
    const to = formatMs(seg.endMs);
    const time = `${from} - ${to}`;
    const dur = (seg.durationMs / 1000).toFixed(1) + "s";
    const wps = seg.wordsPerSecond.toFixed(1);
    const flags = seg.flags.join(", ") || "-";
    lines.push(`| ${num} | ${time} | ${dur} | ${wps} | ${flags} | ${seg.text} |`);
  }

  lines.push("");
  lines.push(`Total: ${(analysis.totalDurationMs / 1000).toFixed(0)}s`);

  return lines.join("\n") + "\n";
}

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return [
    String(h).padStart(2, "0"),
    String(m).padStart(2, "0"),
    String(s).padStart(2, "0"),
  ].join(":");
}
