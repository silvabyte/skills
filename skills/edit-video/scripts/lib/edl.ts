import { z } from "zod";

const timestampRegex = /^\d{2}:\d{2}:\d{2}\.\d{3}$/;

const TimestampSchema = z.string().regex(timestampRegex, {
  message: "Timestamp must be in HH:MM:SS.mmm format",
});

const SegmentSchema = z.object({
  start: TimestampSchema,
  end: TimestampSchema,
  label: z.string().optional(),
});

export const EdlSchema = z.object({
  source: z.string(),
  output: z.string(),
  segments: z.array(SegmentSchema).min(1, "EDL must have at least one segment"),
  narrative_notes: z.string().optional(),
});

export type Edl = z.infer<typeof EdlSchema>;
export type Segment = z.infer<typeof SegmentSchema>;

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
