# tests/node - Agent Instructions

## Scope

Applies to `tests/node/**`.

## Rules

- Use focused `node:test` suites for reducer and state-machine regressions.
- Keep fixtures representative of sanitized runtime shapes.
- Use `test:node:quick` for normal local loops and `test:node:heavy` for Pixi/render-heavy suites.
- Model typed fixtures explicitly when testing strict CheckJS paths.

## Gotchas

- Travel/location assertions need legacy and canonical venue ID cases.
- Load/reset tests should verify whitelist sanitization instead of raw spread assumptions.
- Avoid duplicate callback-reference stability suites; colocate with the main hook behavior suite.
- Keep `songsData.test.js` focused on transform edge cases and `songs-real.test.js` on production dataset contracts.
- Split-runner commands must stay Windows-shell portable.
- Real dataset assertions should include `song.id` in failure messages.
- `mapGenerator.test.js` imports `getCityKeyFromVenueId` directly; assert prefix extraction (including the empty-string case for IDs with no underscore) alongside `cityStates` population and key-to-venue-prefix alignment.
- `economyEngine.test.js` tests for `calculateMerchIncome` must cover custom `context.merchPrices` — verify that non-default prices change revenue vs the default, and that identical prices produce identical revenue.
