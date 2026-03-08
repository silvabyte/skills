import type { WhisperResult } from "./whisper";

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

/** Convert Whisper JSON result to a numbered markdown table */
export function toMarkdown(result: WhisperResult): string {
  const lines: string[] = [
    "| #  | Time                | Text                                    |",
    "|----|---------------------|-----------------------------------------|",
  ];

  result.transcription.forEach((seg, i) => {
    const num = String(i + 1).padEnd(2);
    const from = shortTimestamp(seg.timestamps.from);
    const to = shortTimestamp(seg.timestamps.to);
    const time = `${from} - ${to}`;
    const text = seg.text.trim();
    lines.push(`| ${num} | ${time} | ${text} |`);
  });

  return lines.join("\n") + "\n";
}
