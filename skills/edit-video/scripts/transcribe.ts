import { resolve } from "path";
import { transcribe } from "./lib/whisper";
import { toMarkdown } from "./lib/transcript";
import { analyzeTranscript, analysisToMarkdown } from "./lib/analyze";
import { outputPaths } from "./lib/config";

const videoPath = process.argv[2];
if (!videoPath) {
  console.error("Usage: bun run scripts/transcribe.ts <video>");
  process.exit(1);
}

const absPath = resolve(videoPath);
const file = Bun.file(absPath);
if (!(await file.exists())) {
  console.error(`File not found: ${absPath}`);
  process.exit(1);
}

const paths = outputPaths(absPath);

// whisper -of expects path without .json extension
const outputBase = paths.transcriptJson.replace(/\.json$/, "");
const result = await transcribe(absPath, outputBase);

const markdown = toMarkdown(result);
await Bun.write(paths.transcriptMd, markdown);

const analysis = analyzeTranscript(result);
const analysisMd = analysisToMarkdown(analysis);
await Bun.write(paths.analysisMd, analysisMd);

console.log(`Transcript JSON: ${paths.transcriptJson}`);
console.log(`Transcript MD:   ${paths.transcriptMd}`);
console.log(`Analysis MD:     ${paths.analysisMd}`);
console.log(`\n${result.transcription.length} segments transcribed.`);
