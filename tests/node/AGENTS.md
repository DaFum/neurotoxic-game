# tests/node - Agent Instructions

- Use `test:node:quick` for normal local loops and `test:node:heavy` for Pixi/render-heavy suites.
- Travel/location assertions need both legacy and canonical venue ID cases.
- Load/reset tests verify whitelist sanitization, not raw spread assumptions.
- Keep `songsData.test.js` on transform edge cases and `songs-real.test.js` on production-dataset contracts; real-dataset assertions include `song.id` in failure messages.
- `mapGenerator.test.js` imports `getCityKeyFromVenueId` directly; assert prefix extraction (including the empty-string case for IDs with no underscore) alongside `cityStates` population and key-to-venue-prefix alignment.
- `economyEngine.test.js` `calculateMerchIncome` tests must cover custom `context.merchPrices` — verify non-default prices change revenue vs default, and identical prices produce identical revenue.
- Split-runner commands must stay Windows-shell portable.

## Long-Term Assets

- Asset tests live in `assetReducer`, `assetTicks`, `assetSelectors`, `assetSanitizers`, `assetActionCreators`, `assetConfig`, `assetImagePrompts`, `assetModuleRegistry`, `loanProfiles`, `seededRng`, `economyAssetModifiers`, `advanceDayAssetIntegration`, and `assetGoldenPath`. RNG-sensitive tests construct `dayRngStream` arrays explicitly so the test can pin which assets trigger risk events.
- `assetModuleRegistry.test.js` enforces the anti-stacking and prompt-key invariants at build time. Any new module added by section plans must pass these.
- Tests that mutate `MODULE_REGISTRY` / `CHASSIS_CONFIG` / `MODULE_PROMPTS` (e.g., `assetReducer.test.js`, `assetActionCreators.test.js`, `assetGoldenPath.test.js`) MUST snapshot the original values (`structuredClone`) at file scope and restore via `after(...)` — these are module-scoped mutable maps shared across the test process, so mutations leak between sibling test files without a teardown.
- Prompt-key membership checks use `Object.hasOwn(MODULE_PROMPTS, m.imagePromptKey)` — not `assert.ok(MODULE_PROMPTS[key], ...)`. The truthy form fails on valid but falsy values, and `Object.hasOwn` is the project convention for untrusted property checks.
- `LOAN_PROFILES` invariants are pinned via `assert.deepEqual(Object.keys(LOAN_PROFILES).sort(), [...expected])` — an additive change to the registry must update the asserted set so silently-added profiles can't ship unannounced.
- Crowdfund tick fixtures need `materializedAssetId` + `materializedSlotIds` once a section plan populates `CHASSIS_CONFIG[kind].legit[tier].slots`; the tick reads slot ids 1:1 from the campaign and pre-Plan-2 fixtures may otherwise crash on `undefined.0`.

## Tourbus

- `tourbusModules.test.js` enforces: 17 tourbus modules registered, every chassis slot type (except dynamic `tb_trailer_addon`) has at least one compatible module, all `imagePromptKey` references resolve in `MODULE_PROMPTS`, and `tb_trailer_hitch` anti-stacking shape (`slotType` vs `addsSlots[0].slotType`, `maxPerAsset === 1`).
- `tourbusAntiStacking.test.js` runs four end-to-end reducer scenarios via real action creators: hitch install grows the slot set by two `tb_trailer_addon` slots; hitch install into an addon slot fails with `SLOT_TYPE_MISMATCH`; a second hitch install on the same mount fails with `SLOT_OCCUPIED`; and stacking remains capped (no recursive expansion). Test stubs two temporary `tb_trailer_addon`-compatible modules in `before()`/`after()` since no production module declares that slotType — preserve the snapshot/restore pattern when adding new tourbus tests.

## Studio

- `studioModules.test.js` enforces: 14 studio modules registered, every chassis slot type has a compatible module, all `imagePromptKey` references resolve in `MODULE_PROMPTS` via `Object.hasOwn`, and `st_pro_tools_hd.boni.enablesReRecording === true`.
- `studioEconomyIntegration.test.js` verifies `songQualityBonus` additive stacking, the `enablesReRecording` modifier flag, and the broken-asset boni-neutralization guard (condition < 20 → `{}` from `getAssetAggregateBoni`).
- `studioRiskEvents.test.js` verifies DIY modules surface their `riskEventTypes` through `rollAssetRiskEvents` and that the fallback for clean (no `riskEventTypes`) modules is `'fire'` (not the old `'foreclosure'`).

## Bandhaus

- `bandhausModules.test.js` enforces: 16 bandhaus modules registered, every chassis slot type has a compatible module, all `imagePromptKey` references resolve in `MODULE_PROMPTS` via `Object.hasOwn`, and `bh_wall_mural.unlock.requiredStoryFlags` includes `'saved_local_venue'`.
- `bandhausIntegration.test.js` covers four scenarios: `bh_weed_garden` raid risk event via a pinned `dayRngStream`, `bh_wall_mural` story-flag-gated unlock through `isModuleUnlocked`, `bh_hot_tub`'s `infightingDamper` aggregation through `getActiveAssetModifiers`, and the implicit tier-gating of `bh_secret` (absent from `T2_SLOTS`, present in `T3_SLOTS`, mirrored on the DIY side via `buildDiyTier`'s slot clone).

## Merch-Werkstatt

- `workshopModules.test.js` enforces: 16 workshop modules registered, workshop modules use only workshop slot types, all `imagePromptKey` references resolve in `MODULE_PROMPTS` via `Object.hasOwn`, `mw_eco_ink_supply` has the print-module OR unlock, and `mw_darkweb_vendor` lists both `scam_or_bust` and `police_check`.
- `workshopEconomyIntegration.test.js` covers: `mw_eco_ink_supply` OR-unlock through `isModuleUnlocked`, additive `baseDailyRevenueDelta` stacking (mailorder + bandcamp + sticker = 65), `mw_darkweb_vendor` risk selection via pinned `dayRngStream`, `mw_4color_carousel` merch-cost modifier aggregation, and `mw_vinyl_cutter` limited-edition flag aggregation.
- `allSectionsIntegrationSmoke.test.js` pins the cross-section totals: 63 modules total (17 Tourbus + 14 Studio + 16 Bandhaus + 16 Workshop), all 4 `SECTION_VIEWS` entries registered, and every `SlotType` from the union mapped in at least one section config.
