---
name: asset-pipeline-verifier
description: diagnose and fix asset loading issues. Trigger when assets fail to load (404), have incorrect MIME types, or when paths are undefined. Checks import.meta.glob, new URL(), and public folder references.
---

# Asset Pipeline Verifier

Diagnose and resolve asset loading failures in the Vite build pipeline.

## Workflow

1.  **Identify the Loading Pattern**
    Determine if the asset is bundled (imported in JS) or static (in `public/`).
    *   **Bundled**: Used via `import`, `import.meta.glob`, or `new URL(..., import.meta.url)`. Lives in `src/`.
    *   **Static**: Referenced via string path (e.g., `/images/logo.png`). Lives in `public/`.

2.  **Scan for References**
    Run the scanner to find usage patterns:
    ```bash
    .claude/skills/asset-pipeline-verifier/scripts/asset-scan.sh
    ```

3.  **Verify Existence and Path**
    *   For `import.meta.glob`: specific patterns (e.g., `/*.png`) must match files.
    *   For `new URL`: Relative paths must be correct relative to the *source file*.
    *   For `public/`: The path in code must *not* include `/public`, just the content (e.g., `public/icon.ico` -> `/icon.ico`).

4.  **Check Configuration**
    Inspect `vite.config.js` for `assetsInclude` or base path configuration if issues persist.

## Common Issues & Fixes

### 404 on Production Build
*   **Cause**: Asset was not hashed/bundled because it was referenced by a dynamic string variable that Vite couldn't analyze.
*   **Fix**: Use `import.meta.glob` to explicitly tell Vite about these files.

### "MIME type" Errors
*   **Cause**: Server returning HTML (the SPA fallback) for a missing asset.
*   **Fix**: The path is wrong. Check if you included `/public` in the URL (remove it) or if the file is missing.

## Example

**Input**: "The game freezes when loading `song1.midi`."

**Process**:
1.  Check `src/assets/rhythm_songs.json` for the entry.
2.  See reference: `"file": "song1.midi"`.
3.  Check if `src/assets/song1.midi` exists.
4.  Check how it's loaded. If via `new URL`, ensure the path is `./song1.midi`.

**Output**:
"The file `src/assets/song1.midi` is missing, but referenced in `rhythm_songs.json`. Please add the file or remove the reference."
