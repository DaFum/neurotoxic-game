# src/components/pregig — Agent Instructions

## Scope

Applies to `src/components/pregig/**`.

## Domain Gotchas

- `currentModifiers.activeEffects` is a mixed defensive contract: producers should emit object entries with a required `key`, but render paths must still safely handle legacy string entries.
- Do not spread untrusted effect `options` directly into `t(...)`; sanitize to primitive values before interpolation.
- Keep TypeScript props and runtime `propTypes` aligned for `activeEffects` object entries (`key` must remain required).

## Recent Findings (2026-04)

- PreGig modifier effect shapes are shared with hooks and simulation utilities via `src/types/components.d.ts`; avoid local re-declarations in component files.
