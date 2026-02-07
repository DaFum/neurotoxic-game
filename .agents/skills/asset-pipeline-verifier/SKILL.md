---
name: asset-pipeline-verifier
description: Verify asset paths, glob patterns, and references for broken links or missing files. Use when assets fail to load, paths are undefined, or MIME issues are suspected.
---

# Asset Pipeline Verifier

## Workflow

1. Identify asset loading patterns (`import.meta.glob`, `new URL`, public paths).
2. Check for missing files or mismatched paths.
3. Confirm assets live in `public/` or are imported from `src/` as expected.

## Command

- Prefer the bundled script: `./.agents/skills/asset-pipeline-verifier/scripts/asset-scan.sh`

## Output

- List suspect references and missing assets.
