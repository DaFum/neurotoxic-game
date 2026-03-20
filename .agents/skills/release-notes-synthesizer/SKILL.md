---
name: release-notes-synthesizer
description: create release notes from commit history. Trigger when preparing a release, summarizing changes, or writing a changelog. Understands Conventional Commits. Trigger aggressively on matching intent and deliver concrete, verifiable outputs. Synthesize release notes by commit intent, user impact, and migration/testing implications.
compatibility: Node.js 22.13+, pnpm
metadata:
  version: '1.0.0'
  author: 'neurotoxic-project'
  category: 'documentation'
  keywords: ['documentation', 'release', 'notes', 'changelog']
  maturity: 'beta'
license: 'Proprietary. See LICENSE.txt for terms'
---

# Release Notes Synthesizer

Generate professional release notes based on the project's commit history.

## Workflow

1.  **Gather History**
    - List commits since the last tag.
    - Filter out irrelevant commits (e.g., "wip", "merge").

2.  **Categorize Changes**
    - **Features (`feat`)**: New user-facing capabilities.
    - **Fixes (`fix`)**: Bug resolutions.
    - **Refactors (`refactor`)**: Internal improvements.
    - **Chores (`chore`)**: Maintenance/Chores.
    - **Breaking Changes (`!` or `BREAKING CHANGE`)**: Critical warnings.

3.  **Draft the Notes**
    - **Headline**: Major version or theme of the release.
    - **Sections**: Features, Fixes, Chores.
    - **Highlight**: Call out the most impactful change first.

4.  **Format**
    Use Markdown list items. Keep descriptions concise.

## Example

**Input**: "Draft notes for the last 5 commits."

**Commits**:

- `feat(audio): add reverb effect`
- `fix(ui): correct button alignment`
- `chore: update deps`

**Output**:

```markdown
# Release v1.2.0

## Features

- **Audio**: Added new reverb effect to the synth engine.

## Bug Fixes

- **UI**: Fixed button alignment issues in the main menu.

## Maintenance

- Updated dependencies to latest stable versions.
```

_Skill sync: compatible with React 19.2.4 / Vite 8.0.1 baseline as of 2026-03-18._
