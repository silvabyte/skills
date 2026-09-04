# Excalidraw Source Editing

An `.excalidraw` file is JSON whose editable scene normally contains:

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "diagramming-skill",
  "elements": [],
  "appState": { "viewBackgroundColor": "#ffffff" },
  "files": {}
}
```

The format evolves. Treat the target file and the installed Excalidraw version as authoritative;
this shape is a starting point, not a complete schema.

## Existing scenes

Preserve top-level fields you do not understand. Keep `files` entries unless every referencing image
element is intentionally removed. Preserve element IDs for unchanged objects so bindings, groups,
frames, and review history remain stable.

An element can participate in several references:

- `containerId` connects bound text to its container.
- `frameId` places an element inside a frame.
- `boundElements[].id` points from a container to bound text or arrows.
- `startBinding.elementId` and `endBinding.elementId` attach a connector.
- `fileId` connects an image element to a `files` entry.

When moving or resizing elements directly, account for bound text, connectors, and frame membership.
Prefer deleting an element through Excalidraw rather than removing only one side of its references.

## New scenes

Start with the bundled blank scene and open it in Excalidraw. Set the scene name and background,
establish the primary layout, then add detail. Let Excalidraw generate element IDs and bindings when
possible.

If direct JSON generation is necessary, derive a complete element of each needed type from a scene
created by the same Excalidraw version. Generate unique IDs and nonces, keep numeric geometry finite,
and validate before opening the result. Avoid inventing a partial element schema from memory.

## Metadata and images

Workspace exports may include a `metadata` object with collection, owner, or timestamps. Preserve it
unless the destination convention explicitly replaces it. Image data is commonly embedded as data
URLs under `files`; this can make scenes large and Git diffs expensive.

For Git repositories, keep files below GitHub's 100 MB per-file limit. Marking `*.excalidraw -diff`
in `.gitattributes` prevents huge one-line JSON diffs while retaining version history. Use Git LFS
only when actual file sizes or repository policy require it.

## Validation

The bundled inspector checks basic scene shape, duplicate IDs, missing element references, missing
embedded image data, and non-finite geometry:

```bash
node <path-to-skill>/scripts/inspect-excalidraw.mjs <scene.excalidraw>
node <path-to-skill>/scripts/inspect-excalidraw.mjs --strict --json <new-scene.excalidraw>
```

Use strict mode for new scenes. For existing workspace exports, record the initial warnings and
require that the edit adds none; stale binding references can survive in files that Excalidraw still
loads and repairs correctly.

Structural validation cannot prove visual quality. Always open the result and inspect the rendered
scene after a source edit.
