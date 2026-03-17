import { z } from "zod";
import { basename } from "path";

const timestampRegex = /^\d{2}:\d{2}:\d{2}\.\d{3}$/;

const TimestampSchema = z.string().regex(timestampRegex, {
  message: "Timestamp must be in HH:MM:SS.mmm format",
});

const SegmentSchema = z.object({
  source: z.string(),
  start: TimestampSchema,
  end: TimestampSchema,
  label: z.string().optional(),
});

export const EdlSchema = z.object({
  output: z.string(),
  segments: z.array(SegmentSchema).min(1, "EDL must have at least one segment"),
  narrative_notes: z.string().optional(),
});

export type Edl = z.infer<typeof EdlSchema>;
export type Segment = z.infer<typeof SegmentSchema>;

/** Get all unique source paths from an EDL */
export function allSources(edl: Edl): string[] {
  return [...new Set(edl.segments.map((seg) => seg.source))];
}

/** Parse HH:MM:SS.mmm to milliseconds */
export function parseTimestamp(ts: string): number {
  const [h, m, rest] = ts.split(":");
  const [s, ms] = rest.split(".");
  return (
    parseInt(h) * 3600000 +
    parseInt(m) * 60000 +
    parseInt(s) * 1000 +
    parseInt(ms)
  );
}

/** Format milliseconds to HH:MM:SS.mmm */
export function formatTimestamp(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const remainder = ms % 1000;
  return [
    String(h).padStart(2, "0"),
    String(m).padStart(2, "0"),
    String(s).padStart(2, "0"),
  ].join(":") + "." + String(remainder).padStart(3, "0");
}

/** Calculate kept/cut/total durations for an EDL */
export function calculateDuration(edl: Edl) {
  const kept = edl.segments.reduce((sum, seg) => {
    return sum + parseTimestamp(seg.end) - parseTimestamp(seg.start);
  }, 0);
  return { keptMs: kept };
}

/** Parse a value as either a relative delta or an absolute timestamp */
export function parseDelta(value: string): { type: "relative"; deltaMs: number } | { type: "absolute"; ms: number } {
  if (timestampRegex.test(value)) {
    return { type: "absolute", ms: parseTimestamp(value) };
  }
  const deltaMatch = value.match(/^([+-]?\d+(\.\d+)?)s$/);
  if (deltaMatch) {
    const deltaMs = Math.round(parseFloat(deltaMatch[1]) * 1000);
    return { type: "relative", deltaMs };
  }
  throw new Error(`Invalid value "${value}". Use a relative delta (+/-Xs, e.g. -0.5s) or absolute timestamp (HH:MM:SS.mmm).`);
}

/** Format a single segment as a display line matching preview output */
export function formatSegmentLine(seg: Segment, index: number, multiSource: boolean): string {
  const durMs = parseTimestamp(seg.end) - parseTimestamp(seg.start);
  const label = seg.label ? ` (${seg.label})` : "";
  const srcInfo = multiSource ? `  [${basename(seg.source)}]` : "";
  return `  ${index + 1}. ${seg.start} -> ${seg.end}  [${formatDuration(durMs)}]${srcInfo}${label}`;
}

/** Format milliseconds as human-readable duration */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}
