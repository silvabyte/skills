# Connascence Taxonomy

Nine types of connascence ordered from weakest (most acceptable) to strongest (most dangerous). Prefer weaker forms. Refactor stronger forms toward weaker ones.

## Static Connascence (detectable at compile/lint time)

### 1. Connascence of Name (CoN) — Weakest

Multiple components agree on a name (function name, interface name, property key).

```typescript
// Module A calls repo.findById() — agrees on method name with Module B
const user = await userRepo.findById(id);
```

**Refactoring:** This is the goal state. No further refactoring needed.

### 2. Connascence of Type (CoT)

Multiple components agree on a type (argument types, return types).

```typescript
// Both modules agree that userId is a string, not a number
function getUser(id: string): User { }
function deleteUser(id: string): void { }
```

**Refactoring:** Use branded/nominal types or newtypes to make type agreements explicit rather than accidental.

### 3. Connascence of Meaning (CoM)

Multiple components agree on the meaning of a value (magic numbers, status codes, string conventions).

```typescript
// Bad: both modules independently know that 1 = active, 2 = suspended
if (user.status === 1) { /* active */ }
// In another module:
if (account.state === 1) { /* also means active */ }
```

**Refactoring:** Replace magic values with a shared enum or named constants.

```typescript
enum UserStatus { Active = 1, Suspended = 2 }
```

### 4. Connascence of Position (CoP)

Multiple components agree on the order of values (positional parameters, array element ordering).

```typescript
// Bad: callers must know that arg 1 = street, arg 2 = city, arg 3 = zip
function createAddress(street: string, city: string, zip: string) { }
```

**Refactoring:** Replace positional parameters with named parameters or an object.

```typescript
function createAddress(opts: { street: string; city: string; zip: string }) { }
```

### 5. Connascence of Algorithm (CoA)

Multiple components agree on a particular algorithm (hashing, encoding, serialization format).

```typescript
// Bad: both modules independently implement Base64 encoding for tokens
// auth-service.ts
const token = Buffer.from(payload).toString("base64");
// api-gateway.ts
const payload = Buffer.from(token, "base64").toString();
```

**Refactoring:** Extract the shared algorithm into a single module that both depend on.

```typescript
import { TokenCodec } from "./token-codec";
const token = TokenCodec.encode(payload);
```

## Dynamic Connascence (only detectable at runtime)

### 6. Connascence of Execution (CoE)

Components must execute in a particular order.

```typescript
// Bad: login() must be called before fetchProfile()
await auth.login(credentials);
await api.fetchProfile(); // fails if login() hasn't been called
```

**Refactoring:** Make ordering explicit through types (return a token from login that fetchProfile requires) or encapsulate the sequence in a single operation.

```typescript
const session = await auth.login(credentials);
await api.fetchProfile(session.token); // dependency is explicit
```

### 7. Connascence of Timing (CoT-timing)

Components depend on the relative timing of events.

```typescript
// Bad: cache must be populated within 5 seconds or the read fails
startCacheWarming();
setTimeout(() => readFromCache(), 5000); // race condition
```

**Refactoring:** Replace timing assumptions with explicit synchronization (promises, semaphores, ready signals).

```typescript
await cacheWarming.ready();
readFromCache();
```

### 8. Connascence of Value (CoV)

Multiple components must agree on a particular value at runtime.

```typescript
// Bad: distributed system requires all nodes to agree on the leader ID
// If any node has a stale value, operations fail silently
```

**Refactoring:** Use a single source of truth (centralized config, leader election protocol) rather than requiring components to independently maintain the same value.

### 9. Connascence of Identity (CoI) — Strongest

Multiple components must reference the same object instance (not just an equal value).

```typescript
// Bad: two modules must hold a reference to the exact same connection object
const conn = database.getConnection();
moduleA.init(conn);
moduleB.init(conn); // must be the SAME instance, not an equivalent one
```

**Refactoring:** Manage shared identity through a container or registry rather than passing the same reference around. Consider whether the modules truly need the same instance or just equivalent behavior.

## Connascence Properties

When evaluating connascence, consider three properties:

1. **Strength** — How hard is it to refactor? (Identity is hardest, Name is easiest)
2. **Degree** — How many components are involved? (2 is manageable, 10 is dangerous)
3. **Locality** — How close are the coupled components? (Same module is tolerable, cross-service is risky)

**Rule of thumb:** Strong connascence between distant components is the highest priority to fix. Weak connascence between nearby components is usually acceptable.
