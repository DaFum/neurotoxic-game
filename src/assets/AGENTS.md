# src/assets - Agent Instructions

## Scope

Applies to `src/assets/**`.

## Rules

- Keep asset module exports stable for components and scenes that import by named asset keys.
- Do not hardcode colors in generated or asset-adjacent rendering helpers; use project tokens.
- For dynamic external images, route loading through `loadTexture` instead of direct Pixi texture parsing.

## Gotchas

- Pollinations image URLs are valid project inputs; preserve key handling for them.
- Audio/rhythm assets must preserve JSON-note cap semantics: OGG/MIDI stop at `maxNoteTime + NOTE_TAIL_MS`, procedural excerpts use full duration.
