# Evaluation Examples

Two worked examples applying the full evaluation protocol from the orthogonal-code skill.

## Example 1: "Tangled" — E-Commerce OrderService

### Step 1: Identify Modules

- `OrderService` — Creates and manages orders
- `PaymentGateway` — Charges payments
- `InventoryService` — Tracks stock levels
- `EmailService` — Sends notifications

### Step 2: Map Dependencies

```
OrderService
  ├── imports PaymentGatewayInternalRequest (internal type from PaymentGateway)
  ├── new PostgresDatabase() (hard-coded)
  ├── reads/writes shared `stockLevels` map (shared with InventoryService)
  ├── calls emailService.getTemplate().render().send() (train wreck)
  ├── checks `if (order.type === "WHOLESALE")` magic string (also in InventoryService)
  └── requires initialize() → loadPricing() → ready() call order
```

### Step 3: Apply Red Flags

| Flag | Triggered? | Evidence |
|------|-----------|----------|
| RF1 Shotgun Surgery | **YES** | Adding a new order type requires changes in OrderService, InventoryService, EmailService, and pricing config |
| RF2 Train Wreck | **YES** | `emailService.getTemplate().render().send()` chains 3 accessors |
| RF3 Boolean Blindness | No | |
| RF4 Intimate Knowledge | **YES** | OrderService constructs `PaymentGatewayInternalRequest` |
| RF5 Shared Mutable State | **YES** | `stockLevels` map shared between OrderService and InventoryService |
| RF6 Positional Coupling | **YES** | `initialize() → loadPricing() → ready()` must be called in order |
| RF7 Fat Interface | No | |
| RF8 Concrete Dependency | **YES** | `new PostgresDatabase()` inside OrderService |
| RF9 Data Clump | No | |
| RF10 Leaky Encoding | No | |
| RF11 Connascence of Meaning | **YES** | `"WHOLESALE"` string used independently in OrderService and InventoryService |
| RF12 Divergent Change | **YES** | OrderService handles orders *and* payment orchestration *and* stock updates |
| RF13 Parasitic Test | **YES** | Tests require running Postgres and seeded inventory data |

**Red flags triggered: 9**

### Step 4: Apply Green Flags

| Flag | Present? | Evidence |
|------|---------|----------|
| GF1 Single-Sentence Purpose | No | "Handles orders and payments and stock and notifications" |
| GF2 Swappable Implementation | No | Hard-coded Postgres |
| GF3 Test in Isolation | No | Requires real DB |
| GF4 Tell, Don't Ask | No | Queries email template then acts on it |
| GF5 Narrow Interface | Yes | Public methods all have consumers |
| GF6 Data In, Data Out | No | Heavy side effects throughout |
| GF7 Composed via Interfaces | No | Depends on concrete types |
| GF8 Event-Driven Decoupling | No | Directly calls EmailService |
| GF9 Stable Boundary Types | No | Exposes internal PaymentGateway types |
| GF10 Configuration Over Convention | No | Behavior coded, not configured |
| GF11 Pipeable / Composable | No | Monolithic method |
| GF12 Connascence of Name Only | No | Shares algorithms, meaning, execution order |
| GF13 Symmetric Change Cost | No | New order type requires 4 file changes |

**Green flags present: 1**

### Step 5: Score

9 red flags, 1 green flag → **Tangled**

### Step 6: Recommend

Priority remediation:

1. **RF5 (Shared Mutable State):** Extract stock management into InventoryService with a clean API. OrderService calls `inventory.reserve(sku, qty)` instead of mutating a shared map.
2. **RF1/RF12 (Shotgun Surgery / Divergent Change):** Split OrderService — extract PaymentOrchestrator and NotificationDispatcher. Each owns one responsibility.
3. **RF8 (Concrete Dependency):** Inject database via constructor. `constructor(private readonly db: Database)`.
4. **RF4 (Intimate Knowledge):** PaymentGateway should expose its own factory method or accept a public DTO, not expose internal request types.
5. **RF11 (Connascence of Meaning):** Create `enum OrderType { Retail, Wholesale }` shared between modules.
6. **RF6 (Positional Coupling):** Collapse `initialize → loadPricing → ready` into a single `start()` method that handles sequencing internally.

---

## Example 2: "Strong" — Notification Pipeline

### Step 1: Identify Modules

- `NotificationRouter` — Routes notification requests to the correct channel
- `EmailChannel` — Sends emails (implements `NotificationChannel`)
- `SmsChannel` — Sends SMS (implements `NotificationChannel`)
- `PushChannel` — Sends push notifications (implements `NotificationChannel`)
- `NotificationChannel` — Interface defining the contract

### Step 2: Map Dependencies

```
NotificationRouter
  └── depends on NotificationChannel[] (interface, injected)

EmailChannel ──implements──→ NotificationChannel
SmsChannel   ──implements──→ NotificationChannel
PushChannel  ──implements──→ NotificationChannel

No module imports another module's internals.
Each channel receives config via constructor injection.
```

### Step 3: Apply Red Flags

| Flag | Triggered? | Evidence |
|------|-----------|----------|
| RF1 Shotgun Surgery | No | Adding a channel = one new class + one config line |
| RF2 Train Wreck | No | No chained accessors |
| RF3 Boolean Blindness | No | |
| RF4 Intimate Knowledge | No | Router only knows the interface |
| RF5 Shared Mutable State | No | Each channel owns its own state |
| RF6 Positional Coupling | No | Channels can be registered in any order |
| RF7 Fat Interface | No | NotificationChannel has 2 methods, both used |
| RF8 Concrete Dependency | No | All dependencies injected |
| RF9 Data Clump | No | |
| RF10 Leaky Encoding | No | Public types are boundary DTOs |
| RF11 Connascence of Meaning | **YES** | Channel names ("email", "sms") are strings in config — could use an enum |
| RF12 Divergent Change | No | Each module has a single reason to change |
| RF13 Parasitic Test | No | Each channel tested with mock transport |

**Red flags triggered: 1**

### Step 4: Apply Green Flags

| Flag | Present? | Evidence |
|------|---------|----------|
| GF1 Single-Sentence Purpose | **YES** | "NotificationRouter dispatches notifications to configured channels." |
| GF2 Swappable Implementation | **YES** | Swap EmailChannel impl by changing DI binding |
| GF3 Test in Isolation | **YES** | Each channel tested with mock transport layer |
| GF4 Tell, Don't Ask | **YES** | Router tells channel to `send()`, doesn't query state |
| GF5 Narrow Interface | **YES** | 2-method interface, both methods used by router |
| GF6 Data In, Data Out | Partial | Channels have side effects (sending) but core routing logic is pure |
| GF7 Composed via Interfaces | **YES** | All deps are `NotificationChannel` interface |
| GF8 Event-Driven Decoupling | **YES** | Router doesn't know concrete channel implementations |
| GF9 Stable Boundary Types | **YES** | `NotificationRequest` DTO defined at boundary |
| GF10 Configuration Over Convention | **YES** | Active channels driven by config |
| GF11 Pipeable / Composable | Partial | Could chain channels but current design is dispatch-based |
| GF12 Connascence of Name Only | **YES** | Modules share only interface method names |
| GF13 Symmetric Change Cost | **YES** | New channel = one class + one config entry |

**Green flags present: 10**

### Step 5: Score

1 red flag, 10 green flags → **Strong**

### Step 6: Recommend

Minor improvement: Replace channel name strings with a `ChannelType` enum to eliminate the one remaining red flag (RF11). This would bring the design to 0 red flags, 11 green flags.

```typescript
enum ChannelType { Email = "email", Sms = "sms", Push = "push" }
```
