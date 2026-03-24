import { join, dirname, basename } from "path";

export const AUDETIC_API_URL =
  process.env.AUDETIC_API_URL ?? "https://audio.audetic.link";
export const AUDETIC_POLL_INTERVAL_MS = 3000;

/** Build output paths relative to the media file */
export function outputPaths(mediaPath: string) {
  const dir = dirname(mediaPath);
  const name = basename(mediaPath).replace(/\.[^.]+$/, "");
  return {
    transcriptJson: join(dir, `${name}.json`),
    transcriptMd: join(dir, `${name}-transcript.md`),
    analysisMd: join(dir, `${name}-analysis.md`),
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

/** Audio file extensions */
export const AUDIO_EXTENSIONS = ["mp3", "wav", "flac", "ogg", "m4a", "aac", "wma"];

/** Video file extensions */
export const VIDEO_EXTENSIONS = ["mp4", "mkv", "mov", "webm", "ts"];

/** All supported media file extensions */
export const MEDIA_EXTENSIONS = [...AUDIO_EXTENSIONS, ...VIDEO_EXTENSIONS];
