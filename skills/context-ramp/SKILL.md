---
name: context-ramp
description: Context-ramp dense repositories, documents, or topics into source-grounded visual-auditory micro-lessons with active recall. Use when the user needs to absorb substantial context, asks to be ramped in, wants a narrated visual explanation, or wants recall practice; rewrite-only requests are out of scope.
compatibility: macOS or Linux with Node.js 18+ for local Magpie narration; Python 3.10-3.12 for optional Kokoro 0.9.4 fallback. Lessons remain usable without a TTS runtime.
---

# Context Ramp

A ramp gets the user moving through context. It is not a compressed document dump. Remember the
loop as **Result, Atlas, Microbites, Prove**.

## 1. Result: set the destination

Extract the real task the context must enable. Ask one short question only when the destination is
ambiguous. State the destination in one sentence and name the source boundary.

Completion criterion: the destination describes an observable action, decision, or explanation.

## 2. Atlas: build the evidence map

Read the authoritative material before simplifying it. For repositories, obey their evidence and
authority rules. Classify facts, decisions, proposals, contradictions, and inference rather than
flattening them into one confident story.

Choose 3-7 landmarks. Connect them by cause, sequence, authority, or contrast. Give every landmark
an exact source anchor.

Completion criterion: the map covers the destination, every claim has provenance, and uncertainty
remains visible.

## 3. Microbites: deliver one bite at a time

Use chat for a quick ramp and a self-contained HTML deck for multi-document or repository ramps.
Each bite has:

- one claim or relationship;
- one meaningful visual;
- at most 45 visible words;
- optional 20-45 second narration;
- one source anchor;
- one answer-before-reveal recall prompt.

Keep a persistent `YOU ARE HERE` marker and truthful progress count. Audio starts only on request and
has stop, replay, speed, transcript, and silent alternatives. Narration explains the visual; it does
not read a dense screen word for word.

After each bite, stop. Accept `next`, `deeper`, `replay`, `map`, `source`, or an answer to the recall
prompt. Treat passive exposure as incomplete; continue after a recall attempt or explicit skip.

Completion criterion: the user has attempted recall before seeing the correction or explicitly
chosen to skip.

### Narration engine

Generate narration locally at authoring time and attach the resulting WAV. The default engine is
NVIDIA MagpieTTS Multilingual 357M through a loopback NeMo-Speech.cpp service. Keep the service bound
to `127.0.0.1`; source text stays on the machine.

If the service is not installed, show the user the roughly 3.5 GB model/runtime setup before running:

```bash
bash <path-to-skill>/scripts/local-tts.sh install
bash <path-to-skill>/scripts/local-tts.sh serve
```

With the service running, generate each clip to a new content-specific path:

```bash
node <path-to-skill>/scripts/render-narration-local.mjs \
  --input narration.txt \
  --output narration.wav
```

For the low-resource fallback, install the pinned Kokoro package. The first run downloads a pinned
model snapshot; later runs can enforce cache-only operation with `--offline`:

```bash
python -m pip install 'kokoro==0.9.4' soundfile numpy
```

```bash
python <path-to-skill>/scripts/render-narration-kokoro.py \
  --offline \
  --input narration.txt \
  --output narration.wav
```

If the local engine is unavailable, keep the transcript and omit audio. Do not send narration to a
hosted TTS provider and do not substitute browser `speechSynthesis`.

Label generated speech as AI audio. Use a stock licensed voice unless documented, scope-specific
consent permits a cloned voice. Read [`references/local-tts-selection.md`](references/local-tts-selection.md)
before changing models, runtimes, voices, licenses, or offline behavior.

## 4. Prove transfer

End with a realistic task, not a recognition quiz. Ask the user to reconstruct the map, locate the
source of a claim, distinguish a confusable pair, predict a consequence, or choose the next action.
Record misses as the review queue; do not record material merely shown.

Completion criterion: the user can state the thesis, reconstruct the important relationship, mark
one uncertainty, and take the destination action. Otherwise, make a shorter second ramp around the
miss.

## Focus lab

When the user requests attention, focus, ADHD, or initiation support, offer at most two experiments
per ramp. Otherwise, omit the focus lab. Label experiments honestly:

- **Strong/general:** answer-before-reveal retrieval, spaced revisit, visible progress, an editable
  if-then start plan.
- **Promising/individual:** adjustable focus sprint, quiet body double, walking narration, harmless
  fidget, low-volume non-speech noise, or temptation bundling.

Measure `started`, `completed`, and delayed recall. Keep what improves the result; retire what only
feels novel. Use fixed feedback and user-chosen rewards. Protect sleep, autonomy, and prescribed
care; route medication or health changes to a clinician.

## Presentation contract

- Start with the map and consequence, not history.
- One paragraph is at most three short lines. One list is at most three items.
- Prefer flows, contrasts, timelines, spatial grouping, and concrete analogies over decorative art.
- Use visual and audio preferences for access and engagement, not as a learning-style diagnosis.
- Keep transcripts searchable and source material reachable.
- Keep audio user-controlled and feedback fixed. Exclude background audio under speech, artificial
  urgency, shame, streak loss, random rewards, casino mechanics, and dopamine-hack claims.
- Mark unresolved material `OPEN`, proposals `PROPOSAL`, and approved decisions with their owner and
  decision record.

When choosing focus experiments, making health claims, or designing a reusable deck, read
[`references/evidence.md`](references/evidence.md) for evidence grades, rationale, safety boundaries,
and citations.
