import { tmpdir } from "os";
import { join } from "path";
import { getVideoDuration } from "./ffmpeg";
import { AUDETIC_API_URL, AUDETIC_POLL_INTERVAL_MS } from "./config";

// ---------- Types shared with downstream modules ----------

export interface WhisperWord {
  word: string;      // merged real word, e.g., "arctic", "guava"
  startMs: number;
  endMs: number;
}

export interface WhisperSegment {
  source?: string; // absolute path to source file (set in multi-file mode)
  timestamps: { from: string; to: string };
  offsets: { from: number; to: number };
  text: string;
  words?: WhisperWord[];
}

export interface WhisperResult {
  transcription: WhisperSegment[];
}

// ---------- API response types ----------

interface ApiSegment {
  start: number;
  end: number;
  text: string;
  confidence: number | null;
  speaker: string | null;
}

interface ApiResult {
  text: string;
  segments: ApiSegment[];
  confidence: number;
  duration: number;
  language: string;
  provider: string;
  metadata: Record<string, string>;
}

// ---------- Verbose result types (word-level timestamps) ----------

interface VerboseWord {
  word: string;      // BPE token, e.g., " talking", "ctic", "."
  start: number;     // seconds
  end: number;       // seconds
  probability: number;
}

interface VerboseSegment {
  id: number;
  text: string;
  start: number;
  end: number;
  words: VerboseWord[];
}

interface VerboseResult {
  text: string;
  segments: VerboseSegment[];
}

// ---------- Compress to MP3 ----------

export async function compressToMp3(inputPath: string): Promise<string> {
  const duration = await getVideoDuration(inputPath);
  const targetBytes = 95 * 1024 * 1024; // 95 MB — leaves 5 MB headroom under 100 MB
  const maxKbps = Math.floor((targetBytes * 8) / (duration * 1000));
  const bitrate = Math.max(32, Math.min(192, maxKbps));

  const mp3Path = join(tmpdir(), `audetic-${Date.now()}.mp3`);

  console.log(`Compressing to MP3 (${bitrate}k, ${duration.toFixed(1)}s)...`);
  const proc = Bun.spawn(
    ["ffmpeg", "-y", "-i", inputPath, "-vn", "-ac", "1", "-ar", "44100", "-b:a", `${bitrate}k`, mp3Path],
    { stdout: "ignore", stderr: "pipe" },
  );
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`ffmpeg MP3 compression failed (code ${exitCode}): ${stderr}`);
  }
  return mp3Path;
}

// ---------- Submit transcription job ----------

export async function submitJob(mp3Path: string): Promise<string> {
  const form = new FormData();
  form.append("file", Bun.file(mp3Path));
  form.append("language", "en");
  form.append("timestamps", "true");

  const res = await fetch(`${AUDETIC_API_URL}/api/v1/jobs`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Job submit failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { success: boolean; jobId: string };
  if (!data.success || !data.jobId) {
    throw new Error(`Unexpected submit response: ${JSON.stringify(data)}`);
  }
  return data.jobId;
}

// ---------- Poll for completion ----------

export async function pollJob(jobId: string): Promise<{ result: ApiResult; verboseResult?: VerboseResult }> {
  const maxIterations = 600; // 600 * 3s = 30 min

  for (let i = 0; i < maxIterations; i++) {
    const res = await fetch(`${AUDETIC_API_URL}/api/v1/jobs/${jobId}/status`);
    if (!res.ok) {
      throw new Error(`Status check failed (${res.status}): ${await res.text()}`);
    }

    const data = (await res.json()) as {
      status: string;
      progress: number;
      progressMessage: string;
    };

    console.log(`Transcription: ${data.progress}% - ${data.progressMessage}`);

    if (data.status === "completed") {
      const fullRes = await fetch(`${AUDETIC_API_URL}/api/v1/jobs/${jobId}`);
      if (!fullRes.ok) {
        throw new Error(`Job fetch failed (${fullRes.status}): ${await fullRes.text()}`);
      }
      const body = (await fullRes.json()) as {
        success: boolean;
        job: { result: ApiResult; verboseResult?: VerboseResult };
      };
      return { result: body.job.result, verboseResult: body.job.verboseResult };
    }

    if (data.status === "failed" || data.status === "cancelled") {
      throw new Error(`Transcription ${data.status}: ${data.progressMessage}`);
    }

    // pending | extracting_audio | transcribing → keep polling
    await Bun.sleep(AUDETIC_POLL_INTERVAL_MS);
  }

  throw new Error("Transcription timed out after 30 minutes");
}

// ---------- Map API result → WhisperResult ----------

function formatTimestamp(seconds: number): string {
  const totalMs = Math.round(seconds * 1000);
  const h = Math.floor(totalMs / 3600000);
  const m = Math.floor((totalMs % 3600000) / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return [
    String(h).padStart(2, "0"),
    String(m).padStart(2, "0"),
    String(s).padStart(2, "0"),
  ].join(":") + "," + String(ms).padStart(3, "0");
}

/** Merge BPE tokens into real words using the "starts with space = new word" heuristic */
function mergeTokensToWords(tokens: VerboseWord[]): WhisperWord[] {
  const words: WhisperWord[] = [];

  for (const token of tokens) {
    if (token.word.startsWith(" ")) {
      // New word — trim the leading space
      words.push({
        word: token.word.slice(1),
        startMs: Math.round(token.start * 1000),
        endMs: Math.round(token.end * 1000),
      });
    } else if (words.length > 0) {
      // Continuation token — append to previous word, extend endMs
      const prev = words[words.length - 1];
      prev.word += token.word;
      prev.endMs = Math.round(token.end * 1000);
    } else {
      // First token without leading space (rare edge case)
      words.push({
        word: token.word,
        startMs: Math.round(token.start * 1000),
        endMs: Math.round(token.end * 1000),
      });
    }
  }

  return words;
}

export function toWhisperResult(apiResult: ApiResult, verboseResult?: VerboseResult): WhisperResult {
  const transcription: WhisperSegment[] = apiResult.segments.map((seg, i) => {
    const segment: WhisperSegment = {
      timestamps: {
        from: formatTimestamp(seg.start),
        to: formatTimestamp(seg.end),
      },
      offsets: {
        from: Math.round(seg.start * 1000),
        to: Math.round(seg.end * 1000),
      },
      text: seg.text,
    };

    // Match verbose segments by index (they correspond 1:1)
    const verboseSeg = verboseResult?.segments[i];
    if (verboseSeg?.words?.length) {
      segment.words = mergeTokensToWords(verboseSeg.words);
    }

    return segment;
  });

  return { transcription };
}
