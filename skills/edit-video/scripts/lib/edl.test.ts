import { describe, test, expect } from "bun:test";
import { parseDelta, formatSegmentLine } from "./edl";
import type { Segment } from "./edl";

describe("parseDelta", () => {
  test("parses relative positive delta", () => {
    expect(parseDelta("+0.5s")).toEqual({ type: "relative", deltaMs: 500 });
  });

  test("parses relative negative delta", () => {
    expect(parseDelta("-1.5s")).toEqual({ type: "relative", deltaMs: -1500 });
  });

  test("parses unsigned delta as positive", () => {
    expect(parseDelta("0.5s")).toEqual({ type: "relative", deltaMs: 500 });
  });

  test("parses whole number delta", () => {
    expect(parseDelta("+2s")).toEqual({ type: "relative", deltaMs: 2000 });
  });

  test("parses absolute timestamp", () => {
    expect(parseDelta("00:05:30.000")).toEqual({ type: "absolute", ms: 330000 });
  });

  test("handles float precision", () => {
    expect(parseDelta("+0.3s")).toEqual({ type: "relative", deltaMs: 300 });
  });

  test("throws on invalid format", () => {
    expect(() => parseDelta("abc")).toThrow();
    expect(() => parseDelta("5")).toThrow();
    expect(() => parseDelta("00:05")).toThrow();
    expect(() => parseDelta("+5ms")).toThrow();
  });
});

describe("formatSegmentLine", () => {
  const seg: Segment = {
    source: "/path/to/video.mp4",
    start: "00:00:00.000",
    end: "00:02:15.500",
    label: "Introduction",
  };

  const segNoLabel: Segment = {
    source: "/path/to/video.mp4",
    start: "00:00:00.000",
    end: "00:01:00.000",
  };

  test("formats single-source segment correctly", () => {
    const line = formatSegmentLine(seg, 0, false);
    expect(line).toBe("  1. 00:00:00.000 -> 00:02:15.500  [2m 15s] (Introduction)");
  });

  test("formats multi-source segment with filename tag", () => {
    const line = formatSegmentLine(seg, 0, true);
    expect(line).toBe("  1. 00:00:00.000 -> 00:02:15.500  [2m 15s]  [video.mp4] (Introduction)");
  });

  test("includes label when present", () => {
    const line = formatSegmentLine(seg, 0, false);
    expect(line).toContain("(Introduction)");
  });

  test("omits label when absent", () => {
    const line = formatSegmentLine(segNoLabel, 0, false);
    expect(line).not.toContain("(");
  });

  test("uses 1-based display index", () => {
    const line = formatSegmentLine(seg, 2, false);
    expect(line).toStartWith("  3.");
  });
});
