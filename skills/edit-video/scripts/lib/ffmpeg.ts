import { join } from "path";
import { tmpdir } from "os";

/** Extract a segment from a video using stream copy */
export async function extractSegment(
  input: string,
  start: string,
  end: string,
  output: string
) {
  const proc = Bun.spawn(
    ["ffmpeg", "-y", "-ss", start, "-to", end, "-i", input, "-c", "copy", output],
    { stdout: "ignore", stderr: "pipe" }
  );
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`ffmpeg segment extraction failed (code ${exitCode}): ${stderr}`);
  }
}

/** Concatenate segment files using ffmpeg concat demuxer */
export async function concatenateSegments(
  segmentPaths: string[],
  output: string
) {
  const listPath = join(tmpdir(), `concat-${Date.now()}.txt`);
  const listContent = segmentPaths
    .map((p) => `file '${p}'`)
    .join("\n");
  await Bun.write(listPath, listContent);

  try {
    const proc = Bun.spawn(
      ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", output],
      { stdout: "ignore", stderr: "pipe" }
    );
    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      throw new Error(`ffmpeg concat failed (code ${exitCode}): ${stderr}`);
    }
  } finally {
    try {
      await Bun.spawn(["rm", listPath]).exited;
    } catch {}
  }
}

/** Get video duration in seconds using ffprobe */
export async function getVideoDuration(path: string): Promise<number> {
  const proc = Bun.spawn(
    [
      "ffprobe",
      "-v", "quiet",
      "-show_entries", "format=duration",
      "-of", "csv=p=0",
      path,
    ],
    { stdout: "pipe", stderr: "ignore" }
  );
  const output = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`ffprobe failed for ${path}`);
  }
  return parseFloat(output.trim());
}
