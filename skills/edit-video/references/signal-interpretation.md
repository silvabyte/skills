# Signal Interpretation Guide

How to read and use the analysis signals produced by `scripts/transcribe.ts`.

## How Analysis Works

The `analyzeTranscript` function in `scripts/lib/analyze.ts` processes each whisper segment and computes:

1. **Duration** — `endMs - startMs` for each segment
2. **Gap before** — time between previous segment's end and this segment's start
3. **Word count** — whitespace-split count of trimmed text
4. **Words per second (WPS)** — `wordCount / durationSeconds`

Then applies flag rules based on thresholds.

## Flag Thresholds

| Flag | Condition | What it detects |
|------|-----------|-----------------|
| `gap:Xs` | `gapBeforeMs > 1000` | Silence of X seconds before this segment. Shown as `gap:2.5s` etc. |
| `slow` | `WPS < 0.5` AND `durationSec > 2` | Very sparse speech — likely typing, reading, or dead air |
| `silence` | `wordCount === 0` | No words detected at all in the segment |

These are mechanical measurements, not editorial judgments.

## Reading the Analysis Table

The analysis markdown has these columns:

| Column | Meaning |
|--------|---------|
| `#` | Segment number (1-indexed) |
| `Time` | `HH:MM:SS - HH:MM:SS` start and end times |
| `Dur` | Duration in seconds (e.g., `5.2s`) |
| `WPS` | Words per second — speech density |
| `Flags` | Comma-separated signal flags, or `-` if none |
| `Text` | Transcribed text for this segment |

## Interpretation Matrix

Each signal means different things depending on the editing context:

### gap:Xs

| Context | Interpretation |
|---------|---------------|
| **Trim edit** | Likely dead air — candidate for cutting |
| **Narrative edit** | Topic boundary marker — useful for identifying content beats. A gap between two segments may indicate a natural transition point |

### slow

| Context | Interpretation |
|---------|---------------|
| **Trim edit** | Likely typing, screen sharing, or dead air — strong cut candidate |
| **Narrative edit** | Could be a dramatic pause, a moment of realization, or contemplation. Read the text to decide — a slow segment with "wow, I didn't expect that" is a keeper |

### silence

| Context | Interpretation |
|---------|---------------|
| **Trim edit** | Almost always cut |
| **Narrative edit** | Rarely useful, but a beat of silence before a reveal can work as a dramatic pause |

### High WPS (no flag, just column value)

| WPS Range | Typical content |
|-----------|----------------|
| 0.0 | Silence |
| 0.1–0.4 | Very sparse (flagged as `slow` if > 2s) |
| 0.5–1.5 | Normal conversational speech |
| 1.5–2.5 | Dense, energetic speech |
| 2.5+ | Rapid-fire, possibly reading aloud |

## The Human Judgment Layer

Signals are mechanical — they measure timing and density. Editorial decisions require understanding content:

- A `slow` segment might be someone carefully explaining a key concept
- A `gap:3.0s` might be a speaker collecting thoughts before the most important point
- A high-WPS segment might be nervous filler rambling

**The signals tell you *where* to look. You decide *what* to do.**

Always read the actual text of flagged segments before deciding to cut. The flags narrow the field; judgment finishes the job.
