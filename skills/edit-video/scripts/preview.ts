import { resolve, basename } from "path";
import { EdlSchema, allSources, calculateDuration, formatDuration, parseTimestamp, formatSegmentLine } from "./lib/edl";
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
const sources = allSources(edl);
const multiSource = sources.length > 1;

// Validate all source files exist and get durations
let totalSourceMs = 0;
for (const src of sources) {
  const srcFile = Bun.file(src);
  if (!(await srcFile.exists())) {
    console.error(`Source video not found: ${src}`);
    process.exit(1);
  }
  const dur = await getVideoDuration(src);
  const durMs = Math.round(dur * 1000);
  totalSourceMs += durMs;
  if (multiSource) {
    console.log(`Source: ${basename(src)}  [${formatDuration(durMs)}]`);
  } else {
    console.log(`Source:   ${src}`);
  }
}

if (multiSource) {
  console.log(`\nTotal source material: ${formatDuration(totalSourceMs)}`);
}

console.log(`Output:   ${edl.output}`);
console.log(`Segments: ${edl.segments.length}\n`);

edl.segments.forEach((seg, i) => {
  console.log(formatSegmentLine(seg, i, multiSource));
});

// Detect non-chronological segment ordering (only within same source)
const isReordered = edl.segments.some((seg, i) => {
  if (i === 0) return false;
  const prev = edl.segments[i - 1];
  if (prev.source !== seg.source) return false;
  return parseTimestamp(seg.start) < parseTimestamp(prev.start);
});
if (isReordered) {
  console.log(`\nNote: segments are reordered (narrative edit)`);
}

// Show narrative notes if present
if (edl.narrative_notes) {
  console.log(`\nNarrative notes:\n${edl.narrative_notes}`);
}

const { keptMs } = calculateDuration(edl);
console.log(`\nTotal source: ${formatDuration(totalSourceMs)}`);
console.log(`Output:       ${formatDuration(keptMs)} (${((keptMs / totalSourceMs) * 100).toFixed(1)}%)`);
console.log(`Cut:          ${formatDuration(totalSourceMs - keptMs)} (${(((totalSourceMs - keptMs) / totalSourceMs) * 100).toFixed(1)}%)`);
