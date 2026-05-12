---
name: unglaze
description: Rewrite glazy, eye-glazing generated content into a tight, scannable, bullet-tight engineering voice. Use when the user says "unglaze", "ungloss this", "punch this up", "tighten this", "less glazy", "eyes glaze", "make my eyes not glaze", "cut the fluff", "rewrite punchier", "make it sharper", "less corporate", "de-fluff", "less LLM-flavored". Also auto-triggers on dissatisfaction signals like "ugh too long", "tldr this", "this is boring", "too much". Applies to PR review output, research summaries, design docs, plans, proposals, and any human-readable artifact the agent produced or the user shared. Out of scope: meeting transcripts (handled by message-in-a-bottle / uncork).
---

# Skill: unglaze

Rewrite content into a bullet-tight engineering voice that survives skim-reading. Replace the original. Preserve every technical fact. Cut everything that doesn't carry information.

## When to apply

- After `code-review`, `pr-review-toolkit`, or `drift-groom` produces a wall-of-text report.
- When the user shares a doc, design, or research summary they want sharpened.
- When the user signals dissatisfaction with output length or style: "ugh, too long", "tldr this", "this is boring", "too much."
- When the user explicitly invokes: "unglaze this", "tighten this", "cut the fluff", etc.

Out of scope: meeting transcripts, action-item extraction (use `message-in-a-bottle` / `uncork`). Code refactoring (other skills). Translation. Tone shifts to "casual" or "friendly" — those can still be glazy.

## Voice: bullet-tight engineering review

Output is scannable. Bullets, not paragraphs. One idea per line. Conclusion first. No preamble. No restatement. No throat-clearing.

## Required structure

1. **Lead with the conclusion.** No "I've reviewed...", no "Here's a summary...", no "Based on my analysis...". The first line carries the verdict or the most important finding.
2. **Bullets over paragraphs** for findings, issues, decisions, or steps.
3. **One idea per bullet.** If a bullet contains two ideas, split it.
4. **Concrete over abstract.** Replace "improve performance" with the number or mechanism. Replace "consider X" with "X" or drop the bullet.
5. **Active voice, present tense, second person** where applicable. "Add tests" beats "tests should be added."

## Banned patterns (delete on sight)

Phrases:
- "I'd be happy to" / "Let me" / "Certainly!" / "Of course!" / "Great question!"
- "It's worth noting that" / "It's important to mention" / "Please note"
- "In summary" / "Overall" / "To conclude" / "In conclusion"
- "Please let me know if you have any questions" / "Happy to discuss" / "I hope this helps"
- "as an AI" or any meta-commentary about being an assistant
- "thorough review" / "comprehensive analysis" / "deep dive" / "robust solution" — show, don't claim

Hedge stacks — pick a stance or drop:
- "may benefit from" / "could potentially" / "might want to consider"
- "may potentially possibly"
- "perhaps it would be advisable to"

Meta-commentary about the rewrite itself:
- Don't say "I cut X." Don't say "Here's the punchier version." Just produce the unglazed output.

Restating the prompt:
- Don't begin by paraphrasing what the user asked for.

## No repetition (core rule)

- If the original says X in three places, the rewrite says X once.
- No restating findings in intro + body + conclusion.
- No paraphrasing your own previous bullet.
- If a "summary" or "TL;DR" section just re-says the bullets above (or below), drop the section.
- If two bullets express the same finding from different angles, merge them.

## Sacred — preserve verbatim

Never alter:
- Numbers, identifiers, file paths, function names, line numbers, error codes
- Code blocks
- Links and URLs
- Decisions and action items
- Negations — losing a "not" or a "never" is a fatal error
- Technical claims — never invent for punchiness, never soften a specific claim into vagueness

If unsure whether a detail is technical or filler, keep it.

## Drop entirely (pure filler)

- "Next steps: schedule a meeting" / "Let's sync on this" / "We can discuss further"
- "Please let me know if you have any questions"
- "I hope this helps"
- Restatements of what the user asked for
- Throat-clearing transitions ("Now that we've covered X, let's discuss Y")
- Closing pleasantries

## Format defaults

- No emoji unless the source had emoji.
- No headers unless the content has 3+ distinct sections.
- No bold inside bullets unless flagging severity (e.g., **blocker**, **nit**).
- No before/after diff, no list of cuts, no meta-commentary. Just the unglazed output.

## Anti-patterns (do not produce)

1. **Terse-but-still-glazy.** Short sentences in corporate-speak are still glaze. "The implementation is suboptimal" is short and useless. Say what's wrong and where.
2. **Punchy-but-lost-info.** If you dropped a number, identifier, or negation to save words, you failed. Re-add it.
3. **Snarky-cringe.** Linus-mode hostility doesn't belong in PR review. Tight is not the same as mean.
4. **Bullet-spam.** Converting 3 informative sentences into 12 fragmentary bullets is glaze with whitespace. One bullet per idea, not one bullet per phrase.

See `reference/examples.md` for labeled good/bad rewrites.

## Workflow

1. Read the source content (previous assistant turn, file, pasted blob, or referenced URL).
2. Identify: technical claims, decisions, numbers, identifiers, negations — these are sacred.
3. Identify: filler, restatements, hedges, throat-clearing — these get cut.
4. Identify: repetitions — collapse to one occurrence.
5. Produce the unglazed version. Conclusion first. Bullets. One idea each.
6. Replace the original output. Do not show a diff. Do not announce what you cut.

## Output

Replace the original content. The original remains in scrollback if the user wants to compare. Do not preface the output with "Here's the unglazed version:" — just emit the content.

## Pairs well with

- `code-review` — unglaze the review report before sharing with teammates
- `pr-review-toolkit` — same
- `drift-groom` — unglaze the drift audit summary
- Any research or design output meant for human readers
