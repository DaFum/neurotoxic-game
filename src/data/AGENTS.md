# src/data - Agent Instructions

- Data IDs are contracts. Keep IDs stable and update dependent lookup maps/tests when adding or renaming entries.
- Event condition arrows require explicit `(state: GameState) =>` annotations.
- `hqItems.js` uses singular `effect`. HQ item `cost` must be an integer multiple of 10 and `currency` must be `'money'` or `'fame'`; `tests/node/hqItems.test.js` enforces both. New items also need EN/DE entries in `public/locales/{en,de}/items.json`.
- `src/data/songs.ts` is intentionally excluded from ESLint autofix workflows.
- Non-deterministic event conditions and effects (e.g. `crisis.ts` raid roll) must use `secureRandom()` from `src/utils/crypto`, not `Math.random()`. `secureRandom()` throws when the Crypto API is unavailable; the `Math.random()` fallback lives in `getSafeRandom()`/`getSafeUUID()` wrappers. Tests stub the imported function directly.
- Legacy save shapes may store `traits` as an array; trait helpers (`hasTrait`, duplicate-unlock checks) must `Array.isArray` and handle both array and record forms. Do not normalize on read without also migrating the persisted save.
