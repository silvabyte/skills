---
name: edit-video
description: |
  Conversational video editing: transcribe, plan edits using transcript analysis, and render. Use when:
  (1) User wants to edit a video by reviewing its transcript
  (2) User asks to trim, cut, or rearrange video segments
  (3) User wants to create a highlight reel or narrative cut from a longer video
  (4) User mentions EDL, transcript analysis, or video editing workflow
  (5) User wants to remove filler, dead air, or silence from a video
  Triggers: "edit video", "transcribe video", "trim video", "cut video", "EDL", "video editing", "remove filler"
---

# Edit Video

Conversational video editing in three phases: transcribe, plan the edit, render.

## Prerequisites

- **bun** — TypeScript runtime
- **ffmpeg** / **ffprobe** — video processing (must be on PATH)
- **whisper-cli** — speech-to-text (local whisper.cpp build)

Environment variables (optional, have defaults):

| Variable | Purpose | Default |
|----------|---------|---------|
| `WHISPER_CLI_PATH` | Path to whisper-cli binary | `~/code/matsilva/whisper/build/bin/whisper-cli` |
| `WHISPER_MODEL_PATH` | Path to whisper GGML model | `~/code/matsilva/whisper/models/ggml-large-v3-turbo-q5_1.bin` |

## Commands

All paths are relative to this skill's directory. Run with `bun run`.

| Command | Purpose |
|---------|---------|
| `scripts/transcribe.ts <video>` | Transcribe video, produce JSON + markdown transcript + analysis |
| `scripts/preview.ts <edl.json>` | Validate and preview an EDL before rendering |
| `scripts/render.ts <edl.json>` | Render final video from EDL using ffmpeg stream copy |

## Workflow

### 1. Transcribe

```bash
bun run scripts/transcribe.ts <video-file>
```

Produces three files alongside the video:
- `.json` — raw whisper output (used by tools)
- `-transcript.md` — readable transcript table
- `-analysis.md` — transcript with signal flags (gaps, speech rate)

### 2. Plan the Edit

Read both the transcript and the analysis. The analysis provides mechanical signals:

| Flag | Meaning |
|------|---------|
| `gap:Xs` | Silence of X seconds before this segment |
| `slow` | Fewer than 0.5 words/second (typing, long pauses, dead air) |
| `silence` | Zero words detected in segment |
| WPS column | Words per second (higher = denser speech) |

See [references/signal-interpretation.md](references/signal-interpretation.md) for detailed signal guidance.

Use these signals combined with your understanding of the content to decide what to keep/cut. The tool detects silence and pacing; you judge what's filler vs. substance.

When the edit plan is decided, write an EDL (Edit Decision List) JSON file:

```json
{
  "source": "/absolute/path/to/video.mp4",
  "output": "/absolute/path/to/output.mp4",
  "segments": [
    { "start": "00:00:00.000", "end": "00:02:15.500", "label": "Introduction" },
    { "start": "00:05:30.000", "end": "00:12:45.200", "label": "Main discussion" }
  ]
}
```

- Timestamps must be `HH:MM:SS.mmm` format (ffmpeg-native)
- Segments are in playback order — rearranging segments reorders the output
- `label` is optional, helps communicate what each segment is
- Only included segments appear in the output; everything else is cut

See [references/edl-schema.md](references/edl-schema.md) for the full schema reference.

### 3. Preview

```bash
bun run scripts/preview.ts <edl.json>
```

Always preview before rendering. Shows segment breakdown, kept/cut percentages, and validates the EDL.

### 4. Render

```bash
bun run scripts/render.ts <edl.json>
```

Uses ffmpeg stream copy (fast, cuts at nearest keyframe). Produces the final video.

## Narrative Editing

Use narrative editing when the user provides a goal beyond "trim the filler" — a theme, tone, target duration, or audience.

See [references/narrative-patterns.md](references/narrative-patterns.md) for the full pattern catalog.

**Thinking process:**
1. Read transcript + analysis. Identify distinct *moments* / content beats.
2. Decide which moments serve the stated narrative goal.
3. Determine the best *order* — chronological is one option, but also consider: Hook-first, Escalation, Question-answer, Bookend.
4. Label each segment with its narrative role.
5. Sum segment durations to verify against target.

**Labels as narrative roles:** Use the `label` field to document function (e.g., `"HOOK: the punchline"`, `"SETUP: context"`, `"PAYOFF: resolution"`).

**Narrative notes:** Use the optional `narrative_notes` field in the EDL to document editorial reasoning.

Example:
```json
{
  "source": "/path/to/video.mp4",
  "output": "/path/to/output.mp4",
  "narrative_notes": "Goal: 60s punchy clip. Led with the reaction for hook, then backed into the setup.",
  "segments": [
    { "start": "00:05:30.000", "end": "00:05:55.000", "label": "HOOK: surprised reaction" },
    { "start": "00:01:00.000", "end": "00:02:15.500", "label": "SETUP: reading the tweet" },
    { "start": "00:06:00.000", "end": "00:06:30.000", "label": "PAYOFF: final take" }
  ]
}
```

## Output File Naming

The `outputPaths` function in `scripts/lib/config.ts` generates standard paths relative to the video:

| Output | Pattern |
|--------|---------|
| Transcript JSON | `<name>.json` |
| Transcript MD | `<name>-transcript.md` |
| Analysis MD | `<name>-analysis.md` |
| EDL | `<name>-edl.json` |
| Edited video | `<name>-edited.mp4` |

## Session Flow

Typical step-by-step for a full edit session:

1. User provides a video file path
2. Run `transcribe.ts` on it
3. Read the `-analysis.md` and `-transcript.md` files
4. Discuss with user what to keep/cut (or accept a narrative goal)
5. Write the EDL JSON file
6. Run `preview.ts` to validate — review with user
7. Run `render.ts` to produce the final video
8. Report output path and final duration

## Tips

- **Keyframe imprecision**: Stream copy cuts at the nearest keyframe, so cuts may be off by up to ~0.5s. This is the tradeoff for fast rendering without re-encoding.
- **Large videos**: Transcription time scales with video length. For videos over 30 minutes, warn the user it may take a while.
- **Always preview first**: Never render without previewing. The preview catches validation errors and lets the user confirm before committing.
- **Duration targeting**: When given a target duration, sum the `Dur` column values from the analysis for selected segments. Iterate until the EDL fits.
- **Reinterpret signals**: Gaps aren't just cut candidates — they mark topic boundaries. Slow segments aren't always boring — a pause before a realization can be dramatic.
