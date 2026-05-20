# tests/node - Agent Instructions

- Use `test:node:quick` for normal local loops and `test:node:heavy` for Pixi/render-heavy suites.
- Travel/location assertions need both legacy and canonical venue ID cases.
- Load/reset tests verify whitelist sanitization, not raw spread assumptions.
- Keep `songsData.test.js` on transform edge cases and `songs-real.test.js` on production-dataset contracts; real-dataset assertions include `song.id` in failure messages.
- `mapGenerator.test.js` imports `getCityKeyFromVenueId` directly; assert prefix extraction (including the empty-string case for IDs with no underscore) alongside `cityStates` population and key-to-venue-prefix alignment.
- `economyEngine.test.js` `calculateMerchIncome` tests must cover custom `context.merchPrices` — verify non-default prices change revenue vs default, and identical prices produce identical revenue.
- Split-runner commands must stay Windows-shell portable.
