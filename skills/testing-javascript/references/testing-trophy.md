# The Testing Trophy

The Testing Trophy is Kent C. Dodds' model for balancing test types. Unlike the traditional Testing Pyramid (which favors unit tests), the Trophy puts the most weight on integration tests.

## The Layers

### Static Analysis (Base)

**What it catches:** Typos, type errors, style inconsistencies, unused variables, unreachable code.

**Tools:** TypeScript, ESLint, Prettier, Biome.

**Cost:** Near-zero runtime cost. Runs in your editor and CI.

**Guidance:**
- Enable TypeScript strict mode
- Use ESLint with recommended rules for your framework
- Run these in CI as a gate -- they should never be skipped
- This is "free" confidence; there's no reason not to have it

### Unit Tests

**What they verify:** Individual, isolated pieces of logic work as expected.

**Best for:**
- Pure functions (math, string manipulation, data transformations)
- Utility/helper functions
- Custom hooks with complex logic (tested in isolation)
- State machines and reducers
- Validation logic

**Not ideal for:**
- Components with children (use integration instead)
- Anything requiring DOM interaction
- Business logic that spans multiple modules

**Characteristics:**
- Fast to write and run
- Easy to understand in isolation
- Low confidence that the system works as a whole
- Don't mock dependencies heavily -- if you need many mocks, consider an integration test instead

### Integration Tests (The Sweet Spot)

**What they verify:** Several units work together in harmony.

**Best for:**
- Components rendered with their real children and context
- API route handlers with real middleware
- Form interactions: fill, submit, validate, display result
- Data fetching components with mocked network (not mocked hooks)
- Multi-step user flows within a page

**Why they're the sweet spot:**
- High confidence that the app actually works
- Catch bugs that unit tests miss (wiring, prop passing, context, side effects)
- Still reasonably fast (jsdom or happy-dom, no browser needed)
- Refactor-resilient: test the interface, not the internals

**How to write them:**
- Render from a high-enough level to test real interactions
- Use real child components, don't shallow render
- Mock at the network boundary (use `msw` or similar), not at the module level
- Query the DOM the way a user would (see query priorities)

### E2E Tests (Top)

**What they verify:** Critical user workflows work through the real, deployed application.

**Best for:**
- Authentication flows (signup, login, logout, password reset)
- Checkout / payment flows
- Critical happy paths that generate revenue or retain users
- Cross-page navigation and deep linking
- Third-party integration smoke tests

**Not ideal for:**
- Edge cases and error states (test these at integration level)
- Exhaustive combinatorial testing
- Anything that can be verified faster at a lower level

**Characteristics:**
- Highest confidence -- tests the real thing
- Slowest to run, most expensive to maintain
- Flaky if not carefully written
- Should be a small, focused set of critical paths

## Choosing the Right Layer

Ask yourself:

1. **Can static analysis catch this?** (type error, lint rule) → Static
2. **Is this isolated logic with no side effects?** → Unit test
3. **Does this involve multiple pieces working together?** → Integration test
4. **Is this a critical user workflow that must work end-to-end?** → E2E test

When in doubt, default to integration. You can always extract a unit test later if a specific piece of logic needs focused coverage.
