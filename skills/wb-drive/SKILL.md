---
name: wb-drive
version: 1.0.0
description: "Weekend Business Shared Drive: Browse, search, upload, and manage files. Triggers: 'weekend business drive', 'wb drive', 'upload to brand', 'shared drive', 'WB shared drive', 'list WB files', 'find in drive'"
metadata:
  openclaw:
    category: "productivity"
    requires:
      bins: ["gws"]
    cliHelp: "gws drive --help"
---

# Weekend Business Shared Drive

> **PREREQUISITE:** Read `../gws-shared/SKILL.md` for auth, global flags, and security rules.

## Drive Constant

```
DRIVE_ID = 0APkifbJ0Yk3mUk9PVA
```

This is the only hardcoded value. All folder and file IDs are discovered at runtime.

## Critical: Shared Drive Flags

Every `gws drive` call against this shared drive **must** include these params:

```json
{ "supportsAllDrives": true, "includeItemsFromAllDrives": true }
```

Without these, the API returns empty results or 404 errors for shared drive content.

## Workflow: Discover Before Operating

Never assume folder IDs. Always discover the current structure first.

### Step 1 — List top-level folders

```bash
gws drive files list \
  --params '{
    "q": "\"0APkifbJ0Yk3mUk9PVA\" in parents and mimeType=\"application/vnd.google-apps.folder\" and trashed=false",
    "driveId": "0APkifbJ0Yk3mUk9PVA",
    "corpora": "drive",
    "supportsAllDrives": true,
    "includeItemsFromAllDrives": true,
    "fields": "files(id,name)"
  }' --format table
```

### Step 2 — Drill into a folder by name

Use the folder ID from Step 1 to list its contents:

```bash
gws drive files list \
  --params '{
    "q": "\"FOLDER_ID\" in parents and trashed=false",
    "supportsAllDrives": true,
    "includeItemsFromAllDrives": true,
    "fields": "files(id,name,mimeType,modifiedTime)"
  }' --format table
```

### Step 3 — Operate on the target file or folder

Use the discovered ID for get, download, upload, update, etc.

## Full Tree Discovery

Instead of drilling one folder at a time, discover the entire drive structure in one shot. Run both queries in parallel at session start, then use the `parents` field to reconstruct the tree in memory.

```bash
# Discover all folders in the drive
gws drive files list \
  --params '{
    "q": "mimeType=\"application/vnd.google-apps.folder\" and trashed=false",
    "driveId": "0APkifbJ0Yk3mUk9PVA",
    "corpora": "drive",
    "supportsAllDrives": true,
    "includeItemsFromAllDrives": true,
    "fields": "files(id,name,parents)"
  }' --page-all

# Discover all Google Docs in the drive
gws drive files list \
  --params '{
    "q": "mimeType=\"application/vnd.google-apps.document\" and trashed=false",
    "driveId": "0APkifbJ0Yk3mUk9PVA",
    "corpora": "drive",
    "supportsAllDrives": true,
    "includeItemsFromAllDrives": true,
    "fields": "files(id,name,parents)"
  }' --page-all
```

Cache the results for the rest of the session to avoid redundant lookups.

## Recipes

### Browse drive structure

```bash
# List top-level folders
gws drive files list \
  --params '{
    "q": "\"0APkifbJ0Yk3mUk9PVA\" in parents and mimeType=\"application/vnd.google-apps.folder\" and trashed=false",
    "driveId": "0APkifbJ0Yk3mUk9PVA",
    "corpora": "drive",
    "supportsAllDrives": true,
    "includeItemsFromAllDrives": true,
    "fields": "files(id,name)"
  }' --format table

# List contents of a subfolder (replace FOLDER_ID)
gws drive files list \
  --params '{
    "q": "\"FOLDER_ID\" in parents and trashed=false",
    "supportsAllDrives": true,
    "includeItemsFromAllDrives": true,
    "fields": "files(id,name,mimeType,modifiedTime)"
  }' --format table
```

### Resolve a folder name to its ID

```bash
gws drive files list \
  --params '{
    "q": "name=\"Brand\" and mimeType=\"application/vnd.google-apps.folder\" and trashed=false",
    "driveId": "0APkifbJ0Yk3mUk9PVA",
    "corpora": "drive",
    "supportsAllDrives": true,
    "includeItemsFromAllDrives": true,
    "fields": "files(id,name,parents)"
  }'
```

### List files in a discovered folder

```bash
gws drive files list \
  --params '{
    "q": "\"FOLDER_ID\" in parents and trashed=false",
    "supportsAllDrives": true,
    "includeItemsFromAllDrives": true,
    "fields": "files(id,name,mimeType,size,modifiedTime)",
    "orderBy": "modifiedTime desc"
  }' --format table
```

### Upload a file to a discovered folder

```bash
gws drive +upload ./file.pdf --parent FOLDER_ID
```

Or with the low-level API for more control:

```bash
gws drive files create \
  --upload ./file.pdf \
  --params '{"supportsAllDrives": true}' \
  --json '{"name": "file.pdf", "parents": ["FOLDER_ID"]}'
```

> [!CAUTION]
> This is a **write** command — confirm with the user before executing.

### Search the entire drive

```bash
# By name (partial match)
gws drive files list \
  --params '{
    "q": "name contains \"logo\" and trashed=false",
    "driveId": "0APkifbJ0Yk3mUk9PVA",
    "corpora": "drive",
    "supportsAllDrives": true,
    "includeItemsFromAllDrives": true,
    "fields": "files(id,name,mimeType,parents,modifiedTime)"
  }' --format table

# By MIME type (e.g., all PDFs)
gws drive files list \
  --params '{
    "q": "mimeType=\"application/pdf\" and trashed=false",
    "driveId": "0APkifbJ0Yk3mUk9PVA",
    "corpora": "drive",
    "supportsAllDrives": true,
    "includeItemsFromAllDrives": true,
    "fields": "files(id,name,parents,modifiedTime)"
  }' --format table
```

### Get file metadata or download

```bash
# Metadata
gws drive files get \
  --params '{
    "fileId": "FILE_ID",
    "supportsAllDrives": true,
    "fields": "id,name,mimeType,size,modifiedTime,webViewLink"
  }'

# Download binary file
gws drive files get \
  --params '{
    "fileId": "FILE_ID",
    "supportsAllDrives": true,
    "alt": "media"
  }' --output ./downloaded-file.pdf

# Export Google Doc as PDF
gws drive files export \
  --params '{
    "fileId": "FILE_ID",
    "mimeType": "application/pdf"
  }' --output ./exported.pdf
```

### Delete a file

```bash
gws drive files delete --params '{"fileId": "FILE_ID", "supportsAllDrives": true}'
```

> [!CAUTION]
> This is a **write** command — confirm with the user before executing.

### Create a new subfolder

```bash
gws drive files create \
  --params '{"supportsAllDrives": true}' \
  --json '{
    "name": "New Folder",
    "mimeType": "application/vnd.google-apps.folder",
    "parents": ["PARENT_FOLDER_ID"]
  }'
```

> [!CAUTION]
> This is a **write** command — confirm with the user before executing.

## Working with Google Docs

### Read a Google Doc as markdown

```bash
gws drive files export \
  --params '{"fileId": "DOC_ID", "mimeType": "text/markdown"}' \
  --output ./doc.md
```

### Append text to a Google Doc

```bash
gws docs +write --document DOC_ID --text 'Text to append'
```

### Rich editing via batchUpdate

For link updates, text replacements, and structural changes:

```bash
# 1. Get the doc structure to find element positions
gws docs documents get --params '{"documentId": "DOC_ID"}'

# 2. Apply changes via batchUpdate (example: update a link URL)
gws docs documents batchUpdate \
  --params '{"documentId": "DOC_ID"}' \
  --json '{
    "requests": [
      {
        "updateTextStyle": {
          "range": {"startIndex": START, "endIndex": END},
          "textStyle": {"link": {"url": "https://new-url.com"}},
          "fields": "link"
        }
      }
    ]
  }'
```

Tips for batchUpdate:
- Parse the JSON body content to find element positions (startIndex/endIndex).
- To replace text: use `deleteContentRange` then `insertText` at the start index.
- Table cells always end with a trailing newline — you cannot delete it. Account for this when replacing cell content.
- Process ranges in reverse order (highest index first) to avoid invalidating positions.

### Convert markdown to Google Doc (two-step workaround)

Direct upload with `mimeType: application/vnd.google-apps.document` returns 400. Use this workaround:

```bash
# 1. Convert markdown to HTML
pandoc -f markdown -t html -o ./file.html ./file.md

# 2. Upload the HTML file
gws drive files create \
  --upload ./file.html \
  --json '{"name": "temp-upload", "parents": ["FOLDER_ID"]}' \
  --params '{"supportsAllDrives": true}'
# Note the returned file ID → HTML_ID

# 3. Copy with conversion to Google Doc
gws drive files copy \
  --params '{"fileId": "HTML_ID", "supportsAllDrives": true}' \
  --json '{"name": "My Document", "mimeType": "application/vnd.google-apps.document", "parents": ["FOLDER_ID"]}'

# 4. Delete the temp HTML file
gws drive files delete --params '{"fileId": "HTML_ID", "supportsAllDrives": true}'
```

> [!CAUTION]
> Steps 2–4 are **write** commands — confirm with the user before executing.

## Tips

- Use `fields` on every call to limit response size and avoid quota issues.
- Use `--format table` for human-readable output; omit it (defaults to JSON) for piping.
- Use `--page-all` when a folder may have more than 100 items.
- Drive search `q` syntax: `name contains "x"`, `name = "x"`, `mimeType = "..."`, `"parentId" in parents`, `modifiedTime > "2024-01-01"`.
- Combine query terms with `and`: `name contains "logo" and mimeType = "image/png" and trashed = false`.
- Cache discovered folder IDs within a session to avoid redundant lookups.
- Folder MIME type: `application/vnd.google-apps.folder`.

## See Also

- [gws-shared](../gws-shared/SKILL.md) — Auth, global flags, and security rules
- [gws-drive](../gws-drive/SKILL.md) — Full Drive API reference
- [gws-drive-upload](../gws-drive-upload/SKILL.md) — Upload helper
- [gws-docs](../gws-docs/SKILL.md) — Read and write Google Docs
- [gws-docs-write](../gws-docs-write/SKILL.md) — Append text to a Google Doc
