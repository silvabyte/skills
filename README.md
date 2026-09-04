# Silvabyte Skills

Reusable skills for team coding agents.

## Available Skills

| Skill | Description |
|-------|-------------|
| [wb-drive](skills/wb-drive) | Weekend Business Shared Drive management |
| [fizzy](skills/fizzy) | Fizzy board and task management |
| [orthogonal-code](skills/orthogonal-code) | Writing and reviewing orthogonal (decoupled) code |
| [marketing-principles](skills/marketing-principles) | Apply proven marketing principles for compelling copy, campaigns, and brand positioning |
| [edit-video](skills/edit-video) | Conversational video editing: transcribe, plan edits with transcript analysis, render |
| [pr-review-toolkit](skills/pr-review-toolkit) | Comprehensive PR review with 7 specialized review protocols |
| [unglaze](skills/unglaze) | Rewrite glazy, eye-glazing content into a tight, scannable engineering voice |
| [qa-flow-report](skills/qa-flow-report) | Drive a UI flow via chrome-devtools MCP, capture a screenshot per step, render a self-contained HTML QA report |
| [context-ramp](skills/context-ramp) | Turn dense context into source-grounded visual-auditory micro-lessons with active recall |
| [ask-silva](skills/ask-silva) | Router over the engineering flow (idea → spec → tickets → implement) with the `unglaze` output contract applied throughout |
| [to-spec](skills/to-spec) | Fork of upstream `to-spec`: spec opens with an `At a glance` block; smallest complete user-story set |
| [handoff](skills/handoff) | Fork of upstream `handoff`: `At a glance` block first, `unglaze` voice |
| [diagramming](skills/diagramming) | Create and revise source-grounded, editable Excalidraw diagrams |

## Upstream forks

`ask-silva`, `to-spec`, and `handoff` are forks of [mattpocock/skills](https://github.com/mattpocock/skills). Each `SKILL.md` carries an HTML comment with the upstream path and commit it was forked from. Installing them from this repo shadows the upstream copy of the same name in `~/.agents/skills/`; install the rest of the flow from upstream:

```bash
npx skills add mattpocock/skills -g
npx skills add silvabyte/skills -g -s ask-silva -s to-spec -s handoff
```

To re-sync a fork, diff upstream at the recorded commit against `HEAD`, apply the upstream changes, and bump the comment.

## Installation

```bash
npx skills add silvabyte/skills
```

Or install a specific skill:

```bash
npx skills add silvabyte/skills -s wb-drive
```

## Adding New Skills

Skills follow the [Agent Skills](https://skills.sh) format:
- `skills/<skill-name>/SKILL.md` - Required
- `skills/<skill-name>/scripts/` - Optional helper scripts
- `skills/<skill-name>/references/` - Optional documentation

## License

MIT
