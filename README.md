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
| [pr-review-toolkit](skills/pr-review-toolkit) | Comprehensive PR review with 6 specialized review protocols |

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
