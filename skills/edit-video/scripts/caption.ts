import { resolve, dirname, basename, join } from "path";
import { tmpdir } from "os";
import { getVideoInfo, burnCaptions } from "./lib/ffmpeg";
import { extractWords, groupWords, generateAss, remapTranscript } from "./lib/caption";
import { EdlSchema } from "./lib/edl";
import type { WhisperResult } from "./lib/audetic";

// ---------- Parse CLI args ----------

const args = process.argv.slice(2);
let videoPath: string | undefined;
let transcriptPath: string | undefined;
let edlPath: string | undefined;
let outputPath: string | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--edl" && args[i + 1]) {
    edlPath = args[++i];
  } else if (args[i] === "--output" && args[i + 1]) {
    outputPath = args[++i];
  } else if (!videoPath) {
    videoPath = args[i];
  } else if (!transcriptPath) {
    transcriptPath = args[i];
  }
}

if (!videoPath || !transcriptPath) {
  console.error("Usage: bun run scripts/caption.ts <video.mp4> <transcript.json> [--edl edl.json] [--output path.mp4]");
  process.exit(1);
}

videoPath = resolve(videoPath);
transcriptPath = resolve(transcriptPath);
if (edlPath) edlPath = resolve(edlPath);

// ---------- Default output path ----------

if (!outputPath) {
  const dir = dirname(videoPath);
  const name = basename(videoPath).replace(/\.[^.]+$/, "");
  outputPath = join(dir, `${name}-captioned.mp4`);
}
outputPath = resolve(outputPath);

// ---------- Load transcript ----------

const transcriptFile = Bun.file(transcriptPath);
if (!(await transcriptFile.exists())) {
  console.error(`Transcript not found: ${transcriptPath}`);
  process.exit(1);
}
let transcript = (await transcriptFile.json()) as WhisperResult;

// ---------- EDL remapping ----------

if (edlPath) {
  const edlFile = Bun.file(edlPath);
  if (!(await edlFile.exists())) {
    console.error(`EDL not found: ${edlPath}`);
    process.exit(1);
  }
  const raw = await edlFile.json();
  const parsed = EdlSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Invalid EDL:");
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  console.log("Remapping transcript to EDL timeline...");
  transcript = {
    transcription: remapTranscript(transcript.transcription, parsed.data),
  };
}

// ---------- Probe video ----------

console.log("Probing video...");
const info = await getVideoInfo(videoPath);
console.log(`Resolution: ${info.width}x${info.height}`);

// ---------- Generate captions ----------

const words = extractWords(transcript.transcription);
console.log(`${words.length} words extracted`);

const groups = groupWords(words);
console.log(`${groups.length} caption groups`);

const ass = generateAss(groups, info.width, info.height);

// Write ASS to temp file
const assPath = join(tmpdir(), `captions-${Date.now()}.ass`);
await Bun.write(assPath, ass);

// ---------- Burn captions ----------

console.log("Burning captions (this re-encodes the video)...");
const startTime = performance.now();

try {
  await burnCaptions(videoPath, assPath, outputPath);
} finally {
  try {
    await Bun.spawn(["rm", assPath]).exited;
  } catch {}
}

const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
console.log(`\nDone! Output: ${outputPath}`);
console.log(`Encoding took ${elapsed}s`);
