# Visual Grammar

Choose a diagram family by the question it answers. Split the work when two questions require
different grammars.

| Question | Family | Primary marks |
|---|---|---|
| What exists and where are its boundaries? | Context or architecture | Containers, components, dependencies |
| What happens, in what order, and where can it branch? | Flow or sequence | Steps, arrows, decisions, terminal states |
| What can change and which transitions are legal? | State model | States, labeled transitions, guards |
| What data exists and how is it related? | Data model | Entities, relationships, cardinality |
| What led to what over time? | Timeline | Time axis, events, phases, decisions |
| How do ideas support, oppose, or contain one another? | Concept map | Concepts, typed links, clusters |

## Reading order

Use one dominant direction. Left-to-right suits pipelines and sequences; top-to-bottom suits
hierarchy and decomposition. Place exceptional paths outside the primary lane and route their edges
away from the main path.

Create hierarchy with position and containment before relying on color. A useful architecture order
is environment, boundary, component, interface. A useful process order is actor, trigger, action,
decision, outcome.

## Semantic marks

Assign each visual mark one stable meaning within a scene:

- Shape identifies kind: process, decision, datastore, actor, boundary, or note.
- Line style identifies relationship: synchronous call, asynchronous event, ownership, dependency,
  or uncertainty.
- Color identifies status or domain, not both.
- Spatial containment means ownership, deployment, or scope only when the label says which.

Include a compact legend when a meaning is not conventional or immediately obvious. Label arrows
with verbs or payloads. Avoid unlabeled lines between unlike components.

## Current and proposed states

For `MIXED` scenes, give current and proposed material different line styles or saturation and label
both states directly. Do not rely on red/green alone. Mark uncertainty next to the uncertain node or
edge instead of hiding it in a footnote.

## Density

Aim for 5-12 primary objects in one view. More is acceptable when repeated items form a clear group,
but the framing question still needs one dominant path. Split overview and detail when labels shrink,
edges cross repeatedly, or containers need paragraphs to explain themselves.

Use short labels in shapes and put substantial explanation in nearby notes or linked documentation.
Whitespace is routing space and hierarchy, not unused canvas.

## Review tests

1. Two-second test: can a new viewer identify the subject, entry point, and primary direction?
2. Trace test: can each important path be followed without guessing which edge continues where?
3. Legend test: does each shape, color, and line style keep one meaning?
4. Source test: can every factual node and edge be traced to code, a document, or user input?
5. Change test: in a revision, did untouched regions remain visually and structurally stable?
