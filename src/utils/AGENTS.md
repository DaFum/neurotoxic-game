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

## Gig modifiers

- The `damaged_gear` gigModifier (set by botched setup minigames in `minigameReducer`) is consumed in `getGigModifiers` (`gigModifiersUtils.ts`): it forces `noteJitter`, subtracts 10ms `hitWindowBonus`, and multiplies `guitarScoreMult` by 0.9. It is a live mechanic — do not treat it as dead code or remove the setter.

## Crypto / probability

- `crypto.ts` exposes `__testInternals` only when `process.env.NODE_ENV === 'test'` (compiled away in production). Test setup must set `NODE_ENV='test'` before importing; tests must fail fast if `__testInternals` is missing.
- Probability inputs must clamp to `[0, 1]` and guard non-finite values before use (`eventEngine`, `mapGenerator`, `contrabandUtils`, `audio/AudioManager`).

## Purchase effects

- `EffectHandler` in `purchaseLogicUtils.ts` declares `band: BandState | null`, but several handlers forward it via `band as BandState` casts. Helper functions behind those casts must access band fields null-safely (`band?.harmony`) — the static non-null type is a lie at runtime.

## triggerEvent

- `gig_intro` / `gig_mid` are the only trigger points that fire _during_ the GIG scene. `useEventSystem`'s `triggerEvent` deliberately exempts them from both the GIG-scene block and the daily `eventsTriggeredToday` cap (and does not increment that counter) — they are gig-moment beats, not part of the daily random-event budget. They are fired once each per gig from `useRhythmGameLogic`'s `update` wrapper via `maybeFireGigProgressEvent` in `rhythmGameLoopUtils.ts` (at gig start, then progress ≥ 50, guarded by the `gigIntroFired`/`gigMidFired` ref flags), limited to at most one _shown_ event per setlist song by the `lastGigEventSongIndex` ref flag — only a successful `triggerEvent` consumes the song slot; a missed chance roll spends that event's single attempt but lets the other event still try in the same song. The helper is inert while `songTransitioning` (progress is stale from the previous song) and after `hasSubmittedResults`, and `processRhythmGameTick` pauses audio while the resulting `activeEvent` modal is open. Do NOT re-block GIG-scene events or remove the exemption: the `src/data/events/gig.ts` events, the `showman` trait, and the `stage_diver` milestone all depend on it.

## Long-Term Assets

- Asset rules for `assetConfig.ts`, `assetModuleRegistry.ts`, `assetSelectors.ts`, `assetTicks.ts` and `loanProfiles.ts` live in `assets/AGENTS.md`.
- `seededRng.ts` (`mulberry32`, `createRngStream`, `nextSeed`): `advanceDay` must reserve risk rolls for current assets **and** crowdfund campaigns that may materialize assets before risk processing, followed by the daily-simulation buffer. Reducers must never generate random values directly.
