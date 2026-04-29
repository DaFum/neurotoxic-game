# src/assets - Agent Instructions

## Agent Purpose

Agents in `src/assets/**` manage asset exports, asset-adjacent rendering contracts, tokenized color usage, and external image routing through `loadTexture`.

## Agent Limitations

Agents must not hardcode colors, bypass `loadTexture`, alter Pollinations key handling, or change audio note cap semantics. Defer to humans before replacing bundled media, changing licensing assumptions, or reworking generated asset pipelines.

## Scope

Applies to `src/assets/**`.

## Rules

- Keep asset module exports stable for components and scenes that import by named asset keys.
- Do not hardcode colors in generated or asset-adjacent rendering helpers; use project tokens.
- For dynamic external images, route loading through `loadTexture` instead of direct Pixi texture parsing.

## Gotchas

- Pollinations image URLs are valid project inputs; preserve key handling for them.
- Audio/rhythm assets must preserve JSON-note cap semantics: OGG/MIDI stop at `maxNoteTime + NOTE_TAIL_MS`, procedural excerpts use full duration.
