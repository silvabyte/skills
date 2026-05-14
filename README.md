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
