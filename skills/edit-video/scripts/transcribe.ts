import { resolve, join, basename } from "path";
import { readdir, stat } from "fs/promises";
import { outputPaths, directoryOutputPaths, VIDEO_EXTENSIONS } from "./lib/config";
import { compressToMp3, submitJob, pollJob, toWhisperResult } from "./lib/audetic";
import type { WhisperResult, WhisperSegment } from "./lib/audetic";
import { toMarkdown } from "./lib/transcript";
import { analyzeTranscript, analysisToMarkdown } from "./lib/analyze";

const inputArg = process.argv[2];
if (!inputArg) {
  console.error("Usage: bun run scripts/transcribe.ts <video-or-directory>");
  process.exit(1);
}

const absPath = resolve(inputArg);

// Determine if input is a file or directory
const inputStat = await stat(absPath).catch(() => null);
if (!inputStat) {
  console.error(`Not found: ${absPath}`);
  process.exit(1);
}

if (inputStat.isDirectory()) {
  await transcribeDirectory(absPath);
} else {
  await transcribeSingleFile(absPath);
}

// ---------- Single file mode (original behavior) ----------

async function transcribeSingleFile(videoPath: string) {
  const paths = outputPaths(videoPath);
  const mp3Path = await compressToMp3(videoPath);

  try {
    console.log("Submitting transcription job...");
    const jobId = await submitJob(mp3Path);
    console.log(`Job ID: ${jobId}`);

    const { result: apiResult, verboseResult } = await pollJob(jobId);
    const result = toWhisperResult(apiResult, verboseResult);

    await Bun.write(paths.transcriptJson, JSON.stringify(result, null, 2));

    const markdown = toMarkdown(result);
    await Bun.write(paths.transcriptMd, markdown);

    const analysis = analyzeTranscript(result);
    const analysisMd = analysisToMarkdown(analysis);
    await Bun.write(paths.analysisMd, analysisMd);

    console.log(`Transcript JSON: ${paths.transcriptJson}`);
    console.log(`Transcript MD:   ${paths.transcriptMd}`);
    console.log(`Analysis MD:     ${paths.analysisMd}`);
    console.log(`\n${result.transcription.length} segments transcribed.`);
  } finally {
    try {
      await Bun.spawn(["rm", mp3Path]).exited;
    } catch {}
  }
}

// ---------- Directory mode (multi-file) ----------

async function transcribeDirectory(dirPath: string) {
  // Find all video files, sorted by name
  const entries = await readdir(dirPath);
  const videoFiles = entries
    .filter((name) => {
      const ext = name.split(".").pop()?.toLowerCase();
      return ext && VIDEO_EXTENSIONS.includes(ext);
    })
    .sort()
    .map((name) => join(dirPath, name));

  if (videoFiles.length === 0) {
    console.error(`No video files found in ${dirPath}`);
    console.error(`Supported extensions: ${VIDEO_EXTENSIONS.join(", ")}`);
    process.exit(1);
  }

  console.log(`Found ${videoFiles.length} video files in ${basename(dirPath)}/`);
  for (const f of videoFiles) {
    console.log(`  - ${basename(f)}`);
  }
  console.log();

  const allSegments: WhisperSegment[] = [];
  const mp3Paths: string[] = [];

  try {
    for (let i = 0; i < videoFiles.length; i++) {
      const videoPath = videoFiles[i];
      const name = basename(videoPath);
      console.log(`[${i + 1}/${videoFiles.length}] Transcribing ${name}...`);

      const mp3Path = await compressToMp3(videoPath);
      mp3Paths.push(mp3Path);

      const jobId = await submitJob(mp3Path);
      console.log(`  Job ID: ${jobId}`);

      const { result: apiResult, verboseResult } = await pollJob(jobId);
      const result = toWhisperResult(apiResult, verboseResult);

      // Stamp source onto each segment
      for (const seg of result.transcription) {
        seg.source = videoPath;
      }

      allSegments.push(...result.transcription);
      console.log(`  ${result.transcription.length} segments\n`);
    }

    // Merge into single result
    const merged: WhisperResult = { transcription: allSegments };
    const paths = directoryOutputPaths(dirPath);

    await Bun.write(paths.transcriptJson, JSON.stringify(merged, null, 2));

    const markdown = toMarkdown(merged);
    await Bun.write(paths.transcriptMd, markdown);

    const analysis = analyzeTranscript(merged);
    const analysisMd = analysisToMarkdown(analysis);
    await Bun.write(paths.analysisMd, analysisMd);

    console.log(`Transcript JSON: ${paths.transcriptJson}`);
    console.log(`Transcript MD:   ${paths.transcriptMd}`);
    console.log(`Analysis MD:     ${paths.analysisMd}`);
    console.log(`\n${allSegments.length} segments from ${videoFiles.length} files.`);
  } finally {
    // Clean up all temp MP3s
    for (const mp3 of mp3Paths) {
      try {
        await Bun.spawn(["rm", mp3]).exited;
      } catch {}
    }
  }
}
