# tests/node - Agent Instructions

- Use `test:node:quick` for normal local loops and `test:node:heavy` for Pixi/render-heavy suites.
- Travel/location assertions need both legacy and canonical venue ID cases.
- Load/reset tests verify whitelist sanitization, not raw spread assumptions.
- Keep `songsData.test.js` on transform edge cases and `songs-real.test.js` on production-dataset contracts; real-dataset assertions include `song.id` in failure messages.
- `mapGenerator.test.js` imports `getCityKeyFromVenueId` directly; assert prefix extraction (including the empty-string case for IDs with no underscore) alongside `cityStates` population and key-to-venue-prefix alignment.
- `economyEngine.test.js` `calculateMerchIncome` tests must cover custom `context.merchPrices` — verify non-default prices change revenue vs default, and identical prices produce identical revenue.
- Split-runner commands must stay Windows-shell portable.

## Long-Term Assets

- Asset tests live in `assetsReducer`/`assetReducer`, `assetTicks`, `assetSelectors`, `assetSanitizers`, `assetActionCreators`, `assetConfig`, `assetImagePrompts`, `assetModuleRegistry`, `loanProfiles`, `seededRng`, `economyAssetModifiers`, `advanceDayAssetIntegration`, and `assetGoldenPath`. RNG-sensitive tests construct `dayRngStream` arrays explicitly so the test can pin which assets trigger risk events.
- `assetModuleRegistry.test.js` enforces the anti-stacking and prompt-key invariants at build time. Any new module added by section plans must pass these.
- Tests that mutate `MODULE_REGISTRY` / `CHASSIS_CONFIG` (e.g., `assetReducer.test.js`) snapshot the original values and restore them via `test.after(...)` — these are module-scoped mutable maps shared across the test process.
