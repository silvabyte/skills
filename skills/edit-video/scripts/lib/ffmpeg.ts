import { join } from "path";
import { tmpdir } from "os";

export interface VideoInfo {
  codec: string;
  width: number;   // display width (after rotation)
  height: number;  // display height (after rotation)
  pixFmt: string;
  frameRate: string;
  rotation: number; // 0, 90, -90, 180, etc.
}

/** Probe video stream info (returns display dimensions, accounting for rotation) */
export async function getVideoInfo(path: string): Promise<VideoInfo> {
  const proc = Bun.spawn(
    [
      "ffprobe",
      "-v", "quiet",
      "-select_streams", "v:0",
      "-show_entries", "stream=codec_name,width,height,pix_fmt,r_frame_rate:stream_side_data=rotation",
      "-of", "json",
      path,
    ],
    { stdout: "pipe", stderr: "ignore" }
  );
  const output = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`ffprobe failed for ${path}`);
  }
  const data = JSON.parse(output);
  const s = data.streams[0];

  // Extract rotation from side_data
  let rotation = 0;
  if (s.side_data_list) {
    for (const sd of s.side_data_list) {
      if (sd.rotation !== undefined) {
        rotation = Number(sd.rotation);
      }
    }
  }

  // Swap width/height for 90/270 degree rotations to get display dimensions
  const isRotated = Math.abs(rotation) === 90 || Math.abs(rotation) === 270;
  const displayWidth = isRotated ? s.height : s.width;
  const displayHeight = isRotated ? s.width : s.height;

  return {
    codec: s.codec_name,
    width: displayWidth,
    height: displayHeight,
    pixFmt: s.pix_fmt,
    frameRate: s.r_frame_rate,
    rotation,
  };
}

/** Check if sources need re-encoding to concatenate cleanly */
export function needsTranscode(infos: VideoInfo[]): boolean {
  if (infos.length <= 1) return false;
  const first = infos[0];
  return infos.some(
    (info) =>
      info.codec !== first.codec ||
      info.width !== first.width ||
      info.height !== first.height ||
      info.pixFmt !== first.pixFmt
  );
}

/** Extract a segment from a video using stream copy (fast, same-codec only) */
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

/** Extract a segment and transcode to a uniform format for concatenation */
export async function extractSegmentTranscode(
  input: string,
  start: string,
  end: string,
  output: string,
  opts: { width: number; height: number; frameRate: number }
) {
  const proc = Bun.spawn(
    [
      "ffmpeg", "-y",
      "-ss", start, "-to", end, "-i", input,
      "-vf", `scale=${opts.width}:${opts.height}:force_original_aspect_ratio=decrease,pad=${opts.width}:${opts.height}:(ow-iw)/2:(oh-ih)/2,setsar=1`,
      "-r", String(opts.frameRate),
      "-c:v", "libx264", "-preset", "fast", "-crf", "18",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "192k",
      output,
    ],
    { stdout: "ignore", stderr: "pipe" }
  );
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`ffmpeg transcode failed (code ${exitCode}): ${stderr}`);
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
