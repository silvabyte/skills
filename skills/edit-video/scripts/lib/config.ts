import { join, dirname, basename } from "path";

export const AUDETIC_API_URL =
  process.env.AUDETIC_API_URL ?? "https://audio.audetic.link";
export const AUDETIC_POLL_INTERVAL_MS = 3000;

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

/** Build output paths for directory (multi-file) mode */
export function directoryOutputPaths(dirPath: string) {
  return {
    transcriptJson: join(dirPath, "transcript.json"),
    transcriptMd: join(dirPath, "transcript.md"),
    analysisMd: join(dirPath, "analysis.md"),
  };
}

/** Video file extensions to look for in directory mode */
export const VIDEO_EXTENSIONS = ["mp4", "mkv", "mov", "webm", "ts"];
