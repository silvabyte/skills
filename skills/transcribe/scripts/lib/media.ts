/** Get media duration in seconds using ffprobe */
export async function getMediaDuration(path: string): Promise<number> {
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
