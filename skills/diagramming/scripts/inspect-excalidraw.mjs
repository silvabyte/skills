#!/usr/bin/env node

import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const rawArguments = process.argv.slice(2);
const jsonOutput = rawArguments.includes("--json");
const strict = rawArguments.includes("--strict");
const filePaths = rawArguments.filter(
  (argument) => argument !== "--json" && argument !== "--strict",
);

if (filePaths.length === 0) {
  console.error(
    "Usage: node inspect-excalidraw.mjs [--strict] [--json] <scene.excalidraw> [...]",
  );
  process.exit(2);
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function summarizeText(value) {
  return value.replace(/\s+/g, " ").trim().slice(0, 120);
}

async function inspectScene(filePath) {
  const absolutePath = path.resolve(filePath);
  const errors = [];
  const warnings = [];

  try {
    const [contents, fileStats] = await Promise.all([
      readFile(absolutePath, "utf8"),
      stat(absolutePath),
    ]);
    const scene = JSON.parse(contents);

    if (scene.type !== "excalidraw") {
      errors.push('top-level "type" must be "excalidraw"');
    }
    if (!Array.isArray(scene.elements)) {
      errors.push('top-level "elements" must be an array');
    }
    if (
      scene.files !== undefined &&
      (scene.files === null ||
        typeof scene.files !== "object" ||
        Array.isArray(scene.files))
    ) {
      errors.push('top-level "files" must be an object when present');
    }

    const elements = Array.isArray(scene.elements) ? scene.elements : [];
    const files =
      scene.files && typeof scene.files === "object" && !Array.isArray(scene.files)
        ? scene.files
        : {};
    const ids = new Set();
    const visibleElements = [];
    const counts = {};
    const labels = [];

    for (const [index, element] of elements.entries()) {
      if (!element || typeof element !== "object") {
        errors.push(`element ${index} is not an object`);
        continue;
      }

      if (typeof element.id !== "string" || element.id.length === 0) {
        errors.push(`element ${index} has no string id`);
      } else if (ids.has(element.id)) {
        errors.push(`duplicate element id: ${element.id}`);
      } else {
        ids.add(element.id);
      }

      const type = typeof element.type === "string" ? element.type : "unknown";
      counts[type] = (counts[type] ?? 0) + 1;

      if (!element.isDeleted) {
        visibleElements.push(element);
        if ([element.x, element.y, element.width, element.height].some(
          (value) => !finiteNumber(value),
        )) {
          errors.push(`element ${element.id ?? index} has non-finite geometry`);
        }
        if (type === "text" && typeof element.text === "string") {
          labels.push(summarizeText(element.text));
        }
      }
    }

    const checkReference = (owner, field, targetId) => {
      if (targetId && !ids.has(targetId)) {
        warnings.push(`${owner}.${field} references missing element ${targetId}`);
      }
    };

    for (const element of visibleElements) {
      const owner = element.id ?? "unknown";
      checkReference(owner, "containerId", element.containerId);
      checkReference(owner, "frameId", element.frameId);
      checkReference(owner, "startBinding", element.startBinding?.elementId);
      checkReference(owner, "endBinding", element.endBinding?.elementId);

      if (Array.isArray(element.boundElements)) {
        for (const binding of element.boundElements) {
          checkReference(owner, "boundElements", binding?.id);
        }
      }

      if (element.type === "image") {
        if (!element.fileId) {
          errors.push(`${owner} is a visible image with no fileId`);
        } else if (!files[element.fileId]) {
          errors.push(`${owner}.fileId references missing file ${element.fileId}`);
        } else if (
          typeof files[element.fileId] !== "object" ||
          typeof files[element.fileId].dataURL !== "string" ||
          files[element.fileId].dataURL.length === 0
        ) {
          errors.push(`${owner}.fileId references file data without a dataURL`);
        }
      }
    }

    if (visibleElements.length > 0 && labels.length === 0) {
      warnings.push("scene has visible elements but no text labels");
    }

    const bounds = visibleElements.reduce(
      (result, element) => ({
        minX: Math.min(result.minX, element.x),
        minY: Math.min(result.minY, element.y),
        maxX: Math.max(result.maxX, element.x + element.width),
        maxY: Math.max(result.maxY, element.y + element.height),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    );

    return {
      file: absolutePath,
      valid: errors.length === 0 && (!strict || warnings.length === 0),
      strict,
      bytes: fileStats.size,
      metadataName:
        scene.metadata && typeof scene.metadata.name === "string"
          ? scene.metadata.name
          : null,
      elements: {
        total: elements.length,
        visible: visibleElements.length,
        deleted: elements.filter(
          (element) =>
            element && typeof element === "object" && element.isDeleted === true,
        ).length,
        byType: counts,
      },
      files: Object.keys(files).length,
      rawBounds:
        visibleElements.length > 0
          ? {
              x: bounds.minX,
              y: bounds.minY,
              width: bounds.maxX - bounds.minX,
              height: bounds.maxY - bounds.minY,
            }
          : null,
      labels: labels.slice(0, 30),
      errors,
      warnings,
    };
  } catch (error) {
    return {
      file: absolutePath,
      valid: false,
      strict,
      errors: [error instanceof Error ? error.message : "unknown error"],
      warnings,
    };
  }
}

const results = [];
for (const filePath of filePaths) {
  results.push(await inspectScene(filePath));
}

if (jsonOutput) {
  console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
} else {
  for (const result of results) {
    console.log(`${result.valid ? "OK" : "INVALID"} ${result.file}`);
    if (result.elements) {
      console.log(
        `  ${result.elements.visible}/${result.elements.total} visible elements, ` +
          `${result.files} embedded files, ${result.bytes} bytes`,
      );
      console.log(`  types: ${JSON.stringify(result.elements.byType)}`);
    }
    for (const error of result.errors) {
      console.error(`  error: ${error}`);
    }
    for (const warning of result.warnings) {
      console.warn(`  warning: ${warning}`);
    }
    if (result.strict && result.warnings.length > 0) {
      console.error("  strict mode treats warnings as invalid");
    }
  }
}

if (results.some((result) => !result.valid)) {
  process.exitCode = 1;
}
