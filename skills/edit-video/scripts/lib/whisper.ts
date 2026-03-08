import { join } from "path";
import { tmpdir } from "os";
import { WHISPER_CLI, WHISPER_MODEL, WHISPER_THREADS } from "./config";

export interface WhisperSegment {
  timestamps: { from: string; to: string };
  offsets: { from: number; to: number };
  text: string;
}

export interface WhisperResult {
  transcription: WhisperSegment[];
}

/** Extract audio from video as 16kHz mono WAV */
async function extractAudio(videoPath: string, wavPath: string) {
  const proc = Bun.spawn(
    ["ffmpeg", "-y", "-i", videoPath, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wavPath],
    { stdout: "ignore", stderr: "pipe" }
  );
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`ffmpeg audio extraction failed (code ${exitCode}): ${stderr}`);
  }
}

/** Run whisper-cli and return parsed JSON result */
export async function transcribe(videoPath: string, outputBasePath: string): Promise<WhisperResult> {
  const wavPath = join(tmpdir(), `whisper-${Date.now()}.wav`);

  try {
    console.log("Extracting audio...");
    await extractAudio(videoPath, wavPath);

    console.log("Running whisper...");
    const proc = Bun.spawn(
      [
        WHISPER_CLI,
        "-m", WHISPER_MODEL,
        "-f", wavPath,
        "-t", String(WHISPER_THREADS),
        "-oj",
        "-of", outputBasePath,
      ],
      { stdout: "pipe", stderr: "pipe" }
    );

    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      throw new Error(`whisper-cli failed (code ${exitCode}): ${stderr}`);
    }

    // whisper -oj writes to <outputBasePath>.json
    const jsonPath = `${outputBasePath}.json`;
    const file = Bun.file(jsonPath);
    const result: WhisperResult = await file.json();
    return result;
  } finally {
    // Clean up temp wav
    try {
      await Bun.file(wavPath).exists() && (await Bun.spawn(["rm", wavPath]).exited);
    } catch {}
  }
}
