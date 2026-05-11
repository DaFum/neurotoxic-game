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
- HQ item `cost` must be an integer multiple of 10 and `currency` must be `'money'` or `'fame'`; `tests/node/hqItems.test.js` enforces both. New items also need EN/DE entries in `public/locales/{en,de}/items.json`.
- `src/data/songs.ts` is intentionally excluded from ESLint autofix workflows.
- Default chatter scenes exclude `GIG`; add explicit conditional entries for gig chatter.
- Non-deterministic event conditions and effects (e.g. `crisis.ts` raid roll) must use `secureRandom()` from `src/utils/crypto`, not `Math.random()`. Tests stub the import; `Math.random()` is reserved as a last-resort runtime fallback inside `secureRandom` itself.
- Legacy save shapes may store `traits` as an array; trait helpers (`hasTrait`, duplicate-unlock checks) must `Array.isArray` and handle both array and record forms. Do not normalize on read without also migrating the persisted save.
