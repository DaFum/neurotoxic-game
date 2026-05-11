# src/components/pregig - Agent Instructions

## Scope

Applies to `src/components/pregig/**`.

## Rules

- Modifier costs come from `MODIFIER_COSTS`; do not duplicate prices in UI.
- Starting a gig must respect the `START_GIG` reset of `gigModifiers`.
- Keep copy and option labels in EN/DE locale files.

## Gotchas

- Previous gig selections do not carry over. UI state should initialize from current defaults, not persisted old selections.
- Band-meeting / harmony-restore actions must guard `band.harmony >= 100` and refund (early-return with a "maxed out" info toast) before deducting cost; the clamp in the reducer would otherwise swallow the spend with no benefit.
