# src/utils - Agent Instructions

## Object emptiness

- Do not use `Object.keys(obj).length > 0` for emptiness checks; use `isEmptyObject` from `src/utils/gameStateUtils.ts`.

## Brand colors

- `brandColors.ts` (`BRAND_COLOR_HEX`) is the single source of truth for brand hex fallbacks. Both `stageRenderUtils.PIXI_TOKEN_FALLBACKS` and `OverworldMap.SVG_TOKEN_FALLBACKS` derive from it. When adding a new brand color, extend `BRAND_COLOR_HEX` and let consumers re-derive — do not reinline the hex literal.

## Locale-aware number formatting

- Use `formatNumber(value, i18n.language)` from `numberUtils.ts` for non-currency integer displays. Bare `value.toLocaleString()` defaults to the runtime locale, which diverges from the user-selected i18n language.

## Economy invariants

Source-of-truth priority: runtime helpers/constants win. If simulations,
tooltips, or docs disagree with `economyEngine.ts`, `gameStateUtils.ts`, or
`postGigUtils.ts`, update the consumers and rerun the required simulation
baseline instead of duplicating formulas.

### Gig financial reconciliation

- `MAX_GIG_NET = 7500` in `economyEngine.ts`. Excess net is added back to expenses as an `overageFee` line (`economy:gigExpenses.overageFee.*` i18n keys), not silently truncated. `calculateGigFinancials()` must reconcile `net === income.total - expenses.total`.
- Management cut is fame-progressive: `MANAGEMENT_CUT_RATE (0.15) × Math.min(1, playerFame / 200)`. Required to keep Bootstrap bankruptcy below the simulation gate.

### Shared formulas and simulations

- `MAX_GIG_NET`, `MANAGEMENT_CUT_RATE`, and `BASE_DRAW_RATIO` are mirrored by `scripts/game-balance-simulation.mjs` via direct import. Changing them invalidates `reports/game-balance-simulation-baseline.json`; re-run `pnpm run simulate:balance:baseline`.
- Fame level is `Math.floor(Math.sqrt(fame / 200))` (`calculateFameLevel` in `gameStateUtils.ts`). External formulas (sim scripts, tooltips) must import this helper, not duplicate the math.
- Gig pass/fail uses `perfScore >= 31` with `PERF_SCORE_MIN = 30` and `PERF_SCORE_SCALER = 150` in `postGigUtils.ts`. Simulation scripts must import `calculatePerformanceScore()` rather than re-implement it.

## Gig / merch threading

- `calculateTravelMinigameResult()` is the source of truth for Tourbus condition loss; its 50% damage-to-condition scaling must stay aligned with the reducer and completion UI.
- `postGigUtils.calculatePostGigStateUpdates` reads `social.activeDeals` (pre-decrement), not `updatedSocial.activeDeals`, for `comm_sellout_ad` penalty resolution; otherwise sponsorship penalties on the deal's final expiring gig are silently dropped.
- `EconomyContext.merchPrices` is a direct top-level field, not nested under `context.social`. Passing via `context.social.merchPrices` is silently ignored by `calculateMerchIncome`.
- Post-gig merch derives `context.cityTraits?: CityTraitState` from the normalized venue ID city key: use `state.gameMap?.cityStates?.[cityKey]` when present, otherwise call `deriveCityTraits(cityKey)`. If the city key is empty or `context.cityTraits` is omitted, `calculateMerchIncome` uses neutral 1.0 multipliers. Unrecognized trait fields fall through to merch profile lookup defaults; never read `cityStates` from top-level `GameState`.
- Per-item merch demand profiles live in `src/data/merch.ts` (`MERCH_PROFILES`, `SPENDING_PROFILE_MERCH_MULTIPLIER`). `DEFAULT_MERCH_PRICES` is re-exported from there; do not redefine merch prices in `economyEngine.ts`.

## Map / venues

- `getCityKeyFromVenueId(venueId)` in `mapGenerator.ts` extracts the prefix before the first `_`; returns `''` if no underscore. Use this helper instead of `node.venue.city` (which does not exist).
- When accessing venue IDs from `MapNode` objects, support both the current `venueId` property and the legacy `venue?.id` structure.
- `GeneratedMapNode.type` union includes `'supplyStop'`. When adding map node types, update the union, `_populateCityStates`, rollout logic, and any consumers that switch on `type`.
- Attention span in `_buildCityProfile` (`mapGenerator.ts`) is hash-derived: `15 + ((h >>> 8) % 45)` (range 15–59). It must stay deterministic from the city key — do not switch it to `Math.random()` or `getSafeRandom()`.

## Crypto / probability

- `crypto.ts` exposes `__testInternals` only when `process.env.NODE_ENV === 'test'` (compiled away in production). Test setup must set `NODE_ENV='test'` before importing; tests must fail fast if `__testInternals` is missing.
- Probability inputs must clamp to `[0, 1]` and guard non-finite values before use (`eventEngine`, `mapGenerator`, `contrabandUtils`, `audio/AudioManager`).

## Events

- `resolveChoice` skillCheck in `eventEngine.ts` must branch `stat === 'luck'` BEFORE the `gameState.band[stat]` fallthrough. `band.luck` exists (default 0), so checking band stats first turns the random luck roll into a static 0.

## Merch demand

- `calculateMerchIncome` in `economyEngine.ts` computes `rawShare` for every item regardless of inventory; the cap is applied only at allocation (`sold = min(desired, inventory)`). Out-of-stock demand is intentionally lost, not redistributed — skipping zero-stock items at the share step would normalize in-stock shares to 1.0 and silently absorb missed sales.

## triggerEvent

- The `triggerEvent` callback across utilities uses the signature `(category: string, triggerPoint?: string) => boolean`. It returns `true` only after an event is selected, processed, and set active; `false` means no event was triggered.

## Long-Term Assets

- `CHASSIS_CONFIG` (`assetConfig.ts`) is the single source of chassis prices/upkeep. DIY variants are derived programmatically via `buildDiyTier`, never hand-entered. Each kind/flavor/tier holds a unique object instance (built via the `makeEmpty*` factories), and `buildDiyTier` clones `legit.slots` (`[...legit.slots]`) so DIY tiers don't share the legit array; a section plan mutating `tourbus_chassis.legit[1].slots` cannot leak into other tiers/kinds.
- Once `CHASSIS_CONFIG.diy[tier]` is populated, consumers (e.g. `processCrowdfundTick`) MUST read `CHASSIS_CONFIG[kind][flavor][tier]` directly. Do not rebuild it via `buildDiyTier(legitTier)` at consumption time — that recomputes from legit even if a section plan tuned the DIY tier independently.
- `MODULE_REGISTRY` (`assetModuleRegistry.ts`) is populated by section plans via side-effect imports; foundation leaves it empty. Anti-stacking invariant tested in `assetModuleRegistry.test.js`: no module may have `slotType === addsSlots[i].slotType` (would enable infinite self-stacking).
- `MODULE_PROMPTS` is keyed by `AssetModule.imagePromptKey` (multiple modules may share a key). A test enforces that every module's key exists in the map.
- `NEUTRAL_ASSET_MODIFIERS` (`assetSelectors.ts`) is the identity for `AssetModifiers` aggregation: multipliers = 1.0, additives = 0, flags = false. Economy functions accept the modifiers parameter as optional with this default.
- `getActiveAssetModifiers` aggregates multipliers with `!== undefined` checks (not truthy) so a legit `fuelMultiplier: 0` ("free fuel") still applies; truthy guards would silently drop it.
- `getTotalDailyObligations` = `calculateGuaranteedDailyCost + assetUpkeep − assetRevenue + liabilityPayments`. This is the SoT for the bankruptcy check.
- `getTotalDebt(state)` = sum of `liability.principalRemaining`. UI top bars (e.g. `AssetsTopBar`) must use this selector — never reduce `state.liabilities` inline.
- `seededRng.ts` (`mulberry32`, `createRngStream`, `nextSeed`): the RNG stream is pre-rolled in the `advanceDay` action creator (sized via `RNG_ROLLS_PER_ASSET × assetCount + RNG_BASE_BUFFER`) and consumed deterministically by `rollAssetRiskEvents`. Reducers must never generate random values directly.
- Fame lives on `state.player.fame` (canonical, per `src/types/player.d.ts`). Asset ticks and action creators MUST read/write fame through `state.player` — `state.band` has no `fame` field, and assigning to `state.band.fame` no-ops silently while corrupting the round-trip.
- `processLiabilityTick` deduplicates `FORECLOSURE_FAME_PENALTY` per asset via the `foreclosedAssetIds` set: when an asset has multiple liabilities (loan + future top-up), the penalty fires exactly once on the day the asset is first foreclosed.
- `resolveCrowdfundProbability(fame, scenePresence, target)` is exported from `assetTicks.ts` and is the SoT for the crowdfund odds formula. `CrowdfundSetupModal` uses it for its preview AND passes the computed value into `startCrowdfund` as `plannedSuccessProbability`; the action creator stamps it on the campaign, and `processCrowdfundTick` resolves `roll < probability`. Tune the formula in one place and both surfaces stay aligned.
- `economyEngine.calculateMerchIncome`: `merchCapacityBonus` is a carry-cap modifier (raises the restock ceiling), NOT phantom sellable stock. At gig time, `sold = min(desired, inventoryCount)` — do not add `capacityBonus` to the sell-time allocation.
- `loanProfiles.computeAmortization` short-circuits to 0 on non-finite inputs or `termDays <= 0`. Callers can rely on a safe numeric return; do not pre-guard inputs at every call site.
- `appendImageSize(url, w, h)` in `imageGen.ts` is query-safe (handles `?` vs `&` insertion). Use it instead of `url + '&width=...'`.
- `loanProfiles.ts`: `computeAmortization` takes `annualInterestRate` (not daily); it divides by 365 internally.

## Tourbus

- `assetSections/tourbusConfig.ts` exports `TOURBUS_T1_SLOTS`, `TOURBUS_T2_SLOTS`, `TOURBUS_T3_SLOTS` (`as const` tuples) and `TOURBUS_SLOT_POSITIONS: Partial<Record<SlotType, {x,y}>>` — callers must handle `undefined` (the partial typing is intentional, only Tourbus slot types are populated).
- `assetSections/tourbusModules.ts` registers 17 modules via side-effect import from `assetRegistryStore.ts` (the underlying registry; `assetModuleRegistry.ts` re-exports and triggers section imports). Editing tourbus modules must mutate `MODULE_REGISTRY` / `MODULE_PROMPTS` inside this file only.
- Trailer anti-stacking: `tb_trailer_hitch` has `slotType: 'tb_trailer_mount'` and adds `tb_trailer_addon` slots — different slot types prevent self-stacking. `maxPerAsset: 1` is a belt-and-suspenders backup. Adding any new module that declares both `slotType: X` and `addsSlots: [{ slotType: X, ... }]` is forbidden and will be rejected by registry invariant tests.
- Trailer detection in UI uses `asset.slots.some(s => s.installedModuleId === 'tb_trailer_hitch')` — no `MODULE_REGISTRY` lookup required.
