---
name: asset-pipeline-verifier
description: Verify asset paths, glob patterns, and references for broken links or missing files. Use when assets fail to load, paths are undefined, or MIME issues are suspected.
---

# Asset Pipeline Verifier

## Key Files

- `src/assets/` — MIDI files, images, and `rhythm_songs.json`
- `public/` — static assets served directly by Vite
- `src/utils/imageGen.js` — image generation and loading
- `src/utils/AudioManager.js` — audio asset loading
- `vite.config.js` — Vite asset handling configuration

## Workflow

1. Identify asset loading patterns in `src/`: `import.meta.glob`, `new URL(... import.meta.url)`, and public path references.
2. Cross-check `src/assets/rhythm_songs.json` references against actual MIDI files in `src/assets/`.
3. Check for missing files or mismatched paths in `imageGen.js` and `AudioManager.js`.
4. Confirm assets live in `public/` (static) or are imported from `src/` (bundled) as expected.

## Command

- Prefer the bundled script: `./.agents/skills/asset-pipeline-verifier/scripts/asset-scan.sh`

## Output

- List suspect references and missing assets with file paths.

## Related Skills

- `perf-budget-enforcer` — large assets impact bundle size budgets
