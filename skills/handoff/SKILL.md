---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

<!-- Fork of mattpocock/skills skills/productivity/handoff/SKILL.md @ 6654f6b60cd9 (2026-08-24). Delta: At-a-glance block, /unglaze voice, completion criterion. Diff against upstream before re-syncing. -->

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS - not the current workspace.

Write it in the `/unglaze` voice: conclusion first, one idea per bullet, each fact stated once.

Open with an `## At a glance` block of at most 100 words: what the next session is for, where the work currently stands, and the first action to take. The rest of the document is the supporting detail, ordered by how soon the next agent will need it.

Include a "suggested skills" section in the document, naming which skills the next agent should call the Skill tool for.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

Done when: a fresh agent reading only the `At a glance` block can start the first action; and every open decision, blocker, and negation from the conversation appears exactly once in the body.
