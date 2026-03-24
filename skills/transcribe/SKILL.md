---
name: transcribe
description: |
  Transcribe audio and video files using Audetic whisper service. Use when:
  (1) User wants to transcribe an audio or video file
  (2) User has a recording and needs a text transcript
  (3) User wants transcript analysis (gaps, speech rate, silence detection)
  (4) User wants to transcribe all media files in a directory
  Triggers: "transcribe", "transcription", "transcript", "speech to text", "audio to text", "transcribe audio", "transcribe video", "transcribe recording"
---

# Transcribe

Transcribe any audio or video file using the Audetic whisper service, producing a JSON transcript, readable markdown, and signal analysis.

## Prerequisites

- **bun** — TypeScript runtime
- **ffmpeg** / **ffprobe** — media processing (must be on PATH)

Environment variables (optional, have defaults):

| Variable | Purpose | Default |
|----------|---------|---------|
| `AUDETIC_API_URL` | Audetic transcription service URL | `https://audio.audetic.link` |

## Commands

All paths are relative to this skill's directory. Run with `bun run`.

| Command | Purpose |
|---------|---------|
| `scripts/transcribe.ts <media-file>` | Transcribe a single audio or video file — produces JSON + markdown transcript + analysis alongside the file |
| `scripts/transcribe.ts <directory>` | Transcribe all media files in a directory — produces merged JSON + markdown transcript + analysis in the directory |

## Supported Formats

| Type | Extensions |
|------|------------|
| Audio | mp3, wav, flac, ogg, m4a, aac, wma |
| Video | mp4, mkv, mov, webm, ts |

## Workflow — Single File

### 1. Transcribe

```bash
bun run scripts/transcribe.ts <media-file>
```

Compresses audio to MP3, uploads to the Audetic transcription service, and produces three files alongside the media file:
- `.json` — transcription result (structured data with word-level timestamps)
- `-transcript.md` — readable transcript table
- `-analysis.md` — transcript with signal flags (gaps, speech rate)

### 2. Read the Output

The transcript markdown is a numbered table of segments with timestamps and text. The analysis adds signal flags:

| Flag | Meaning |
|------|---------|
| `gap:Xs` | Silence of X seconds before this segment |
| `slow` | Fewer than 0.5 words/second (typing, long pauses, dead air) |
| `silence` | Zero words detected in segment |

See [references/signal-interpretation.md](references/signal-interpretation.md) for detailed signal guidance.

## Workflow — Multiple Files (Directory)

### 1. Transcribe All Files

```bash
bun run scripts/transcribe.ts <directory>
```

Finds all supported media files, transcribes each one, and produces merged output in the directory:
- `transcript.json` — merged transcript with `source` field on each segment
- `transcript.md` — merged readable table with Source column
- `analysis.md` — merged analysis with Source column (gap detection resets at file boundaries)

## Output File Naming

### Single-file mode

| Output | Pattern |
|--------|---------|
| Transcript JSON | `<name>.json` |
| Transcript MD | `<name>-transcript.md` |
| Analysis MD | `<name>-analysis.md` |

### Directory mode

| Output | Pattern |
|--------|---------|
| Transcript JSON | `transcript.json` |
| Transcript MD | `transcript.md` |
| Analysis MD | `analysis.md` |

## Tips

- **Large files**: Transcription time scales with file length. For files over 30 minutes, warn the user it may take a while.
- **MP3 compression**: Files are compressed to mono MP3 before upload, with adaptive bitrate to stay under 100 MB.
- **Word-level timestamps**: The JSON output includes word-level timestamps when available from the verbose API response.
- **Multi-file source tracking**: In directory mode, each segment tracks its source file, so you can trace any text back to its origin.
