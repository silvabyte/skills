import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

let tempDir: string;

function makeEdl(segments: { source: string; start: string; end: string; label?: string }[]) {
  return {
    output: "/tmp/test-output.mp4",
    segments: segments.map((s) => ({ ...s })),
  };
}

async function writeEdl(edl: object): Promise<string> {
  const edlPath = join(tempDir, "test-edl.json");
  await Bun.write(edlPath, JSON.stringify(edl, null, 2));
  return edlPath;
}

async function readEdl(edlPath: string) {
  return JSON.parse(await Bun.file(edlPath).text());
}

async function runAdjust(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(["bun", "run", join(import.meta.dir, "adjust.ts"), ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const exitCode = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  return { exitCode, stdout, stderr };
}

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "adjust-test-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("adjust --segment", () => {
  test("trim end by relative delta", async () => {
    const edlPath = await writeEdl(
      makeEdl([{ source: "/tmp/a.mp4", start: "00:00:00.000", end: "00:02:15.500", label: "Intro" }])
    );
    const { exitCode } = await runAdjust([edlPath, "--segment", "1", "--end", "-0.5s"]);
    expect(exitCode).toBe(0);
    const edl = await readEdl(edlPath);
    expect(edl.segments[0].end).toBe("00:02:15.000");
  });

  test("extend end by relative delta", async () => {
    const edlPath = await writeEdl(
      makeEdl([{ source: "/tmp/a.mp4", start: "00:00:00.000", end: "00:02:00.000" }])
    );
    const { exitCode } = await runAdjust([edlPath, "--segment", "1", "--end", "+2s"]);
    expect(exitCode).toBe(0);
    const edl = await readEdl(edlPath);
    expect(edl.segments[0].end).toBe("00:02:02.000");
  });

  test("adjust start by relative delta", async () => {
    const edlPath = await writeEdl(
      makeEdl([{ source: "/tmp/a.mp4", start: "00:00:05.000", end: "00:02:00.000" }])
    );
    const { exitCode } = await runAdjust([edlPath, "--segment", "1", "--start", "+1s"]);
    expect(exitCode).toBe(0);
    const edl = await readEdl(edlPath);
    expect(edl.segments[0].start).toBe("00:00:06.000");
  });

  test("set absolute end", async () => {
    const edlPath = await writeEdl(
      makeEdl([{ source: "/tmp/a.mp4", start: "00:00:00.000", end: "00:02:00.000" }])
    );
    const { exitCode } = await runAdjust([edlPath, "--segment", "1", "--end", "00:01:00.000"]);
    expect(exitCode).toBe(0);
    const edl = await readEdl(edlPath);
    expect(edl.segments[0].end).toBe("00:01:00.000");
  });

  test("set absolute start", async () => {
    const edlPath = await writeEdl(
      makeEdl([{ source: "/tmp/a.mp4", start: "00:00:00.000", end: "00:02:00.000" }])
    );
    const { exitCode } = await runAdjust([edlPath, "--segment", "1", "--start", "00:00:05.000"]);
    expect(exitCode).toBe(0);
    const edl = await readEdl(edlPath);
    expect(edl.segments[0].start).toBe("00:00:05.000");
  });

  test("borrow across seconds boundary", async () => {
    const edlPath = await writeEdl(
      makeEdl([{ source: "/tmp/a.mp4", start: "00:00:00.000", end: "00:01:00.500" }])
    );
    const { exitCode } = await runAdjust([edlPath, "--segment", "1", "--end", "-1s"]);
    expect(exitCode).toBe(0);
    const edl = await readEdl(edlPath);
    expect(edl.segments[0].end).toBe("00:00:59.500");
  });
});

describe("adjust --remove", () => {
  test("remove a segment from multi-segment EDL", async () => {
    const edlPath = await writeEdl(
      makeEdl([
        { source: "/tmp/a.mp4", start: "00:00:00.000", end: "00:01:00.000", label: "Intro" },
        { source: "/tmp/a.mp4", start: "00:02:00.000", end: "00:03:00.000", label: "Middle" },
        { source: "/tmp/a.mp4", start: "00:04:00.000", end: "00:05:00.000", label: "End" },
      ])
    );
    const { exitCode, stdout } = await runAdjust([edlPath, "--remove", "2"]);
    expect(exitCode).toBe(0);
    const edl = await readEdl(edlPath);
    expect(edl.segments).toHaveLength(2);
    expect(edl.segments[0].label).toBe("Intro");
    expect(edl.segments[1].label).toBe("End");
    expect(stdout).toContain("Removed segment 2");
  });
});

describe("adjust errors", () => {
  test("error: negative timestamp", async () => {
    const edlPath = await writeEdl(
      makeEdl([{ source: "/tmp/a.mp4", start: "00:00:01.000", end: "00:02:00.000" }])
    );
    const { exitCode, stderr } = await runAdjust([edlPath, "--segment", "1", "--start", "-5s"]);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("negative");
  });

  test("error: start >= end", async () => {
    const edlPath = await writeEdl(
      makeEdl([{ source: "/tmp/a.mp4", start: "00:00:00.000", end: "00:00:05.000" }])
    );
    const { exitCode, stderr } = await runAdjust([edlPath, "--segment", "1", "--end", "00:00:00.000"]);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("at or after end");
  });

  test("error: out of bounds segment", async () => {
    const edlPath = await writeEdl(
      makeEdl([
        { source: "/tmp/a.mp4", start: "00:00:00.000", end: "00:01:00.000" },
        { source: "/tmp/a.mp4", start: "00:02:00.000", end: "00:03:00.000" },
        { source: "/tmp/a.mp4", start: "00:04:00.000", end: "00:05:00.000" },
      ])
    );
    const { exitCode, stderr } = await runAdjust([edlPath, "--segment", "10", "--end", "-0.5s"]);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("does not exist");
    expect(stderr).toContain("3 segments");
  });

  test("error: remove last segment", async () => {
    const edlPath = await writeEdl(
      makeEdl([{ source: "/tmp/a.mp4", start: "00:00:00.000", end: "00:01:00.000" }])
    );
    const { exitCode, stderr } = await runAdjust([edlPath, "--remove", "1"]);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("only remaining segment");
  });
});
