import { resolve, join, extname } from "path";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { EdlSchema, allSources, calculateDuration, formatDuration } from "./lib/edl";
import {
  extractSegment,
  extractSegmentTranscode,
  concatenateSegments,
  getVideoInfo,
  needsTranscode,
  type VideoInfo,
} from "./lib/ffmpeg";

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

// Validate all source files exist and probe their info
const sources = allSources(edl);
const sourceInfoMap = new Map<string, VideoInfo>();
for (const src of sources) {
  const srcFile = Bun.file(src);
  if (!(await srcFile.exists())) {
    console.error(`Source video not found: ${src}`);
    process.exit(1);
  }
  sourceInfoMap.set(src, await getVideoInfo(src));
}

const infos = [...sourceInfoMap.values()];
const transcode = needsTranscode(infos);

if (transcode) {
  const codecs = [...new Set(infos.map((i) => `${i.codec} ${i.width}x${i.height} ${i.pixFmt}`))];
  console.log(`Mixed formats detected — will re-encode for compatibility:`);
  for (const c of codecs) console.log(`  ${c}`);
  console.log();
}

// Pick output resolution: use the most common resolution, or the largest if tied
const resCounts = new Map<string, { count: number; w: number; h: number }>();
for (const info of infos) {
  const key = `${info.width}x${info.height}`;
  const entry = resCounts.get(key) ?? { count: 0, w: info.width, h: info.height };
  entry.count++;
  resCounts.set(key, entry);
}
const sorted = [...resCounts.values()].sort((a, b) => b.count - a.count || (b.w * b.h) - (a.w * a.h));
const targetRes = sorted[0];

const tempDir = await mkdtemp(join(tmpdir(), "render-"));

try {
  const segmentPaths: string[] = [];
  for (let i = 0; i < edl.segments.length; i++) {
    const seg = edl.segments[i];
    const label = seg.label ? ` (${seg.label})` : "";
    console.log(`Extracting segment ${i + 1}/${edl.segments.length}: ${seg.start} -> ${seg.end}${label}`);

    const segPath = join(tempDir, `seg-${String(i).padStart(4, "0")}.mp4`);

    if (transcode) {
      await extractSegmentTranscode(seg.source, seg.start, seg.end, segPath, {
        width: targetRes.w,
        height: targetRes.h,
        frameRate: 30,
      });
    } else {
      await extractSegment(seg.source, seg.start, seg.end, segPath);
    }
    segmentPaths.push(segPath);
  }

  console.log("Concatenating segments...");
  await concatenateSegments(segmentPaths, edl.output);

  const { keptMs } = calculateDuration(edl);
  console.log(`\nDone! Output: ${edl.output}`);
  console.log(`Final duration: ~${formatDuration(keptMs)}`);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
