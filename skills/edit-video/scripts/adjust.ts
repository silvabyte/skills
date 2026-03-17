import { resolve } from "path";
import {
  EdlSchema,
  allSources,
  calculateDuration,
  formatDuration,
  formatTimestamp,
  parseTimestamp,
  parseDelta,
  formatSegmentLine,
} from "./lib/edl";

// ---------- Parse CLI args ----------

const args = process.argv.slice(2);
let edlPath: string | undefined;
let segmentIndex: number | undefined;
let startValue: string | undefined;
let endValue: string | undefined;
let removeIndex: number | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--segment" && args[i + 1]) {
    segmentIndex = parseInt(args[++i], 10);
  } else if (args[i] === "--start" && args[i + 1]) {
    startValue = args[++i];
  } else if (args[i] === "--end" && args[i + 1]) {
    endValue = args[++i];
  } else if (args[i] === "--remove" && args[i + 1]) {
    removeIndex = parseInt(args[++i], 10);
  } else if (!edlPath) {
    edlPath = args[i];
  }
}

if (!edlPath) {
  console.error(
    "Usage:\n" +
    "  bun run scripts/adjust.ts <edl.json> --segment N --start/--end <value>\n" +
    "  bun run scripts/adjust.ts <edl.json> --remove N\n" +
    "\n" +
    "Values: relative delta (+0.5s, -1s) or absolute timestamp (HH:MM:SS.mmm)"
  );
  process.exit(1);
}

if (segmentIndex !== undefined && removeIndex !== undefined) {
  console.error("Error: --segment and --remove are mutually exclusive.");
  process.exit(1);
}

if (segmentIndex !== undefined && !startValue && !endValue) {
  console.error("Error: --segment requires at least one of --start or --end.");
  process.exit(1);
}

if (segmentIndex === undefined && removeIndex === undefined) {
  console.error("Error: must specify either --segment N or --remove N.");
  process.exit(1);
}

// ---------- Load EDL ----------

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

// ---------- Adjust mode ----------

if (segmentIndex !== undefined) {
  if (segmentIndex < 1 || segmentIndex > edl.segments.length) {
    console.error(`Error: segment ${segmentIndex} does not exist. EDL has ${edl.segments.length} segments.`);
    process.exit(1);
  }

  const seg = edl.segments[segmentIndex - 1];
  const beforeStart = seg.start;
  const beforeEnd = seg.end;

  let startMs = parseTimestamp(seg.start);
  let endMs = parseTimestamp(seg.end);

  if (startValue) {
    const delta = parseDelta(startValue);
    if (delta.type === "relative") {
      startMs += delta.deltaMs;
    } else {
      startMs = delta.ms;
    }
    if (startMs < 0) {
      console.error(
        `Error: start would become negative (${startMs}ms). Segment ${segmentIndex} starts at ${beforeStart}; cannot shift by ${startValue}.`
      );
      process.exit(1);
    }
  }

  if (endValue) {
    const delta = parseDelta(endValue);
    if (delta.type === "relative") {
      endMs += delta.deltaMs;
    } else {
      endMs = delta.ms;
    }
    if (endMs < 0) {
      console.error(
        `Error: end would become negative (${endMs}ms). Segment ${segmentIndex} ends at ${beforeEnd}; cannot shift by ${endValue}.`
      );
      process.exit(1);
    }
  }

  if (startMs >= endMs) {
    console.error(
      `Error: start (${formatTimestamp(startMs)}) would be at or after end (${formatTimestamp(endMs)}). Segment must have positive duration.`
    );
    process.exit(1);
  }

  seg.start = formatTimestamp(startMs);
  seg.end = formatTimestamp(endMs);

  await Bun.write(absPath, JSON.stringify(edl, null, 2) + "\n");

  const beforeDurMs = parseTimestamp(beforeEnd) - parseTimestamp(beforeStart);
  const afterDurMs = endMs - startMs;

  console.log(`Segment ${segmentIndex} adjusted:`);
  console.log(`  Before: ${beforeStart} -> ${beforeEnd}  [${formatDuration(beforeDurMs)}]`);
  console.log(`  After:  ${seg.start} -> ${seg.end}  [${formatDuration(afterDurMs)}]`);
}

// ---------- Remove mode ----------

if (removeIndex !== undefined) {
  if (removeIndex < 1 || removeIndex > edl.segments.length) {
    console.error(`Error: segment ${removeIndex} does not exist. EDL has ${edl.segments.length} segments.`);
    process.exit(1);
  }

  if (edl.segments.length === 1) {
    console.error("Error: cannot remove the only remaining segment.");
    process.exit(1);
  }

  const removed = edl.segments[removeIndex - 1];
  edl.segments.splice(removeIndex - 1, 1);

  await Bun.write(absPath, JSON.stringify(edl, null, 2) + "\n");

  const removedDurMs = parseTimestamp(removed.end) - parseTimestamp(removed.start);
  console.log(`Removed segment ${removeIndex}: ${removed.start} -> ${removed.end}  [${formatDuration(removedDurMs)}]${removed.label ? ` (${removed.label})` : ""}`);
}

// ---------- Print updated segment listing ----------

console.log(`\nSegments (${edl.segments.length}):`);
edl.segments.forEach((seg, i) => {
  console.log(formatSegmentLine(seg, i, multiSource));
});

const { keptMs } = calculateDuration(edl);
console.log(`\nTotal kept: ${formatDuration(keptMs)}`);
