# Narrative Editing Patterns

Guidance for when and how to apply narrative structure to video edits.

## When Narrative Editing Applies

Use narrative editing when the user provides a goal beyond "trim the filler":
- A theme or angle ("make it about the technical challenges")
- A tone ("make it punchy" / "keep it thoughtful")
- A target duration ("60 seconds for social media")
- An audience ("for the engineering team" / "for Twitter")

If the user just says "clean it up" or "remove dead air," use a standard chronological trim edit instead.

## Thinking Process

1. **Identify beats** — Read the transcript and analysis. Mark distinct content moments: a joke, an insight, a demonstration, a reaction, a question, a resolution.

2. **Select for the goal** — Which beats serve the narrative goal? Cut everything that doesn't serve the stated purpose, even if it's interesting.

3. **Order for impact** — Decide the arrangement. Chronological is one option but rarely the most compelling. Consider the patterns below.

4. **Label with roles** — Use the `label` field to document what narrative function each segment serves. This makes the EDL self-documenting and easier to review.

5. **Verify duration** — Sum segment durations from the `Dur` column. Iterate on selection until the EDL fits within target.

## Pattern Catalog

### Hook-first

Lead with the punchline, most surprising moment, or strongest emotional beat. Then back into the context.

**When to use:** Social media clips, presentations that need to grab attention, "why should I care?" content.

**Structure:**
1. HOOK — the compelling moment
2. SETUP — context that makes the hook meaningful
3. PAYOFF — resolution or callback

### Escalation

Build from mild to strong. Start with the small version of the idea and build to the biggest expression.

**When to use:** Arguments building to a conclusion, tutorials that layer concepts, "it gets worse/better" content.

**Structure:**
1. INTRO — the mild starting point
2. BUILD — increasing stakes/complexity
3. PEAK — the climax or strongest point

### Question-answer

Pose a problem or question, then show the resolution.

**When to use:** Problem-solving walkthroughs, debugging sessions, "how did they do it?" content.

**Structure:**
1. QUESTION — the problem or mystery
2. EXPLORATION — the journey (optional, can be trimmed)
3. ANSWER — the resolution

### Bookend

Related moments at start and end that frame the content in between. Creates a sense of completeness.

**When to use:** Reflective content, "before and after," thematic pieces.

**Structure:**
1. OPEN — the framing moment
2. BODY — the content
3. CLOSE — callback to the opening moment

## Label Conventions

Use these prefixes in the `label` field for clarity:

| Prefix | Meaning |
|--------|---------|
| `HOOK:` | Opening attention-grabber |
| `COLD OPEN:` | Opening without context (variant of hook) |
| `SETUP:` | Context or backstory |
| `BUILD:` | Escalation toward climax |
| `PEAK:` | Climax or strongest moment |
| `PAYOFF:` | Resolution or punchline delivery |
| `BRIDGE:` | Transition between major sections |
| `CLOSE:` | Ending or callback |

Example: `"HOOK: audience gasps at the demo"`

## Duration Targeting

When given a target duration:

1. Sum the `Dur` column values for your candidate segments
2. Compare against target — allow ~10% flex for keyframe imprecision
3. If over target, cut the weakest beats first (bridges, secondary setups)
4. If under target, look for additional beats that serve the narrative
5. Document in `narrative_notes` why certain beats were cut

Target ranges:
- **30s clip**: 1-3 segments, very tight — usually hook + payoff only
- **60s clip**: 3-5 segments, room for setup
- **2-3 min highlight**: 5-10 segments, can include build and transitions
- **5+ min edit**: Full narrative arc possible
