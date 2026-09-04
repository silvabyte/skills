---
name: diagramming
description: Diagram new or existing systems, processes, data models, concepts, and plans as editable Excalidraw scenes. Use when the user asks to create, revise, map, visualize, or document something with a diagram; when code or docs need an architecture, flow, state, sequence, or relationship view; or when an existing .excalidraw file needs editing.
compatibility: Excalidraw or an Excalidraw-compatible local editor for visual review; Node.js 20+ for the bundled scene inspector.
---

# Diagramming

A diagram is a visual argument. Make one claim legible, show the evidence for it, and leave the
source editable.

## 1. Frame the question

Write the one question the diagram must answer. Identify its audience, source boundary, and status:
`CURRENT`, `PROPOSED`, or `MIXED`. Ask one short question only when one of those choices would
materially change the result.

Completion criterion: the question can be answered by relationships visible in the finished scene,
not by explanatory prose outside it.

## 2. Build the inventory

Read the authoritative code, documents, or existing scene before drawing.

For a new scene, list the entities, relationships, boundaries, and uncertainties in plain text. Pick
the diagram family that exposes the important relationship; consult
[`references/visual-grammar.md`](references/visual-grammar.md) when choosing or combining views.

For an existing scene, inspect both its rendered appearance and its source:

```bash
node <path-to-skill>/scripts/inspect-excalidraw.mjs <scene.excalidraw>
```

Record its visual grammar: direction, shape meanings, colors, containers, labels, and level of detail.
Treat stable element IDs, bindings, embedded files, and metadata as preserved data.
Record any inspector warnings as the baseline; a revision must not introduce new warnings.

Completion criterion: every planned node and edge has a source or is visibly marked `OPEN`,
`ASSUMPTION`, or `PROPOSED`.

## 3. Compose the scene

Draft the reading order before polishing. Use nouns for things, verbs for relationships, and one
visual meaning per shape/color. Prefer a small overview plus a focused detail scene over one poster
that answers several questions badly.

- Architecture: boundaries first, then components, then labeled dependencies or data movement.
- Process or sequence: trigger first, one dominant direction, explicit branches and terminal states.
- Data model: entities first, named relationships and cardinality, storage detail only when relevant.
- Concept map: thesis near the visual anchor, relationships labeled by meaning rather than decoration.

Completion criterion: a viewer can find the entry point, follow the primary path, and distinguish
fact from proposal without a verbal walkthrough.

## 4. Author the editable source

Resolve the durable destination in this order:

1. A path or repository named by the user.
2. `$DIAGRAMS_REPO` when it is set.
3. `~/code/diagrams` when that repository exists.
4. The current repository's existing diagram convention.

If none applies, ask where the durable source belongs rather than scattering it into an arbitrary
application folder. In the default diagrams repository, place scenes under
`drawings/work/<project>/`, `drawings/personal/<topic>/`, or `drawings/learning/<topic>/`; ask one
short question if the collection cannot be inferred. Use `.excalidraw` as the source of truth;
exports such as PNG, SVG, and PDF are renditions.

For a new scene, start from [`assets/blank.excalidraw`](assets/blank.excalidraw) or create the scene in
Excalidraw. For graph-like content, Mermaid imported through Excalidraw is a useful first layout, not
the final composition. For an existing scene, make the smallest complete edit and match its visual
language.

Prefer Excalidraw's UI or APIs. When editing scene JSON directly, first read
[`references/excalidraw-source.md`](references/excalidraw-source.md). Preserve unrecognized fields and
all embedded files.

Completion criterion: the editable file exists at the agreed path and contains the full requested
change without unrelated scene rewrites.

## 5. Prove the diagram

Run the repository's own validation command when present, then run the bundled inspector:

```bash
node <path-to-skill>/scripts/inspect-excalidraw.mjs <scene.excalidraw>
node <path-to-skill>/scripts/inspect-excalidraw.mjs --strict <new-scene.excalidraw>
```

Open the scene in Excalidraw and review it at fit-to-screen and 100% zoom. Check the primary reading
path, text clipping, overlaps, accidental edge crossings, contrast, and the visible distinction
between current and proposed material. Compare before and after when revising an existing scene.

If no compatible visual surface is available, stop after structural validation and deliver the file
as `NEEDS VISUAL REVIEW` with the exact review checklist. Structural validation alone does not prove
the diagram is finished.

Completion criterion: source validation passes, the rendered scene is readable at both zoom levels,
and every relationship needed to answer the framing question is visible.

## 6. Deliver

Report the editable source path, the question it answers, the source boundary, and any visible
uncertainties. Mention rendition paths only when they were requested or generated. Do not claim an
inference as a discovered system fact.

Completion criterion: every requested editable source and rendition is accounted for, the framing
question and source boundary are stated, and each unresolved item is labeled rather than omitted.
