# src/data — Agent Instructions

## Scope

Applies to `src/data/**`.

## Data Authoring Rules

- Keep data modules deterministic and side-effect free.
- Preserve stable IDs; do not rename IDs used by saves/tests unless migration support is added.
- For user-facing copy keys, use i18n keys only (no raw UI strings in data objects).

## Event/Data Gotchas

- `events/special` entries require unique IDs, `category: 'special'`, `events:` i18n keys, and a valid `options` array.
- `hqItems` entries use singular `effect` object shape.
- Consumables should use `inventory_add` effects and remain multi-purchase capable.
- `postOptions` `resolve()` handlers should enforce member-list invariants with explicit guards when conditions assume non-empty `band.members`.

## Migration Rules

- Keep schema shape backward compatible for save/test fixtures.

## Nested TypeScript Notes

- Keep event/data module contracts stable; do not rename IDs or shape keys without migration support.
- Annotate condition callbacks explicitly (`(state: GameState) => ...`) in data event pools to avoid implicit-`any` failures in CheckJS.
- Use narrow literal unions/const assertions for category/type fields to preserve downstream type narrowing.

## Domain Gotchas

- Chatter/event data validators may throw on malformed entries; scheduling loops that consume these pools must catch and continue instead of halting.
- Event/message copy fields are treated as i18n keys in rendering paths; introducing raw text here requires explicit `defaultValue` fallback handling in consumers.

## Recent Findings (2026-04)

- New menu-driven systems should reuse existing data keys where possible; introducing parallel IDs for the same feature increases save/test drift risk.
- Event-pool modules with growing condition complexity should live under `src/data/events/**` and follow the nested `src/data/events/AGENTS.md` guardrails for typed conditions and composite-effect validity.
- In `postOptions`, once a `resolve()` path is touched for invariant/type fixes (for example `requireBandMembers` guards), migrate neighboring user-facing `message` strings in that same resolver to `ui:postOptions.*` keys in both EN/DE locale files to avoid mixed i18n/raw-copy behavior.
- `postOptions.resolve()` paths that rely on `requireBandMembers` may throw on invariant violations; downstream social/post orchestration must catch and recover instead of assuming soft-failure return objects.
