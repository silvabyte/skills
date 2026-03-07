# Query Priorities

When testing DOM elements, query the way users and assistive technology find elements. This hierarchy applies to any DOM testing tool (Testing Library, Playwright, Cypress).

## The Priority Order

### 1. `getByRole` (Preferred)

Queries by ARIA role -- the way screen readers and assistive technology navigate the page.

```js
getByRole('button', { name: /submit/i })
getByRole('heading', { level: 2 })
getByRole('textbox', { name: /email/i })
getByRole('checkbox', { name: /agree to terms/i })
```

**Why first:** Most resilient to refactors. Works regardless of element type, CSS class, or test ID. If this query works, your component is accessible.

### 2. `getByLabelText`

Queries form elements by their associated label.

```js
getByLabelText(/email address/i)
getByLabelText(/password/i)
```

**Why:** Ensures your form inputs have proper labels (accessibility requirement). Great for forms.

### 3. `getByText`

Queries by visible text content.

```js
getByText(/welcome back/i)
getByText(/no results found/i)
```

**Why:** Tests what the user actually sees. Good for non-interactive elements, headings, paragraphs, error messages.

### 4. `getByPlaceholderText`

```js
getByPlaceholderText(/search/i)
```

**Why secondary:** Placeholders disappear when the user types. Not a substitute for labels. Use only when no label exists.

### 5. `getByDisplayValue`

```js
getByDisplayValue(/jane doe/i)
```

**Why secondary:** Useful for pre-filled form fields. Narrow use case.

### 6. `getByTestId` (Last Resort)

```js
getByTestId('checkout-button')
```

**Why last:** Not visible to users. Not tied to accessibility. Survives refactors but doesn't verify that the UI is usable. Use only when no semantic query works (e.g., a dynamically generated visualization with no text).

## Why This Order Matters

1. **Accessibility** -- Higher-priority queries only work if your markup is accessible. Using `getByRole` forces you to use proper ARIA roles. Using `getByLabelText` forces you to label your inputs. Your tests become an accessibility audit for free.

2. **Resilience** -- Queries based on roles and visible text survive CSS refactors, component restructuring, and implementation changes. `getByTestId` survives too, but doesn't give you the accessibility benefit.

3. **User-centric** -- Users don't find buttons by test ID or CSS class. They find them by what they see and what assistive technology announces. Tests that query like users catch more real bugs.

## Practical Tips

- Use `screen` for all queries: `screen.getByRole('button', { name: /save/i })`
- Use regex with `i` flag for text matching: `{ name: /submit/i }` is more resilient than exact strings
- If you can't find an element by role, it may be an accessibility issue to fix, not a reason to reach for `getByTestId`
- `*ByRole` queries work with implicit roles too -- a `<button>` has role `button`, an `<a href>` has role `link`
