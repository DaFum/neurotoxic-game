# src/utils - Agent Instructions

## Object emptiness

- Do not use `Object.keys(obj).length > 0` for emptiness checks; use `isEmptyObject` from `src/utils/gameState/`.

## Random selection

- Random element/index picks must use `selectRandomItem`/`pickIndex` from `src/utils/selectionUtils.ts`; do not inline `Math.floor(rng() * arr.length)`.

## Brand colors

- `brandColors.ts` (`BRAND_COLOR_HEX`) is the single source of truth for brand hex fallbacks. Both `stageRenderUtils.PIXI_TOKEN_FALLBACKS` and `OverworldMap.SVG_TOKEN_FALLBACKS` derive from it. When adding a new brand color, extend `BRAND_COLOR_HEX` and let consumers re-derive — do not reinline the hex literal.

## Locale-aware number formatting

- Use `formatNumber(value, i18n.language)` from `numberUtils.ts` for non-currency integer displays. Bare `value.toLocaleString()` defaults to the runtime locale, which diverges from the user-selected i18n language.

## Contraband effects

- `contrabandEffects.ts` (`applySharedBandEffect`, `ADDITIVE_BAND_EFFECT_FIELDS`, `EQUIPMENT_APPLY_ON_ADD_EFFECTS`) is the single source of truth for applying additive band-stat effects. `bandReducer` (apply) and `gameState/delta.ts` (revert on stash confiscation, via a negated value) both consume it — do not reinline the field map or the apply/clamp math. Passing a negated `value` is the canonical revert — an exact additive inverse (no floor; the rhythm game clamps `guitar_difficulty` to `GUITAR_MIN_DIFFICULTY` at read time). Harmony and stress are re-clamped after an equipment add/revert (`clampSharedBandEffectResult`); because a clamped add moves the stat by less than `value`, the stash entry records `appliedValue` and the revert negates `getEquipmentRevertValue(entry)` instead of the catalog value.

## Map / venues

- `getCityKeyFromVenueId(venueId)` in `mapGenerator.ts` extracts the prefix before the first `_`; returns `''` if no underscore. Use this helper instead of `node.venue.city` (which does not exist).
- When accessing venue IDs from `MapNode` objects, support both the current `venueId` property and the legacy `venue?.id` structure.
- `GeneratedMapNode.type` union includes `'SUPPLY_STOP'` (legacy saves with `'supplyStop'` are migrated on load in `systemReducer`). When adding map node types, use SCREAMING_SNAKE_CASE and update the union, `_populateCityStates`, rollout logic, and any consumers that switch on `type`.
- Attention span in `deriveCityTraits` (`mapGenerator/cityTraits.ts`) is hash-derived: `15 + ((h >>> 8) % 45)` (range 15–59). It must stay deterministic from the city key — do not switch it to `Math.random()` or `getSafeRandom()`.

## Crypto / probability

- `crypto.ts` exposes `__testInternals` only when `process.env.NODE_ENV === 'test'` (compiled away in production). Test setup must set `NODE_ENV='test'` before importing; tests must fail fast if `__testInternals` is missing.
- Probability inputs must clamp to `[0, 1]` and guard non-finite values before use (`eventEngine`, `mapGenerator`, `contrabandUtils`, `audio/AudioManager`).

## Purchase effects

- `EffectHandler` in `purchaseLogicUtils.ts` declares `band: BandState | null`, but several handlers forward it via `band as BandState` casts. Helper functions behind those casts must access band fields null-safely (`band?.harmony`) — the static non-null type is a lie at runtime.

## Long-Term Assets

- `CHASSIS_CONFIG` (`assetConfig.ts`) is the single source of chassis prices/upkeep. DIY variants are derived programmatically via `buildDiyTier`, never hand-entered. Each kind/flavor/tier holds a unique object instance (built via the `makeEmpty*` factories), and `buildDiyTier` clones `legit.slots` (`[...legit.slots]`) so DIY tiers don't share the legit array; a section plan mutating `tourbus_chassis.legit[1].slots` cannot leak into other tiers/kinds.
- Once `CHASSIS_CONFIG.diy[tier]` is populated, consumers (e.g. `processCrowdfundTick`) MUST read `CHASSIS_CONFIG[kind][flavor][tier]` directly. Do not rebuild it via `buildDiyTier(legitTier)` at consumption time — that recomputes from legit even if a section plan tuned the DIY tier independently.
- `MODULE_REGISTRY` (`assetModuleRegistry.ts`) is populated by section plans via side-effect imports; foundation leaves it empty. Anti-stacking invariant tested in `assetModuleRegistry.test.js`: no module may have `slotType === addsSlots[i].slotType` (would enable infinite self-stacking).
- `MODULE_PROMPTS` is keyed by `AssetModule.imagePromptKey` (multiple modules may share a key). A test enforces that every module's key exists in the map.
- `NEUTRAL_ASSET_MODIFIERS` (`assetSelectors.ts`) is the identity for `AssetModifiers` aggregation: multipliers = 1.0, additives = 0, flags = false. Economy functions accept the modifiers parameter as optional with this default.
- `getActiveAssetModifiers` aggregates multipliers with `!== undefined` checks (not truthy) so a legit `fuelMultiplier: 0` ("free fuel") still applies; truthy guards would silently drop it.
- `calculateChassisRepairCost(condition)` in `assetConfig.ts` is the single rounded (whole-euro) source of truth for chassis repair costs. `RepairConfirmModal`, the `repairChassis` action creator, and `handleRepairChassis` must all call it — condition decays fractionally (0.3/day), so independent computations drift between displayed and charged amounts.
- `getTotalDailyObligations` = `calculateGuaranteedDailyCost + assetUpkeep − assetRevenue + liabilityPayments`. This is the SoT for the bankruptcy check and for any same-day affordability/resource check that covers an imminent `advanceDay()` tick.
- `getTotalDebt(state)` = sum of `liability.principalRemaining`. UI status surfaces (e.g. `AssetsStatusStrip`) must use this selector — never reduce `state.liabilities` inline.
- `seededRng.ts` (`mulberry32`, `createRngStream`, `nextSeed`): `advanceDay` must reserve risk rolls for current assets **and** crowdfund campaigns that may materialize assets before risk processing, followed by the daily-simulation buffer. Reducers must never generate random values directly.
- Fame lives on `state.player.fame` (canonical, per `src/types/player.d.ts`). Asset ticks and action creators MUST read/write fame through `state.player` — `state.band` has no `fame` field, and assigning to `state.band.fame` no-ops silently while corrupting the round-trip. Any tick or reducer that writes `fame` must recompute `fameLevel` via `calculateFameLevel` in the same update — a stale `fameLevel` corrupts lifestyle inflation in `calculateGuaranteedDailyCost`.
- `processAssetTick` pays fractional per-day boni (`famePassivePerDay`, `bandMoodPerDay`, `staminaRegenBonusPerDay`) in whole units via `wholeUnitsForDay`: `floor(rate × (day + 1)) − floor(rate × day)` on the pre-advance `player.day`, then clamps with `clampPlayerFame`/`clampMemberMood`/`clampMemberStamina`. Do not add the raw fractional rate: the integer clamps floor it away every day.
- Payload-derived ids index `MODULE_REGISTRY`, `CHASSIS_CONFIG` and `LOAN_PROFILES` only through the own-property helpers `getRegisteredModule`, `getChassisTierConfig` and `getLoanProfile`; plain indexing resolves `'constructor'`/`'__proto__'` to truthy inherited values.
- `processLiabilityTick` deduplicates `FORECLOSURE_FAME_PENALTY` per asset via the `foreclosedAssetIds` set: when an asset has multiple liabilities (loan + future top-up), the penalty fires exactly once on the day the asset is first foreclosed.
- `processLiabilityTick` splits each payment into an interest portion (`principalRemaining × interestRate / 365`) and a principal reduction so `principalRemaining` tracks the amortization balance priced by `computeAmortization`; the final payment charges `min(dailyPayment, payoff)`, never a full installment past the payoff. Do not revert to subtracting the whole payment from principal.
- Crowdfund success grants the materialized asset plus `fameStake` only — `targetAmount` is NOT paid out as cash on top (the raised funds pay for the build). Paying it out would make crowdfunding strictly dominate cash/loan acquisition.
- `resolveCrowdfundProbability(fame, scenePresence, target)` is exported from `assetTicks.ts` and is the SoT for the crowdfund odds formula. `CrowdfundSetupModal` uses it for its preview and `startCrowdfund` uses it to stamp `plannedSuccessProbability` on the campaign (the caller supplies neither odds nor roll); `processCrowdfundTick` resolves `roll < probability`. Tune the formula in one place and both surfaces stay aligned.
- `loanProfiles.computeAmortization` short-circuits to 0 on non-finite inputs or `termDays <= 0`. Callers can rely on a safe numeric return; do not pre-guard inputs at every call site.
