# Mocking Guide

> "The more your tests resemble the way your software is used, the more confidence they can give you." -- Kent C. Dodds

## When to Mock

Mock at **system boundaries** -- the edges where your code meets things it doesn't control:

- **Network requests** -- API calls, third-party services. Use `msw` (Mock Service Worker) or similar to intercept at the network level rather than mocking `fetch`/`axios` directly.
- **Timers** -- `setTimeout`, `setInterval`, `Date.now()`. Use fake timers from your test framework.
- **Randomness** -- `Math.random()`, `crypto.randomUUID()`. Stub to produce deterministic output.
- **Third-party services** -- Payment processors, email senders, analytics. Mock the boundary, not your wrapper around it.
- **Environment** -- `process.env`, browser APIs not available in test environment.

## When NOT to Mock

- **Internal modules you own** -- If you're mocking your own utility to test a component, your test is at the wrong level. Write an integration test instead.
- **Child components** -- Don't shallow render. Render the real tree. Shallow rendering hides real bugs in how components compose.
- **Database in integration tests** -- If possible, use a real test database or in-memory equivalent. Mocking the DB means you're not testing your queries.
- **Simple utility functions** -- If `formatDate()` is fast and deterministic, just let it run.

## Types of Test Doubles

| Type | What it does | When to use |
|---|---|---|
| **Stub** | Returns a predefined value | Replace data/functionality with controlled output |
| **Spy** | Tracks calls (how many times, with what args) | Verify a function was called without changing its behavior |
| **Mock** | Spy + controlled return values + assertions | Full control over a dependency's behavior and verification |

These are collectively called **test doubles**.

## Monkey Patching

Directly replacing a function or object property during a test:

```js
const originalGetWinner = utils.getWinner;
utils.getWinner = (p1, p2) => p1; // always return player 1
// ... run test ...
utils.getWinner = originalGetWinner; // ALWAYS clean up
```

This is the simplest form of mocking. Framework mock utilities (`vi.fn()`, `jest.fn()`) build on this pattern but add tracking and cleanup.

## Key Rule: Always Clean Up

An essential part of mocking is cleaning up after yourself so you don't impact other tests. Every mock must be restored:

- Use `afterEach` to restore mocks
- Use `vi.restoreAllMocks()` / `jest.restoreAllMocks()`
- When monkey patching manually, save and restore the original

## Anti-Patterns

### Over-mocking
If you're mocking 5+ things to test one function, your test is either:
- Testing at the wrong level (go higher with integration)
- Testing implementation details (test behavior instead)

### Mocking implementation details
Don't mock internal method calls to verify they were called. Test the observable output instead.

**Bad:** Mock `calculateShipping()` and assert it was called with the right args.
**Good:** Submit a checkout form and assert the displayed total includes shipping.

### Tightly coupled mocks
If changing an internal function signature breaks your mocks, your tests are coupled to implementation. Mock at the boundary, not in the middle.

### Snapshot overuse
Snapshots are not a substitute for assertions. A snapshot of an entire component tree tells you something changed but not whether it's correct. Use targeted assertions on specific behavior.
