# Testing Glossary

**Assertion** -- A boolean expression that evaluates whether a specific part of your software behaves as expected. Think of it as a normal phrase you could say out loud: "I expect the result to be 10."

**Code Coverage** -- A metric describing how much of your application's code is executed when your tests run. Useful for finding gaps, not as a target.

**Mock** -- A test double that captures call information (arguments, call count) and lets you control return values. Combines the capabilities of stubs and spies.

**Monkey Patching** -- Dynamically replacing functions or object properties during testing to substitute controlled behavior. Must always be cleaned up to avoid leaking between tests.

**Spy** -- A test double that tracks how many times a function is called, and with what arguments, without changing the function's behavior.

**Stub** -- A test double that replaces a function or data source with one that returns a predefined value.

**Test Double** -- A generic term for any substitute used in place of real production code during testing. Encompasses stubs, spies, and mocks.

**Testing Framework** -- A collection of testing-related libraries that provides test runners, assertion utilities, mocking capabilities, and reporting. Examples: Jest, Vitest, Mocha.

**Testing Library** -- A set of reusable testing utilities. In the context of this course, often refers to DOM Testing Library and its framework-specific wrappers (React Testing Library, etc.) which encourage testing from the user's perspective.
