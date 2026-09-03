---
name: to-spec
description: "Turn the current conversation into a spec and publish it to the project issue tracker: no interview, just synthesis of what you've already discussed."
disable-model-invocation: true
---

<!-- Fork of mattpocock/skills skills/engineering/to-spec/SKILL.md @ 6654f6b60cd9 (2026-08-24). Delta: At-a-glance block, smallest-complete user-story rule, /unglaze voice. Diff against upstream before re-syncing. -->

This skill takes the current conversation context and codebase understanding and produces a spec. Do NOT interview the user; just synthesize what you already know.

The issue tracker and triage label vocabulary should have been provided to you. If not, tell the user to run `/setup-matt-pocock-skills`.

Write the spec in the `/unglaze` voice: conclusion first, one idea per bullet, each fact stated once. Compress structure and repetition, never substance: risks, negations, and unresolved decisions survive verbatim.

## Process

1. Explore the repo to understand the current state of the codebase, if you haven't already. Use the project's domain glossary vocabulary throughout the spec, and respect any ADRs in the area you're touching.

2. Sketch out the seams at which you're going to test the feature. Existing seams should be preferred to new ones. Use the highest seam possible. If new seams are needed, propose them at the highest point you can. The fewer seams across the codebase, the better - the ideal number is one.

Check with the user that these seams match their expectations.

3. Write the spec using the template below, then publish it to the project issue tracker. Apply the `ready-for-agent` triage label - no need for additional triage.

Done when: the `At a glance` block alone tells a reader the problem, the decision, and the next action; and no user story can be deleted without losing a behaviour the implementation must exhibit.

<spec-template>

## At a glance

At most 100 words. Three lines: the problem, the decision (what we are building and at which seam), the next action (usually "split with `/to-tickets`").

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

The smallest complete set of numbered user stories: every behaviour the implementation must exhibit appears exactly once, and no story restates another from a different angle. Merge overlapping stories; drop any story that changes neither scope, a decision, nor an acceptance check. Format:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it within the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts, not a working demo, just the important bits.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Out of Scope

A description of the things that are out of scope for this spec.

## Further Notes

Only if there is something the sections above cannot hold. Omit the section otherwise.

</spec-template>
