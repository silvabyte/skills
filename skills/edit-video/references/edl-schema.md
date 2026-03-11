# EDL Schema Reference

The Edit Decision List (EDL) is a JSON file that describes which segments to extract from source videos and in what order.

## Schema

Validated with Zod in `scripts/lib/edl.ts`.

### Top-level fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `output` | string | yes | Absolute path for the rendered output file |
| `segments` | Segment[] | yes | Array of segments to include (min 1) |
| `narrative_notes` | string | no | Editorial reasoning — shown by preview tool |

### Segment fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source` | string | yes | Absolute path to the source video file for this segment |
| `start` | string | yes | Start timestamp in `HH:MM:SS.mmm` format |
| `end` | string | yes | End timestamp in `HH:MM:SS.mmm` format |
| `label` | string | no | Human-readable description of the segment |

## Timestamp Format

Timestamps must match the regex `/^\d{2}:\d{2}:\d{2}\.\d{3}$/`:

- `HH` — hours (00-99)
- `MM` — minutes (00-59)
- `SS` — seconds (00-59)
- `mmm` — milliseconds (000-999)

Examples: `00:00:00.000`, `00:05:30.500`, `01:23:45.678`

**Important:** Use dots (`.`), not commas. Whisper outputs commas (`00:00:00,000`) but EDL requires dots (`00:00:00.000`).

## Segment Ordering

Segments appear in the output in the order they are listed in the `segments` array.

- **Chronological order**: Segments ordered by ascending `start` time. Standard for trim edits.
- **Non-chronological order**: Segments rearranged for narrative effect. The preview tool detects and flags this as a "narrative edit."
- **Multi-source**: Segments can reference different source files. Reorder detection only applies within same-source segments.

Rearranging segments is how you do narrative editing — lead with a punchline, build to a climax, or bookend with related moments.

## Duration Calculation

The `calculateDuration` function computes:

- **keptMs**: Sum of `(end - start)` for all segments
- **cutMs**: `totalSourceDuration - keptMs`
- **Percentage**: `keptMs / totalSourceDuration * 100`

Use duration math during planning to hit target durations.

## Examples

### Single-source trim edit

Remove filler from a 10-minute video, keeping key discussion segments:

```json
{
  "output": "/home/user/videos/meeting-edited.mp4",
  "segments": [
    { "source": "/home/user/videos/meeting.mp4", "start": "00:00:00.000", "end": "00:00:45.000", "label": "Opening remarks" },
    { "source": "/home/user/videos/meeting.mp4", "start": "00:01:30.000", "end": "00:04:15.000", "label": "Feature discussion" },
    { "source": "/home/user/videos/meeting.mp4", "start": "00:06:00.000", "end": "00:08:30.000", "label": "Decision and action items" },
    { "source": "/home/user/videos/meeting.mp4", "start": "00:09:00.000", "end": "00:09:45.000", "label": "Wrap-up" }
  ]
}
```

### Single-source narrative edit

Create a 60-second highlight leading with the most compelling moment:

```json
{
  "output": "/home/user/videos/talk-highlight.mp4",
  "narrative_notes": "Goal: 60s clip for social media. Hook with the demo reveal, back into the problem statement, close with audience reaction.",
  "segments": [
    { "source": "/home/user/videos/talk.mp4", "start": "00:15:00.000", "end": "00:15:25.000", "label": "HOOK: demo reveal moment" },
    { "source": "/home/user/videos/talk.mp4", "start": "00:02:00.000", "end": "00:02:40.000", "label": "SETUP: the problem we're solving" },
    { "source": "/home/user/videos/talk.mp4", "start": "00:15:30.000", "end": "00:15:55.000", "label": "PAYOFF: audience reaction" }
  ]
}
```

### Multi-source edit

Combine clips from multiple video files into a single output:

```json
{
  "output": "/home/user/clips/combined.mp4",
  "narrative_notes": "Best moments from Saturday's clips, chronological order.",
  "segments": [
    { "source": "/home/user/clips/clip001.mp4", "start": "00:00:02.000", "end": "00:00:12.000", "label": "Opening shot" },
    { "source": "/home/user/clips/clip003.mp4", "start": "00:00:00.000", "end": "00:00:08.500", "label": "Key moment" },
    { "source": "/home/user/clips/clip007.mp4", "start": "00:00:01.000", "end": "00:00:14.000", "label": "Closing" }
  ]
}
```

## Common Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Timestamp must be in HH:MM:SS.mmm format` | Wrong format (missing millis, using commas) | Use `00:05:30.000` not `00:05:30` or `00:05:30,000` |
| `EDL must have at least one segment` | Empty segments array | Add at least one segment |
| `Source video not found` | `source` path doesn't exist | Verify the absolute path |
| Segment `end` before `start` | Timestamps swapped | Ensure `start` < `end` for each segment |
| Missing `source` on segment | Segment missing required `source` field | Add `source` with absolute path to each segment |
