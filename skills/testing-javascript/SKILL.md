---
name: testing-javascript
description: >-
  Testing Trophy philosophy for JS/TS. Use when: writing tests, deciding what/how to test,
  reviewing tests, choosing unit/integration/E2E, mocking decisions.
  Triggers: "write tests", "what should I test", "test this component",
  "review my tests", "testing strategy", "mock this", "test setup".
---

# Testing JavaScript

> "Write tests. Not too many. Mostly integration." -- Guillermo Rauch

These principles are tool-agnostic. They apply whether you use Jest, Vitest, Playwright, Cypress, or any other testing tool.

## Core Principles

### 1. The Testing Trophy

Favor integration tests. They give the best confidence-to-cost ratio.

From bottom to top:
- **Static Analysis** -- TypeScript, ESLint, Prettier. Catches typos and type errors before runtime. Free confidence.
- **Unit Tests** -- Isolated pure functions, utilities, transformations. Fast and cheap, but low confidence for how things work together.
- **Integration Tests** -- Test how units work together. Render components with real children, test API handlers with real middleware. **This is where most of your tests should live.**
- **E2E Tests** -- Test critical user workflows through the real app. Highest confidence, highest cost. Reserve for happy paths and critical flows.

See [references/testing-trophy.md](references/testing-trophy.md) for detailed guidance on choosing the right layer.

### 2. Test Behavior, Not Implementation

Test what users experience, not internal state, props, or method calls. If you refactor and tests break but behavior didn't change, the tests were wrong.

**Do:** Assert on visible output, screen text, HTTP responses, return values.
**Don't:** Assert on internal state, component instance methods, or how many times a private function was called.

### 3. Query Priority (DOM Testing)

Use accessibility-first queries. This order applies to any DOM testing tool:

1. `getByRole` -- mirrors assistive technology, most robust
2. `getByLabelText` -- great for form inputs, ensures labels exist
3. `getByText` -- visible text, good for buttons/links
4. `getByPlaceholderText`, `getByDisplayValue` -- secondary
5. `getByTestId` -- last resort, not user-visible

See [references/query-priorities.md](references/query-priorities.md) for rationale.

### 4. Pragmatic Mocking

Mock at system boundaries: network, timers, randomness, third-party services. Don't mock what you own unless necessary. Over-mocking makes tests brittle and hides real bugs.

- Always clean up mocks after each test
- Prefer `msw` or similar for network mocking over mocking `fetch` directly
- If you need to mock an internal module, it's often a sign your test is at the wrong level

See [references/mocking-guide.md](references/mocking-guide.md) for patterns and anti-patterns.

### 5. Coverage Is a Metric, Not a Goal

Don't chase 100%. Use coverage to find untested critical paths, not as a target. High coverage with bad tests gives false confidence.

### 6. Isolation and Cleanup

Each test sets up its own state and cleans up after itself. No test should depend on another test's side effects. Use `beforeEach`/`afterEach` for shared setup, but keep test-specific setup in the test itself.

### 7. What to Test -- The Worksheet Method

When deciding what to test, think through these questions (internally, not as a workflow):

1. **What would hurt most if it broke?** Start there.
2. **What code is untested for that functionality?** Identify gaps.
3. **How do developers and users interact with it?** Map both the developer API (props, function signatures) and user interactions (clicks, form fills).
4. **Write manual test instructions first.** Think step-by-step: "fill in name, click submit, verify confirmation appears."
5. **Automate those instructions.** Each manual step becomes a line of test code.

This produces tests that verify real behavior and catch real regressions.

## Quick Decision Guide

| Situation | Approach |
|---|---|
| Pure function / utility | Unit test |
| Component rendering + user interaction | Integration test |
| Multiple components working together | Integration test |
| Form submission to API | Integration test (mock network) |
| Critical user workflow (checkout, auth) | E2E test |
| Styling / layout | Static analysis or visual regression |
| Type safety | TypeScript strict mode |
| Code style | ESLint + Prettier |

## Glossary

See [references/glossary.md](references/glossary.md) for definitions of assertion, mock, spy, stub, test double, and other testing terms.
