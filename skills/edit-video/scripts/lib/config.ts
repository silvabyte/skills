import { join, dirname, basename } from "path";

export const WHISPER_CLI =
  process.env.WHISPER_CLI_PATH ??
  "/home/matsilva/code/matsilva/whisper/build/bin/whisper-cli";
export const WHISPER_MODEL =
  process.env.WHISPER_MODEL_PATH ??
  "/home/matsilva/code/matsilva/whisper/models/ggml-large-v3-turbo-q5_1.bin";

/** Number of threads for whisper (defaults to all available CPUs) */
export const WHISPER_THREADS = navigator.hardwareConcurrency ?? 8;

/** Build output paths relative to the video file */
export function outputPaths(videoPath: string) {
  const dir = dirname(videoPath);
  const name = basename(videoPath).replace(/\.[^.]+$/, "");
  return {
    transcriptJson: join(dir, `${name}.json`),
    transcriptMd: join(dir, `${name}-transcript.md`),
    analysisMd: join(dir, `${name}-analysis.md`),
    edl: join(dir, `${name}-edl.json`),
    output: join(dir, `${name}-edited.mp4`),
  };
}
