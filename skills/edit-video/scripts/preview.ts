import { resolve } from "path";
import { EdlSchema, calculateDuration, formatDuration, parseTimestamp, formatTimestamp } from "./lib/edl";
import { getVideoDuration } from "./lib/ffmpeg";

const edlPath = process.argv[2];
if (!edlPath) {
  console.error("Usage: bun run scripts/preview.ts <edl.json>");
  process.exit(1);
}

const absPath = resolve(edlPath);
const file = Bun.file(absPath);
if (!(await file.exists())) {
  console.error(`File not found: ${absPath}`);
  process.exit(1);
}

const raw = await file.json();
const parsed = EdlSchema.safeParse(raw);
if (!parsed.success) {
  console.error("Invalid EDL:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

const edl = parsed.data;

// Check source exists
const sourceFile = Bun.file(edl.source);
if (!(await sourceFile.exists())) {
  console.error(`Source video not found: ${edl.source}`);
  process.exit(1);
}

// Get total video duration
const totalSeconds = await getVideoDuration(edl.source);
const totalMs = Math.round(totalSeconds * 1000);

const { keptMs } = calculateDuration(edl);
const cutMs = totalMs - keptMs;

console.log(`Source:   ${edl.source}`);
console.log(`Output:   ${edl.output}`);
console.log(`Segments: ${edl.segments.length}\n`);

edl.segments.forEach((seg, i) => {
  const durMs = parseTimestamp(seg.end) - parseTimestamp(seg.start);
  const label = seg.label ? ` (${seg.label})` : "";
  console.log(`  ${i + 1}. ${seg.start} -> ${seg.end}  [${formatDuration(durMs)}]${label}`);
});

// Detect non-chronological segment ordering
const isReordered = edl.segments.some((seg, i) => {
  if (i === 0) return false;
  return parseTimestamp(seg.start) < parseTimestamp(edl.segments[i - 1].start);
});
if (isReordered) {
  console.log(`\nNote: segments are reordered (narrative edit)`);
}

// Show narrative notes if present
if (edl.narrative_notes) {
  console.log(`\nNarrative notes:\n${edl.narrative_notes}`);
}

console.log(`\nTotal duration: ${formatDuration(totalMs)}`);
console.log(`Kept:           ${formatDuration(keptMs)} (${((keptMs / totalMs) * 100).toFixed(1)}%)`);
console.log(`Cut:            ${formatDuration(cutMs)} (${((cutMs / totalMs) * 100).toFixed(1)}%)`);
