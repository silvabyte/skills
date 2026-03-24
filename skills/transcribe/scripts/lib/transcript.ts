import { basename } from "path";
import type { WhisperResult } from "./audetic";

/** Convert whisper comma-separated timestamp to ffmpeg dot format: 00:01:23,450 -> 00:01:23.450 */
function normalizeTimestamp(ts: string): string {
  return ts.replace(",", ".");
}

/** Strip timestamp to just HH:MM:SS for the readable table */
function shortTimestamp(ts: string): string {
  // Whisper format: "00:00:00,000" or "00:00:00.000"
  // Strip the milliseconds for the readable table
  return ts.replace(",", ".").replace(/\.\d{3}$/, "");
}

/** Truncate a filename for display in the table */
function shortSource(source: string, maxLen = 24): string {
  const name = basename(source);
  if (name.length <= maxLen) return name;
  return "..." + name.slice(-(maxLen - 3));
}

/** Convert Whisper JSON result to a numbered markdown table */
export function toMarkdown(result: WhisperResult): string {
  const hasSource = result.transcription.some((seg) => seg.source);

  const lines: string[] = hasSource
    ? [
        "| #  | Source                   | Time                | Text                                    |",
        "|----|--------------------------|---------------------|-----------------------------------------|",
      ]
    : [
        "| #  | Time                | Text                                    |",
        "|----|---------------------|-----------------------------------------|",
      ];

  result.transcription.forEach((seg, i) => {
    const num = String(i + 1).padEnd(2);
    const from = shortTimestamp(seg.timestamps.from);
    const to = shortTimestamp(seg.timestamps.to);
    const time = `${from} - ${to}`;
    const text = seg.text.trim();

    if (hasSource) {
      const src = seg.source ? shortSource(seg.source) : "-";
      lines.push(`| ${num} | ${src.padEnd(24)} | ${time} | ${text} |`);
    } else {
      lines.push(`| ${num} | ${time} | ${text} |`);
    }
  });

  return lines.join("\n") + "\n";
}
