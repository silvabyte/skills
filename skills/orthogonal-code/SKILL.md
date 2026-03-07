---
name: orthogonal-code
description: |
  Concrete, testable heuristics for writing and reviewing orthogonal (decoupled) code. Use when:
  (1) Writing new modules and wanting to ensure independence from day one
  (2) Reviewing PRs or existing code for coupling problems
  (3) Refactoring tightly-coupled systems toward better separation
  (4) Discussions mention orthogonality, coupling, decoupling, SOLID, Law of Demeter, or connascence
  (5) Evaluating whether a design change will increase or decrease coupling
  (6) Deciding how to split responsibilities between modules
  Complements the `system-design` skill (deep modules, information hiding, complexity). This skill focuses specifically on component independence.
  Draws from The Pragmatic Programmer, SOLID principles, Law of Demeter, Connascence theory, and UNIX philosophy.
---

# Orthogonal Code

Heuristics for building and evaluating component independence. Use alongside `system-design` for depth/complexity concerns.

## Core Principle

**Orthogonality:** Two components are orthogonal if changing one does not require changing the other.

Non-orthogonal systems exhibit a multiplier effect—a single change ripples across many modules. Orthogonal systems localize change: each module can be developed, tested, deployed, and replaced independently.

**The Helicopter Test:** Pick any implementation detail (a database schema column, a serialization format, an API endpoint). Change it. How many other files must also change? If the answer is more than 1–2, coupling is too high.

**Relationship to system-design:** That skill covers *what* makes a good module (deep interfaces, information hiding, complexity management). This skill covers *how modules relate to each other*—minimizing the connective tissue between them.

## Red Flags

Thirteen coupling smells. For each, ask the yes/no test question. A "yes" answer indicates a coupling problem.

### RF1 — Shotgun Surgery

**Does a single logical change require edits in 3+ files?**

A feature or bug fix that touches many modules means those modules share knowledge they shouldn't.

```typescript
// Bad: adding a new user role requires changes in
// UserModel, AuthMiddleware, RoleValidator, AdminPanel, UserSerializer, RoleSeeder
```

### RF2 — Train Wreck

**Does any expression chain 3+ accessor calls?**

Long chains reveal that a module knows the internal structure of distant objects (Law of Demeter violation).

```typescript
// Bad
const zip = order.getCustomer().getAddress().getZipCode();
```

### RF3 — Boolean Blindness

**Does a function accept a boolean that controls its behavior mode?**

A boolean parameter means the function does two different things. Callers must know internal branching logic.

```typescript
// Bad
function createUser(name: string, isAdmin: boolean) {
  if (isAdmin) { /* entirely different path */ }
}
```

### RF4 — Intimate Knowledge

**Does a module directly build or mutate another module's internal types?**

When module A constructs or modifies types that belong to module B's internals, A breaks if B's internals change.

```typescript
// Bad: OrderService directly constructs PaymentGateway's internal request type
const req = new PaymentGatewayInternalRequest({ txnId: "...", ledgerCode: 42 });
```

### RF5 — Shared Mutable State

**Is there mutable state that 2+ modules both read and write?**

Shared mutable state is the strongest form of coupling. Changes to how one module uses the state silently break the other.

```typescript
// Bad: both OrderService and InventoryService read/write the same `stock` map
const stock: Map<string, number> = new Map(); // shared between modules
```

### RF6 — Positional Coupling

**If you reorder function calls, does the system silently break?**

Implicit ordering dependencies mean callers must know internal sequencing.

```typescript
// Bad: must call in exact order with no enforcement
initialize();
loadConfig();   // fails silently if called before initialize()
startServer();  // corrupts data if called before loadConfig()
```

### RF7 — Fat Interface

**Does a consumer use less than half the methods on an interface it depends on?**

Depending on unused methods means the consumer is coupled to changes it doesn't care about (Interface Segregation violation).

```typescript
// Bad: NotificationService only needs sendEmail() but depends on all of UserService
interface UserService {
  getUser(): User; updateUser(): void; deleteUser(): void;
  getPreferences(): Prefs; sendEmail(msg: string): void; // only method used
}
```

### RF8 — Concrete Dependency

**Does a module contain `new ConcreteClass()` for a dependency it could receive?**

Hard-coding a concrete dependency prevents swapping implementations and forces tests to use the real thing.

```typescript
// Bad
class OrderService {
  private db = new PostgresDatabase(); // can't swap, can't test without Postgres
}
```

### RF9 — Data Clump

**Do 3+ parameters appear together in 2+ function signatures?**

Repeated parameter groups indicate a missing abstraction. All callers are coupled to the same positional knowledge.

```typescript
// Bad: (street, city, zip) repeated everywhere
function validateAddress(street: string, city: string, zip: string) { }
function formatAddress(street: string, city: string, zip: string) { }
```

### RF10 — Leaky Encoding

**Would changing storage format require changing the public interface?**

If your public API exposes storage details (column names, serialization format), every consumer is coupled to your storage layer.

```typescript
// Bad: public method exposes that storage is JSON with specific keys
function getUserData(): { json_blob: string; updated_at_epoch_ms: number } { }
```

### RF11 — Connascence of Meaning

**Are there magic strings/numbers that must match between modules with no shared type?**

When two modules agree on a value by convention rather than a shared type, renaming or changing the value silently breaks the other.

```typescript
// Bad: both modules use "PREMIUM" string independently
// user-service.ts
if (user.tier === "PREMIUM") { ... }
// billing-service.ts
if (tierCode === "PREMIUM") { ... }
```

### RF12 — Divergent Change

**Can you describe the module without using "and"?**

If a module has multiple reasons to change, it violates Single Responsibility. "This module handles orders **and** sends emails **and** updates inventory."

### RF13 — Parasitic Test

**Does the unit test require real infrastructure or another module's concrete implementation?**

If a "unit" test needs a database, network, or another module's real code, the module under test isn't isolated.

```typescript
// Bad: "unit" test requires running database
beforeAll(async () => { await database.connect(); await database.seed(); });
```

## Green Flags

Thirteen orthogonality indicators. A "yes" answer confirms good decoupling.

### GF1 — Single-Sentence Purpose

**Can you state the module's purpose in one sentence, no "and"?**

A focused module has one reason to exist and one reason to change.

```typescript
// Good: "UserRepository persists and retrieves user entities."
class UserRepository { /* only persistence concerns */ }
```

### GF2 — Swappable Implementation

**Can you swap the implementation by only changing wiring/config?**

If replacing Postgres with SQLite requires editing only the DI container or config file, the abstraction boundary is clean.

```typescript
// Good: swap by changing one line of wiring
container.bind(Database).to(SqliteDatabase); // was PostgresDatabase
```

### GF3 — Test in Isolation

**Can you unit test with only mocks/stubs for dependencies?**

If tests need nothing beyond the module itself and lightweight test doubles, the module's boundaries are well-defined.

```typescript
// Good
const repo = new UserRepository(mockDatabase);
expect(repo.findById("1")).resolves.toEqual(mockUser);
```

### GF4 — Tell, Don't Ask

**Do callers send commands rather than query state and branch?**

Telling objects what to do keeps decision logic inside the module that owns the data.

```typescript
// Good: caller tells, doesn't ask-then-decide
order.applyDiscount(coupon); // order decides how to apply
```

### GF5 — Narrow Interface

**Does every public method have at least one external consumer?**

No dead public surface area. Every exposed method justifies its existence.

### GF6 — Data In, Data Out

**Given same args, same result, no side effects?**

Pure functions are inherently orthogonal—they depend on nothing beyond their inputs.

```typescript
// Good
function calculateTax(amount: number, rate: number): number {
  return amount * rate;
}
```

### GF7 — Composed via Interfaces

**Are all inter-module dependencies typed as interfaces/protocols/abstract types?**

Depending on abstractions rather than concretions means modules can evolve independently.

```typescript
// Good
class OrderService {
  constructor(private readonly payments: PaymentGateway) {} // interface, not concrete
}
```

### GF8 — Event-Driven Decoupling

**Can the producer operate without knowing which consumers exist?**

Event emitters don't import their listeners. Adding/removing consumers requires zero changes to the producer.

```typescript
// Good: OrderService emits event, doesn't know who listens
eventBus.emit("order.placed", { orderId });
```

### GF9 — Stable Boundary Types

**Are public types defined at the boundary, not imported from internals?**

Boundary types (DTOs, API contracts) should live at the module's edge, not be re-exported internals.

```typescript
// Good: public type is a boundary DTO, not an internal entity
export interface OrderSummary { id: string; total: number; status: string }
```

### GF10 — Configuration Over Convention

**Are behavioral variations driven by config, not code kept in sync?**

When behavior changes come from configuration, adding variants doesn't require coordinated code changes.

```typescript
// Good: new notification channel = new config entry, no code change
const channels = config.get<NotificationChannel[]>("notifications.channels");
```

### GF11 — Pipeable / Composable

**Can you chain output into the next module without glue code?**

UNIX philosophy: each module transforms data and passes it along a standard interface.

```typescript
// Good
const result = await pipeline(
  readOrders,
  filterActive,
  calculateTotals,
  formatReport
)(input);
```

### GF12 — Connascence of Name Only

**Is coupling limited to shared names (no shared algorithms/timing/meaning)?**

The weakest form of connascence—modules only agree on names of interfaces and methods. See [references/connascence-taxonomy.md](references/connascence-taxonomy.md) for the full hierarchy.

### GF13 — Symmetric Change Cost

**Adding a new variant requires changes in exactly one place?**

When the cost of adding a new case (new payment method, new notification channel) is a single file change, the design is properly open/closed.

```typescript
// Good: new payment method = one new class implementing PaymentGateway
class StripePayment implements PaymentGateway { /* ... */ }
```

## Evaluation Protocol

Use this protocol to assess a module, component, or PR.

### Step 1: Identify Modules

List the modules/classes/files under evaluation. Define their stated purpose.

### Step 2: Map Dependencies

For each module, list what it imports, constructs, or calls. Draw the dependency graph (mentally or literally).

### Step 3: Apply Red Flags

Walk through RF1–RF13. For each, answer the yes/no question. Record which flags trigger.

### Step 4: Apply Green Flags

Walk through GF1–GF13. For each, answer the yes/no question. Record which flags are present.

### Step 5: Score

Count red flags triggered and green flags present. Map to the scale:

| Rating | Red Flags | Green Flags | Meaning |
|--------|-----------|-------------|---------|
| **Strong** | 0–1 | 8+ | Well-decoupled, changes are localized |
| **Adequate** | 2–3 | 5–7 | Some coupling, targeted refactoring advised |
| **Needs work** | 4–6 | 3–4 | Significant coupling, plan remediation |
| **Tangled** | 7+ | 0–2 | Major restructuring needed |

### Step 6: Recommend

For each triggered red flag, propose a specific refactoring. Prioritize by impact: fix shared mutable state (RF5) and shotgun surgery (RF1) before cosmetic issues like data clumps (RF9).

See [references/evaluation-examples.md](references/evaluation-examples.md) for two fully worked examples.

## Writing Mode

When writing new code, run through this checklist before committing:

1. **State the purpose** — Write a single-sentence description (GF1). If you need "and," split the module.
2. **Inject dependencies** — Accept dependencies via constructor/parameter, never hard-code concretions (RF8 → GF7).
3. **Define boundary types** — Create DTOs/interfaces at the module's public edge. Don't export internals (GF9, RF10).
4. **Prefer pure transforms** — Where possible, write functions that are data-in/data-out (GF6). Push side effects to the edges.
5. **Emit, don't import consumers** — If other modules need to react, emit events or return results. Don't call them directly (GF8).
6. **Verify the Helicopter Test** — Before merging, mentally change one implementation detail. If more than 1–2 files need updating, revisit your boundaries.

For information hiding and interface depth concerns, defer to `system-design`.

## Review Mode

When reviewing code or PRs for coupling:

### Quick Scan (top 5 red flags to check first)

1. **RF1 — Shotgun Surgery:** Does this change touch many files for one logical change?
2. **RF5 — Shared Mutable State:** Is any state written by multiple modules?
3. **RF2 — Train Wreck:** Any long accessor chains?
4. **RF8 — Concrete Dependency:** Any `new ConcreteClass()` for swappable dependencies?
5. **RF13 — Parasitic Test:** Do tests require real infrastructure?

### Full Review Checklist

1. **Scan imports** — Does the module import from many unrelated packages? High fan-in suggests a module doing too much (RF12).
2. **Check constructors/factories** — Are dependencies injected or hard-coded? (RF8)
3. **Trace a hypothetical change** — Pick one implementation detail and trace what would break. Count files affected (RF1, Helicopter Test).
4. **Examine test setup** — If `beforeAll` or `beforeEach` is lengthy, the module may have hidden dependencies (RF13).
5. **Look for matching magic values** — Search for string/number literals that appear in multiple modules (RF11).
6. **Validate interface width** — Does the consumer use most of what it depends on? (RF7)

For depth/complexity red flags (shallow modules, pass-through methods, information leakage), invoke `system-design`.

## References

- [Connascence Taxonomy](references/connascence-taxonomy.md) — Full hierarchy of coupling strength from Name to Identity, with refactoring strategies. Load when doing deep coupling analysis.
- [Evaluation Examples](references/evaluation-examples.md) — Two worked examples applying the full evaluation protocol: a "Tangled" OrderService and a "Strong" notification pipeline.
