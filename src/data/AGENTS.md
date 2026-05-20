# src/data - Agent Instructions

## IDs & Events

- Data IDs are contracts. Keep IDs stable and update dependent lookup maps/tests when adding or renaming entries.
- Event condition arrows require explicit `(state: GameState) =>` annotations.

## HQ Items

- In `src/data/hqItems.ts`, each item uses a singular `effect` property, not `effects`.
- HQ item `cost` must be an integer multiple of 10, and `currency` must be `'money'` or `'fame'`; `tests/node/hqItems.test.js` enforces both.
- New HQ items also need EN/DE entries in `public/locales/{en,de}/items.json`.

## Songs

- Validate `src/data/songs.ts` and `src/assets/rhythm_songs.json` changes with `tests/node/songsData.test.js` for transform edge cases and `tests/node/songs-real.test.js` for production data contracts; lint/autofix does not catch missing or malformed song data.

## Randomness

- Non-deterministic event conditions and effects (e.g. `crisis.ts` raid roll) must use `secureRandom()` from `src/utils/crypto`, not `Math.random()`. `secureRandom()` throws when the Crypto API is unavailable; the `Math.random()` fallback lives in `getSafeRandom()`/`getSafeUUID()` wrappers. Tests stub the imported function directly.

## Traits

- Legacy save shapes may store `traits` as an array; trait helpers (`hasTrait`, duplicate-unlock checks) must `Array.isArray` and handle both arrays and object maps keyed by trait ID. Do not normalize on read without also migrating the persisted save.
