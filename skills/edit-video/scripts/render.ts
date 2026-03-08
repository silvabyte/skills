import { resolve, join } from "path";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { EdlSchema, calculateDuration, formatDuration } from "./lib/edl";
import { extractSegment, concatenateSegments } from "./lib/ffmpeg";

const edlPath = process.argv[2];
if (!edlPath) {
  console.error("Usage: bun run scripts/render.ts <edl.json>");
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

const tempDir = await mkdtemp(join(tmpdir(), "render-"));

try {
  // Extract each segment
  const segmentPaths: string[] = [];
  for (let i = 0; i < edl.segments.length; i++) {
    const seg = edl.segments[i];
    const label = seg.label ? ` (${seg.label})` : "";
    console.log(`Extracting segment ${i + 1}/${edl.segments.length}: ${seg.start} -> ${seg.end}${label}`);

    const ext = edl.source.match(/\.([^.]+)$/)?.[1] ?? "mp4";
    const segPath = join(tempDir, `seg-${String(i).padStart(4, "0")}.${ext}`);
    await extractSegment(edl.source, seg.start, seg.end, segPath);
    segmentPaths.push(segPath);
  }

  // Concatenate
  console.log("Concatenating segments...");
  await concatenateSegments(segmentPaths, edl.output);

  const { keptMs } = calculateDuration(edl);
  console.log(`\nDone! Output: ${edl.output}`);
  console.log(`Final duration: ~${formatDuration(keptMs)}`);
} finally {
  // Clean up temp dir
  await rm(tempDir, { recursive: true, force: true });
}
