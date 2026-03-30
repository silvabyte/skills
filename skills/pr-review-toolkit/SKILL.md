---
name: pr-review-toolkit
description: >-
  Comprehensive PR review using 7 specialized review protocols covering code quality,
  test coverage, error handling, type design, comment accuracy, code simplification,
  and component coupling.
  Use when reviewing PRs, preparing code for merge, or auditing specific aspects of code changes.
  Triggers: "review PR", "review my PR", "PR review", "review pull request",
  "check test coverage", "review error handling", "analyze types",
  "check comments", "simplify code", "code review", "pre-merge review",
  "check coupling", "review coupling", "orthogonality review".
---

# PR Review Toolkit

Comprehensive code review using 7 specialized protocols, each focusing on a different aspect of code quality. Reviews can target specific aspects or run all applicable checks.

## Review Aspects

| Aspect | Keyword | Focus | Auto-apply when... |
|--------|---------|-------|-------------------|
| Code Review | `code` | Project guidelines, bugs, quality | Always applicable |
| Test Analysis | `tests` | Coverage quality, critical gaps | Test files changed |
| Silent Failures | `errors` | Error handling, catch blocks | Error handling changed |
| Type Design | `types` | Encapsulation, invariants | Types added/modified |
| Comment Analysis | `comments` | Accuracy, completeness, rot | Comments/docs changed |
| Code Simplification | `simplify` | Clarity, maintainability | After review passes |
| Coupling Analysis | `coupling` | Component independence, dependency direction | New modules added or imports changed |

## Review Workflow

### 1. Determine Scope

Identify changed files to understand what needs review:

```bash
git diff --name-only          # Unstaged changes
git diff --cached --name-only # Staged changes
gh pr diff                    # If a PR exists
```

### 2. Select Review Aspects

- If the user requested specific aspects (e.g., "review tests and errors"), use those
- Otherwise, determine applicable aspects based on what changed:
  - **Always**: code review (general quality)
  - **If test files changed**: test analysis
  - **If comments/docs added**: comment analysis
  - **If error handling changed**: silent failure hunting
  - **If types added/modified**: type design analysis
  - **If new modules/files added or inter-module imports changed**: coupling analysis
  - **After passing review**: code simplification (polish)

### 3. Execute Reviews

For each selected aspect, load the corresponding reference protocol and apply it to the changed files.

- **Sequential** (default): Run one review at a time for interactive feedback
- **Parallel**: Launch all reviews simultaneously when user requests speed

### 4. Aggregate and Report

Combine findings into a prioritized summary:

```markdown
## PR Review Summary

### Critical Issues (X found)
- [aspect]: Issue description [file:line]

### Important Issues (X found)
- [aspect]: Issue description [file:line]

### Suggestions (X found)
- [aspect]: Suggestion [file:line]

### Strengths
- What's well-done in this PR

### Recommended Action
1. Fix critical issues first
2. Address important issues
3. Consider suggestions
4. Re-run review after fixes
```

## Scoring Systems

Each protocol uses its own scoring to prioritize findings:

| Aspect | System | Threshold |
|--------|--------|-----------|
| Code Review | Confidence 0-100 | Report at >= 80 |
| Test Analysis | Criticality 1-10 | Focus on 8-10 |
| Silent Failures | Severity: Critical/High/Medium | All reported |
| Type Design | 4 dimensions rated 1-10 | All reported |
| Comment Analysis | Category: Critical/Improvement/Removal | All reported |
| Code Simplification | Qualitative assessment | All reported |
| Coupling Analysis | Red/Green flags → 4-tier rating | All reported |

## Usage Examples

**Full review (all applicable aspects):**
> "Review my PR" / "Run a comprehensive review"

**Specific aspects:**
> "Review test coverage and error handling"
> "Check if the comments are accurate"
> "Simplify the code"

**Parallel execution:**
> "Review everything in parallel"

## Recommended Workflow

```
1. Write code           → code review + error handling
2. Review architecture  → coupling analysis
3. Fix critical issues  → re-run targeted reviews
4. Add tests            → test analysis
5. Add documentation    → comment analysis
6. Final polish         → code simplification
7. Create PR
```

## Best Practices

- **Review early**: Before creating the PR, not after
- **Focus on changes**: Review the git diff, not the entire codebase
- **Address critical first**: Fix high-priority issues before lower priority
- **Re-run after fixes**: Verify issues are resolved
- **Use specific reviews**: Target the aspects relevant to your changes
- **Iterate**: Multiple focused reviews beat one comprehensive pass

## References

- [Code Review Protocol](references/code-reviewer.md) — Project guidelines compliance, bug detection, confidence scoring. Load when running code review.
- [Code Simplification Protocol](references/code-simplifier.md) — Clarity enhancement while preserving functionality. Load when simplifying code.
- [Comment Analysis Protocol](references/comment-analyzer.md) — Comment accuracy verification and technical debt prevention. Load when analyzing comments.
- [Test Analysis Protocol](references/test-analyzer.md) — Behavioral coverage quality and gap identification. Load when analyzing test coverage.
- [Silent Failure Hunting Protocol](references/silent-failure-hunter.md) — Error handling audit with zero tolerance for silent failures. Load when reviewing error handling.
- [Type Design Analysis Protocol](references/type-design-analyzer.md) — Encapsulation, invariant expression, and enforcement ratings. Load when analyzing type design.
- [Coupling Analysis Protocol](references/coupling-analyzer.md) — Component independence evaluation using red/green flag heuristics. Load when analyzing coupling.
