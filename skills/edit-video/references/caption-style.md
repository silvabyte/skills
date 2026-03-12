# Caption Style Reference

## When to Offer Captions

Offer captions when:
- User mentions Shorts, Reels, TikTok, or short-form content
- User asks for "add captions", "burn captions", or "shorts captions"
- Content is portrait/vertical (1080x1920 or similar)
- User explicitly requests burned-in text

## Hormozi Style Defaults

The default caption style follows the "Hormozi style" popularized on YouTube Shorts:

| Property | Default | Notes |
|----------|---------|-------|
| Font | Arial Black | Bold, high-impact sans-serif |
| Size | 8% of video height | ~154px on 1080x1920 portrait |
| Text color | White (`&H00FFFFFF`) | ASS uses AABBGGRR format |
| Outline color | Black (`&H00000000`) | Thick black stroke |
| Outline width | 4 | Ensures readability on any background |
| Alignment | 5 (center-center) | Centered horizontally and vertically |
| Shadow | 0 | No shadow — outline alone provides contrast |
| Words per group | 2 | Punchy, 1-3 words at a time |

## Style Parameters

All defaults can be overridden via the `CaptionStyle` interface:

```typescript
interface CaptionStyle {
  fontName: string;      // e.g., "Impact", "Montserrat ExtraBold"
  fontSize: number;      // absolute pixel size
  primaryColor: string;  // ASS color format &HAABBGGRR
  outlineColor: string;  // ASS color format &HAABBGGRR
  outlineWidth: number;  // stroke width in pixels
  bold: boolean;         // bold flag
  alignment: number;     // ASS alignment (1-9 numpad layout)
  marginV: number;       // vertical margin in pixels
}
```

## Word Grouping

The `wordsPerGroup` parameter controls pacing:
- **1 word**: Maximum impact, one word at a time (very fast-paced)
- **2 words** (default): Punchy Shorts pacing
- **3 words**: Slightly more readable, good for longer content

## Word-Level Timestamps

The transcription service returns BPE tokens from whisper.cpp that get merged into real words:
- Token starting with space = new word boundary
- Token without leading space = continuation of previous word
- Examples: `" ar"` + `"ctic"` → `"arctic"`, `" gu"` + `"ava"` → `"guava"`
- Punctuation tokens (`.`, `,`) attach to the previous word

When word-level data is unavailable, words are evenly distributed across the segment duration (estimation fallback).

## EDL Remapping

When captioning a rendered (edited) video, the transcript timestamps refer to the original source video, not the output. Use `--edl` to remap:

```bash
bun run scripts/caption.ts output-edited.mp4 transcript.json --edl edl.json
```

The remapper:
- Matches transcript segments to EDL entries by source path and time overlap
- Discards segments outside any EDL cut
- Clamps segment boundaries at EDL edges
- Shifts times to output-video timeline

## Example Commands

Basic captioning:
```bash
bun run scripts/caption.ts video.mp4 video.json
# → video-captioned.mp4
```

With EDL remapping:
```bash
bun run scripts/caption.ts video-edited.mp4 video.json --edl video-edl.json
# → video-edited-captioned.mp4
```

Custom output path:
```bash
bun run scripts/caption.ts video.mp4 video.json --output /path/to/output.mp4
```

## Re-encoding Note

Burning captions requires a full video re-encode (libx264, CRF 18, fast preset). This is slower than stream-copy operations used in rendering. Expect encoding time roughly proportional to video duration.

## Font Troubleshooting

If Arial Black is not installed, ASS will fall back to the system's default sans-serif font. To check available fonts:

```bash
fc-list | grep -i "arial black"
```

Install on Debian/Ubuntu:
```bash
sudo apt install ttf-mscorefonts-installer
```

On Arch:
```bash
yay -S ttf-ms-fonts
```
