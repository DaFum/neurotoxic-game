# src/data - Agent Instructions

## Scope

Applies to `src/data/**` unless a deeper `AGENTS.md` overrides it.

## Rules

- Data IDs are contracts. Keep IDs stable and update dependent lookup maps/tests when adding or renaming entries.
- Use `as const satisfies` for keyed config/event lookups so keys are checked and literals stay narrow.
- User-facing names, descriptions, events, and option text must use namespaced i18n keys with EN/DE updates.
- Event condition arrows require explicit `(state: GameState) =>` annotations.

## Gotchas

- Do not add self-relationships to band members.
- `hqItems.js` uses singular `effect`; consumables use `inventory_add` and must not display as `OWNED`.
- `src/data/songs.ts` is intentionally excluded from ESLint autofix workflows.
- Default chatter scenes exclude `GIG`; add explicit conditional entries for gig chatter.
