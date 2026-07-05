# Neurotoxic Codebase Audit — Categorized Findings

**Scope:** `src/` (671 source files, 1727 exported symbols). Read-only audit; no source files modified.
**Method:** Regenerated `symbols.json` for the usage graph, then four parallel category sweeps (orphans, duplicates, convention inconsistencies, dead-code/integration), each verifying every claim with ripgrep and direct code reads. Findings from the 2026-07-01 audit were re-verified: 4 of its 6 findings are already fixed; the 2 survivors are carried forward below (D14, I14).
**Date:** 2026-07-04 · **Branch:** `claude/neurotoxic-audit-1ky38w`

## Executive summary

**47 findings — 8 HIGH · 24 MED · 15 LOW.**

> ## Resolution status (autonomous fix pass, branch `claude/neurotoxic-audit-1ky38w`)
>
> **Fixed & verified (7 commits, all typecheck + affected test suites green):**
> - **Safety cluster** I1–I9 (`finiteNumberOr`/`isFiniteNumber` on persisted money/fame/skill/controversy/score addends) and D10/I12 (shared `REGION_BLACKLIST_THRESHOLD` + finite read); I11 (unify null-region-key fallback to the `'Unknown'` bucket).
> - **Duplicates** D1 (shared `sanitizeStashItem` for both stash branches — HIGH), D2 (`buildSocialActionNextState`/`readPlayerFundsAndHarmony` reuse), D3/D4 (`findAssetById`/`omitLiabilitiesForAsset`), D6 (`buildBarsFromCounts`) + M5/O1 (delete test-only `buildSongChartDensity`), D7 (shared `catalogTabProps`), D8 (shared `SlotZoneButtons` across all three hero views), D9 (shared `clampPercentageAmount`, fixes the drifted `typeof` guard), D11 (`getAssetSaleQuote` selector across modal + reducer), D13 (`resolveActiveQuest`), D17/D18/D19 (canonical `clampNonNegative`/`isFiniteNumber`/`clampUnit`), D20 (`SAVE_KEY` import), D21/D24 (`QuestCommon`/`QuestEffectCommon` type bases), D22/D23 (`UsePostGigHandlersProps extends HandlerDispatchers` + `PostGigPhase`).
> - **Dead code** X5 (delete unreferenced `schemas/crisis.json`), X6 (declare `VITE_ENABLE_VERCEL_TELEMETRY`).
>
> **Deferred with rationale (left as-is, not silently changed):**
> - **D12** (moduleUnlock dedup) — provably equivalent but would add per-call array allocation in a file with deliberate perf ("BOLT") optimizations; not worth the regression.
> - **D14** (primitive-record sanitizers) — the two have divergent empty-return contracts (`{}` vs `undefined`) and different call sites; merging risks a security-sanitizer behavior change for marginal gain.
> - **I10** (`Number(x) || 0` → `finiteNumberOr`) — `Number()` coerces numeric strings that `finiteNumberOr` would reject, a real behavior change on hostile payloads; left as the AGENTS.md-permitted post-`Number()` form.
> - **X1** (dead `remapStoryFlag`) — a confirmed no-op, but deletion touches story-flag handling; low payoff, kept as-is.
> - **I13** (decorative `€` glyph), **X4** (dead `category: 'travel'` on 55 chatter entries), **D15/D16/D25** (optional micro-dedups) — LOW / Simplicity-First: not worth the churn.
>
> **Awaiting a product decision (NOT actioned — both directions are significant and irreversible-ish; the clarifying question could not be delivered):**
> - **M1** in-gig event system + its cascade **M2** (`showman` trait), **M3** (`stage_diver` milestone), **X2/X3** (dead stage-dive tracking, `pre_gig` fallback): *integrate* (wire `gig_intro`/`gig_mid`, risky gameplay change needing playtesting) **vs** *delete* (remove 19 authored events + trait + milestone + locale strings).
> - **M3** (`collector`/`full_band` milestones), **M4** (event-driven game-over path), **M6** (`mystery_pick` reward): *delete/retune* **vs** *leave as future-content scaffolding*.
> - **O2** (8 UI test files mock a stale `useGameState` API): a test-only migration, left pending.
>
> _To proceed on the awaiting-decision items, tell me "integrate" or "delete" for the gig-event system and "delete/retune" or "leave" for the smaller unwired features._
>
> ---

The codebase is structurally very clean at the wiring level: zero true orphan exports, all 66 action types fully round-tripped (registry → reducer → creator → dispatch site), all 13 scenes reachable, perfect EN/DE locale key parity, no hardcoded colors, no `@ts-ignore`. The substantive problems cluster in three areas:

1. **A complete in-gig event system is silently unreachable** (M1): 19 authored events in `src/data/events/gig.ts` use trigger points (`gig_intro`/`gig_mid`) that no code ever requests, and the event system additionally hard-blocks the GIG scene. This cascades into an unobtainable trait (`showman`), three dead milestones, dead tracking logic, and dead locale strings. This is the single highest-impact decision for the fix pass.
2. **A systematic `finiteNumberOr` gap on money/fame clamp paths** (I1–I9): nine sites use `?? 0` or bare `typeof === 'number'` on persisted numeric state where AGENTS.md mandates `finiteNumberOr`/`isFiniteNumber` — in most cases directly beside sibling code that does it correctly.
3. **Drift-prone duplicates**, two of which have already drifted (D9's divergent finite guards, D10/I12's blacklist threshold read two different ways), plus one security-sensitive 40-line sanitizer duplicated verbatim (D1).

---

## 1. DUPLICATES

### 1a. Exact duplicates

**D1. [HIGH] Contraband stash item sanitization duplicated across array/object branches**
`src/context/reducers/sanitizers/stateSanitizers.ts:800-838` (array branch) vs `:852-890` (object branch).
~40 lines of identical security-sensitive logic (forbidden-key stripping, canonical-definition spread order, stacks validation, non-stackable cap, `remainingDuration` fallback) exist twice; a security fix applied to one branch silently misses the other.
**Action: MERGE** into a single `sanitizeStashItem(itemObj, baseItem, id)` helper.

**D2. [MED] `handleMerchPress` re-implements the zealotry-action skeleton**
`src/context/reducers/socialReducer.ts:509-592` vs `applyZealotryAction` at `:596-690`. The state-assembly blocks at `:562-577` and `:664-679` are exact clones, and `:536-545` re-inlines the funds check already encapsulated by `readPlayerFundsAndHarmony` (`:147-160`, used at `:641`).
**Action: MERGE** — generalize the shared apply helper / reuse `readPlayerFundsAndHarmony`.

**D3. [MED] Find-asset-by-id loop repeated 4× in one reducer**
`src/context/reducers/assetReducer.ts:185-196`, `:300-313`, `:401-414`, `:479-487` — identical `let targetAsset/targetAssetIndex` scan.
**Action: MERGE** into a local `findAssetById(assets, id): [asset, index]`.

**D4. [MED] "Rebuild liabilities excluding assetId" loop duplicated**
`src/context/reducers/assetReducer.ts:511-520` (sale) vs `:701-710` (`handleAssetForeclosed`).
**Action: MERGE** into `omitLiabilitiesForAsset(liabilities, assetId)`.

**D5. [MED] Composite-effect conversion block duplicated within `resolveChoice`**
`src/utils/eventEngine/resolveChoice.ts:111-137` (conflict-resolved tracking) vs `:146-166` (stage-dive tracking) — identical clone-effects/convert-to-composite logic including the `delete originalEffect.outcome/description` dance. Note the second block is also dead code (X2).
**Action: MERGE** into a `toCompositeResult(result)` helper (after the M1 decision).

**D6. [MED] Peak-computation + density-bar build loops duplicated**
`src/utils/chartDensity.ts:102-119` vs `:160-178`, plus identical `safeBucketCount` normalization at `:92-95` / `:133-136`.
**Action: MERGE** into `buildBarsFromCounts(counts, bucketCount, duration)`.

**D7. [MED] SHOP and UPGRADES tab render blocks are near-identical clones**
`src/ui/bandhq/BandHQContentArea.tsx:123-146` vs `:148-172` — 24 lines of duplicated JSX including triple `as unknown as (item: CatalogItem) => ...` casts repeated in both.
**Action: MERGE** — extract a shared props object (or `CatalogTabShell`), fixing the casts once.

**D8. [MED] Asset hero-view slot-button loop triplicated**
`src/components/assets/sections/StudioFloorplanView.tsx:31-49`, `WorkshopProductionLineView.tsx:45-63`, `BandhausCrossSectionView.tsx:31-66` — same `asset.slots.map` → zone lookup → `AssetSlotButton` with `getSlotZonePositionStyle` + dashed-border style; only the zone map, accent token, and Bandhaus mural special-case differ.
**Action: MERGE** into a shared `SlotZoneButtons` component (Bandhaus keeps its mural branch via render prop / per-slot override).

### 1b. Near-duplicates (divergent implementations — drift risk, or drift already happened)

**D9. [HIGH] Percentage-money clamp logic duplicated with DIVERGENT finite-number guards**
`src/utils/eventEngine/eventEffectHandlers.ts:62-79` vs `src/utils/eventEngine/resolvers.ts:97-107`.
Both compute `Math.round(money * pct/100)`, swap inverted min/max, then clamp — but `eventEffectHandlers.ts:68-69` uses bare `typeof eff.min === 'number'` (lets `NaN`/`Infinity` through, violating the AGENTS.md rule) while `resolvers.ts:100-101` correctly uses `isFiniteNumber`. Drift has already happened.
**Action: MERGE** into one shared `clampPercentageAmount` helper using `isFiniteNumber`.

**D10. [HIGH] `-30` regional-blacklist threshold hardcoded at two enforcement sites**
`src/utils/travelUtils.ts:187` (booking refusal gate) vs `src/context/reducers/gigReducer.ts:299` (blacklist trigger on bad gig).
If one drifts, the booking ban and the blacklist event desynchronize. The two sites also read reputation differently today (`?? 0` vs `|| 0` — see I12), so a `NaN` entry already behaves differently between them.
**Action: FIX** — extract a `REGION_BLACKLIST_THRESHOLD` constant plus a shared `finiteNumberOr` read, used by both.

**D11. [MED] Net-sale-proceeds math re-implemented in UI vs reducer**
`src/components/assets/SellConfirmModal.tsx:29-45` vs `src/context/reducers/assetReducer.ts:489-513` (`handleSellChassis`) — same per-asset liability-principal loop, same `gross - debt` / reject-if-negative rule. Displayed amount and reducer outcome can drift.
**Action: MERGE** — shared selector `getAssetSaleQuote(state, assetId)` in `src/utils/assetSelectors/`.

**D12. [MED] Module unlock requirement walk duplicated between boolean check and reasons collector**
`src/utils/assetSelectors/moduleUnlock.ts:101-140` (`isModuleUnlocked`) vs `:172-240` (`getLockReasons`) — every requirement (minFame, minMoney, scenePresence, story flags at `:113-119` vs `:197-204`, member skill, other-module) is evaluated twice with independently maintained logic.
**Action: MERGE** — derive `isModuleUnlocked` from `getLockReasons(...).length === 0` (excluding the asset-scoped `chassisTier` reason) or share per-requirement predicates.

**D13. [MED] Quest lookup/required-resolution preamble duplicated**
`src/domain/questAdvance.ts:32-49` (`advanceQuestProgress`) vs `:86-100` (`setQuestProgress`) — same `findActiveQuestIndex` → guard → `getQuestWithDefinition` → `finiteNumberOr(required, NaN)` sequence.
**Action: MERGE** — small `resolveActiveQuest(state, questId)` helper.

**D14. [MED] Two primitive-record sanitizers with divergent semantics** *(carried over from 2026-07-01 audit; still present)*
`sanitizePrimitiveOptions` — `src/context/reducers/toastSanitizers.ts:54` vs `copySafePrimitiveObject` — `src/context/reducers/sanitizers/stateSanitizers.ts:123`.
Both strip forbidden/prototype keys and keep only `string|number|boolean|null`, but differ in loop style and empty-return semantics (`{}` vs `undefined`). Two independent implementations of the same security-sensitive operation will drift.
**Action: MERGE** into one shared `sanitizePrimitiveRecord`; make the empty-return contract explicit per caller.

**D15. [LOW] Pixi sprite pool release/dispose lifecycle duplicated**
`src/components/stage/EffectSpritePool.ts:55-74` vs `src/components/stage/NoteSpritePool.ts:195-215` (pool-cap push-or-destroy in release, identical `dispose()` loop; parallel `MAX_POOL_SIZE`/`container` structure at `EffectSpritePool.ts:14-25` vs `NoteSpritePool.ts:140-147`).
**Action: MERGE (optional)** — generic `SpritePool<T>` base; weigh against the pixi-lifecycle sensitivity of these files.

**D16. [LOW] City-key derivation exists in two documented mirrors**
`src/utils/mapGenerator/cityTraits.ts:16-28` (`getCityKeyFromVenueId`) vs `src/utils/mapUtils.ts:137-142` (`getRegionKeyForLocation`). The divergence is intentional and documented (`mapUtils.ts:121-133`), but both re-implement the `indexOf('_')` prefix split.
**Action: MERGE (optional)** — one shared prefix-split primitive so the split rule itself cannot drift.

### 1c. Re-implemented utilities (canonical helper exists, inline copy used)

**D17. [MED] `clampNonNegative` re-implemented inline in 5 places**
Canonical: `src/utils/gameState/clamps.ts:14-17`. Inline copies: `src/context/actionCreators.ts:744`, `src/context/actionCreators.ts:862`, `src/context/reducers/minigameReducer.ts:100`, `src/utils/assetConfig.ts:85`, `src/ui/shared/index.tsx:120`.
**Action: FIX** — replace with `clampNonNegative`.

**D18. [LOW] `isFiniteNumber` inlined where the shared helper fits**
Canonical: `src/utils/finiteNumber.ts:22`. Inline `typeof v === 'number' && Number.isFinite(v)` narrowings: `src/utils/postGig/performanceLogic.ts:12`, `src/context/actionCreators.ts:232`, `src/utils/saveValidator.ts:179`, `:195`, `src/ui/bandhq/ShopTab.tsx:38`, `src/context/reducers/socialReducer.ts:233-235`. Correct today, but AGENTS.md explicitly forbids reintroducing private narrowings.
**Action: FIX** — replace with `isFiniteNumber`.

**D19. [LOW] `clampUnit` re-implemented inline**
`src/context/reducers/minigameReducer.ts:634` — `Math.max(0, Math.min(finiteNumberOr(contrabandDelivered, 0), 1))` duplicates `clampUnit` (`src/utils/numberUtils.ts:10-11`).
**Action: FIX** — `clampUnit(finiteNumberOr(contrabandDelivered, 0))`.

### 1d. Duplicate constants / types

**D20. [MED] `SAVE_KEY` literal re-hardcoded outside its module**
`src/context/usePersistence.ts:22` (`export const SAVE_KEY = 'neurotoxic_v3_save'`) vs the raw string at `src/scenes/mainmenu/hooks/useMainMenuStart.ts:91`. A future save-key bump leaves the main-menu "existing save" prompt checking the dead key.
**Action: FIX** — import `SAVE_KEY`.

**D21. [MED] `QuestDefinition` and `QuestState` share a ~20-field duplicated block**
`src/types/quest.d.ts:277-292` vs `:318-338` (`kind`, `repeatPolicy`, `progressSource`, `progressRule(s)`, `rewards`, `failurePenalties`, `offer`, flag fields, `cooldownDays`), plus the legacy block at `:270-275` vs `:319-324`. A new quest field must be added twice or persistence silently drops it.
**Action: MERGE** — extract a shared base interface both extend.

**D22. [MED] `HandlerDispatchers` callback signatures re-declared inline**
`src/hooks/postGig/handlers/types.ts:15-34` vs `src/hooks/usePostGigHandlers.ts:51-69` — 11 dispatcher signatures (including the functional-update unions) duplicated field-for-field; drift only surfaces at the call boundary.
**Action: MERGE** — `UsePostGigHandlersProps extends HandlerDispatchers`.

**D23. [MED] `PostGigPhase` union re-inlined instead of imported**
Canonical: `src/hooks/postGig/usePostGigState.ts:6`. Re-declared literal union: `src/hooks/postGig/handlers/types.ts:28`, `src/hooks/usePostGigHandlers.ts:67-68`.
**Action: FIX** — import the named type.

**D24. [LOW] `QuestReward`/`QuestPenalty` unions repeat five identical variants**
`src/types/quest.d.ts:194-206` vs `:220-229` (`venue.reputation`, `region.reputation`, `brand.trust`, `flag.add`, `event.queue` declared twice, field-for-field).
**Action: MERGE (optional)** — shared `QuestEffectCommon` union.

**D25. [LOW] Van breakdown-chance percent display duplicated**
`src/ui/bandhq/detailedStats/components/VanConditionSection.tsx:33` and `src/ui/bandhq/StatsTab.tsx:79` — both `((player.van?.breakdownChance ?? 0) * 100).toFixed(1)%`.
**Action: MERGE** only if either display gains logic.

**D26. [LOW] Identical balance blocks in event/quest data**
`src/data/quests/quest_alchemist.ts:14-22` vs `src/data/quests/quest_crisis_manager.ts:21-29` (same rewards/penalties); `src/data/events/band.ts:376-393` vs `src/data/events/relationshipEvents.ts:197-216` (same threshold-7 skill check, ±10 harmony). Likely intentional balance data.
**Action:** none required — flag for the balance owner.

---

## 2. ORPHANED / UNINTEGRATED CODE

The strict-orphan scan came back essentially empty: **0 exports with zero references** across 1727 symbols after ripgrep verification.

**O1. [MED] `buildSongChartDensity` — tested but never integrated**
`src/utils/chartDensity.ts:88`. Only consumer is `tests/node/chartDensity.test.js`. Its sibling `buildSetlistChartDensity` IS wired (`src/components/pregig/SetlistBlock.tsx:6,140`). The per-song variant has full JSDoc, payload hardening, and dedicated tests — a per-song density preview appears planned but never built. (Also listed as M5.)
**Action: INTEGRATE** (per-song density preview in song-selection UI) or **DELETE** the export + its test, keeping the shared private helper `buildSongDensityEvents`.

**O2. [LOW] 8 UI test files mock a `useGameState` API that no longer exists**
Real API: `src/context/GameState.tsx:271` (`useGameDispatch`), `:283` (`useGameActions`), `:297` (`useGameSelector`). No `useGameState` export exists anywhere in `src/`.
Tests: `tests/ui/MainMenu.test.jsx` (`:5,12-17`), `tests/ui/MainMenu.identity.test.jsx`, `tests/ui/PostGig.component.test.jsx`, `tests/ui/PostGig.continueGuard.test.jsx`, `tests/ui/PostGig.leaderboard.test.jsx`, `tests/ui/Gig.scene.test.jsx`, `tests/ui/KabelsalatScene.test.jsx`, `tests/ui/IntroVideo.test.jsx` — each imports `useGameState` and only works because `vi.mock` fabricates it, so mock/real provider drift is invisible.
**Action: FIX** — migrate mocks/imports to the real `useGameSelector`/`useGameActions` API.

**Discarded false positives** (documented so the fix pass doesn't re-litigate): 7 audio functions (`playSFX`, `setSFXVolume`, `setMusicVolume`, `setDestinationMute`, `isAmbientOggPlaying`, `playRandomAmbientMidi`, `playRandomAmbientOgg`) are consumed via the `audioEngine` facade in `AudioManager.ts`; 11 barrel-only symbols (`BAND_EVENTS`, `GIG_EVENTS`, `TRANSPORT_EVENTS`, economy constants, `useTravel*` sub-hooks, `VENUE_CHATTER_LOOKUP`) are genuinely consumed by their barrels; 33 exports referenced only same-file (dispatch tables like `EFFECT_HANDLERS`, tuning constants like `REFINANCE_FEE_RATE`) are live, exported for testability.

---

## 3. INCONSISTENCIES

### 3a. Arithmetic-then-clamp paths missing `finiteNumberOr` (AGENTS.md: `??` is not a substitute — it lets `NaN` through)

Each site violates the rule while sibling code in the same file follows it.

**I1. [MED]** `src/utils/socialEngine.ts:280` — `gameState.player.money ?? 0` feeds `clampPlayerMoney(prevMoney + moneyChange)` (`:281`); the harmony branch at `:294` correctly uses `finiteNumberOr`. A persisted `NaN` money makes `moneyChange` `NaN` downstream. **FIX:** `finiteNumberOr(gameState.player.money, 0)`.

**I2. [MED]** `src/utils/dailyTickLogic.ts:41` (+ wealth-drain path `:47-58`) — `clampPlayerMoney(nextPlayer.money - dailyCost)` on the raw spread of `currentState.player` (`:356`), no `finiteNumberOr`; the same file wraps harmony (`:117`) and mood/stamina (`:258`, `:269`). **FIX:** `finiteNumberOr(nextPlayer.money, 0) - dailyCost` (also at `:58`).

**I3. [MED]** `src/utils/travelUtils.ts:284` — `clampPlayerMoney((player.money ?? 0) - totalCost)`; same file uses `finiteNumberOr(band.harmony, 0)` at `:297`. **FIX:** replace `??` with `finiteNumberOr`.

**I4. [MED]** `src/hooks/travel/useVanMaintenance.ts:62` and `:112` — `clampPlayerMoney((player.money ?? 0) - cost)` twice. **FIX:** `finiteNumberOr(player.money, 0)`.

**I5. [MED]** `src/domain/questRewards.ts:211` (`money ?? 0`) and `:251` (`fame ?? 0`) — both feed `clampPlayerMoney/Fame(previous + reward.amount)`; the `band.harmony` case in the same switch (`:282`) correctly uses `finiteNumberOr`. **FIX** both.

**I6. [MED]** `src/utils/arrivalUtils.ts:254` — `player.fame ?? 0` then `clampPlayerFame(currentFame - loss)` (`:256`); same file uses `finiteNumberOr` at `:71`, `:184-188`, `:231`. **FIX.**

### 3b. Bare `typeof === 'number'` where `Number.isFinite` is mandated

**I7. [MED]** `src/utils/gameState/delta.ts:861` — `typeof value === 'number'` guards the controversy delta before `clampControversyLevel(finiteNumberOr(nextSocial[key], 0) + value)`; a `NaN` delta zeroes stored controversy via the clamp short-circuit. Same file uses `isFiniteNumber` at `:287`/`:588` for the identical pattern. **FIX:** `isFiniteNumber(value)`.

**I8. [MED]** `src/utils/gigModifiersUtils.ts:188` and `:193` — `typeof skillValue === 'number'` / `typeof member.skill === 'number'` on persisted `BandMember` data feeding `120 + skill * 4` hit-window arithmetic; a `NaN` skill makes every hit window `NaN` (all hits miss). **FIX:** `isFiniteNumber` / `finiteNumberOr(member.skill, 0)`.

**I9. [LOW]** `src/utils/questProgress.ts:447` — `typeof score === 'number' ? score : 0` lets `NaN` become a quest progress amount. **FIX:** `finiteNumberOr(score, 0)`.

**I10. [LOW]** `src/context/reducers/socialReducer.ts:554,656` vs `src/context/reducers/clinicReducer.ts:64-67` — the same "read persisted fame/loyalty/controversy" concept done two ways (`Number(x) || 0` vs `Number.isFinite`-based reads). Both safe today; unify on `finiteNumberOr` per the "no private copies" instruction. **FIX.**

### 3c. Region-key handling

**I11. [MED] Four different fallbacks when `getRegionKeyForLocation` returns null, for the same concept:**
- `src/context/reducers/gigReducer.ts:256` → `|| 'Unknown'`
- `src/hooks/postGig/handlers/useContinueHandler.ts:130` → `?? player?.location ?? ''`
- `src/utils/postGig/derivations.ts:83` → `?? player.location`
- `src/context/reducers/minigameReducer.ts:332` → `|| nextLocation`

The last three fall back to the raw `venues:<id>.name` display key — exactly what AGENTS.md warns "silently splits regional state per venue"; gigReducer buckets the same failure as `'Unknown'`. **FIX:** one canonical fallback (shared helper) at all four sites.

**I12. [LOW]** Regional-blacklist check written two ways: `src/utils/travelUtils.ts:187` (`?? 0`) vs `src/context/reducers/gigReducer.ts:299` (`|| 0`). With a `NaN` entry the `??` variant evaluates `NaN <= -30` (false) while `||` collapses to 0 — divergent behavior for the same rule. **FIX** together with D10: `finiteNumberOr(rep, 0)` + shared threshold constant.

### 3d. i18n / currency

**I13. [LOW]** `src/ui/bandhq/StatsTab.tsx:31` — `icon='€'` hardcodes the currency glyph; monetary values elsewhere flow through `formatCurrency(value, i18n.language)`. **FIX:** derive from the formatter/shared constant, or document as decorative.

**I14. [LOW] Latent footgun** *(carried over from 2026-07-01 audit; still present)* — `formatCurrency` (`src/utils/numberUtils.ts:67`) and siblings default `language = 'en'`. No current caller omits it (all ~60 sites verified passing a locale), but a future omission silently bakes English currency with no type error. **FIX (hardening):** make the language parameter required.

---

## 4. DEAD / UNREACHABLE CODE

**X1. [MED] `remapStoryFlag` legacy remap branches never match**
`src/domain/eventResolver.ts:118-135` (called at `:197`) — remaps `flags.addStoryFlag === 'addQuest' | 'unlock' | 'gameOver'` into structured fields, but all 14 flag effects in data use plain story-flag names, and the dedicated `quest`/`unlock`/`game_over` effect types already set structured fields directly. The whole function is a no-op.
**Action: DELETE** (or keep as an explicitly commented save-compat shim; currently it silently pretends to be live).

**X2. [MED] Stage-dive tracking block in `resolveChoice` is dead**
`src/utils/eventEngine/resolveChoice.ts:143-168` — ~25 lines of effect-composition logic gated on `activeEvent.id === 'gig_mid_stage_diver'`, which is unreachable (M1).
**Action: FIX** via M1, else **DELETE** with M1.

**X3. [MED] `triggerEvent('gig', 'pre_gig')` fallback is a near-no-op**
`src/hooks/usePreGigLogic.ts:170` — no event in any data file has `trigger: 'pre_gig'` (data triggers: `gig_intro`, `gig_mid`, `post_gig`, `random`, `special_location`, `travel`), so this call can only match the 3 `trigger: 'random'` quest-offer events with `category: 'gig'` — never the 19 authored gig events it visually appears to surface. (The sibling `triggerEvent('band', 'pre_gig')` at `:168` works in practice — band has 36 random events.)
**Action: FIX** — author `pre_gig`-trigger events or route gig events here as part of M1's resolution.

**X4. [LOW] Chatter `category: 'travel'` field is dead metadata**
`src/data/chatter/standardChatter.ts` — all 55 `CHATTER_DB` entries carry it; no consumer (`chatter/index.ts`, `useChatterLogic.ts`, `ChatterOverlay.tsx`) ever reads `.category` — selection is purely condition/scene based.
**Action: DELETE** the field.

**X5. [LOW] `src/schemas/crisis.json` is never loaded**
Zero references repo-wide (src, scripts, tests, configs); the file itself notes authoritative validation lives in `src/utils/eventValidator`.
**Action: DELETE** or move to docs.

**X6. [LOW] `VITE_ENABLE_VERCEL_TELEMETRY` undeclared in env typings**
Read at `src/App.tsx:47`; `src/vite-env.d.ts:5` declares only `VITE_ENABLE_LEADERBOARD_SYNC`. Safe fallbacks exist, but the flag is invisible to the type layer and to anyone auditing configurable flags.
**Action: FIX** — add the declaration.

---

## 5. MISSING INTEGRATION (fully built, never wired)

**M1. [HIGH] All 19 in-gig events are unreachable — `gig_intro`/`gig_mid` trigger points are never requested**
`src/data/events/gig.ts` (entire file: `gig_intro_drunk_fan`, `gig_mid_stage_diver`, `amp_feedback_loop`, `crowd_surf_disaster`, `gig_mid_perfect_breakdown`, +14 more).
Every event uses `trigger: 'gig_intro'` or `'gig_mid'`. Event selection (`src/utils/eventEngine/eventSelection.ts:147`) only admits events matching the requested trigger point or `'random'`; the only trigger points ever passed at runtime are `'post_gig'`, `'pre_gig'`, `'travel'`, and `null` (call sites: `src/hooks/postGig/usePostGigDerivations.ts:69-71`, `src/hooks/usePreGigLogic.ts:168-170`, `src/utils/arrivalUtils.ts:111-113,206`). The sole selection entry point is `eventEngine.checkEvent` at `src/context/useEventSystem.ts:203`, and `useEventSystem.ts:177` additionally hard-blocks all events during the GIG scene. No `pendingEvents`/`queueEvent`/`nextEventId` path enqueues any of these 19 ids (verified: only `consequences_*`, `van_*`, `event_bad_press` are queued). The matching `events:gig_mid_*`/`gig_intro_*` locale strings are dead too.
**Action: INTEGRATE** — fire `'gig_intro'` on gig start and `'gig_mid'` mid-song (exempting them from the GIG-scene guard), or **DELETE** the file plus locale keys. This one decision resolves M2, M3 (partially), X2, and X3.

**M2. [HIGH] `showman` trait is permanently unobtainable (cascade of M1)**
`src/utils/eventEngine/resolveChoice.ts:143-168` (sole `stageDives` increment, gated on the unreachable `gig_mid_stage_diver` event), `src/utils/unlockCheck.ts:174-178` (unlock at `stageDives >= 3`), `src/utils/socialEngine.ts:92` (showman follower bonus — dead).
`player.stats.stageDives` has exactly one producer, behind the unreachable event. No `stat`-effect for `stageDives` exists in any data file (the handler at `eventEffectHandlers.ts:148-150` has no data producer either); no quest grants `traitId: 'showman'`. The trait, its unlock check, its social bonus, and its `traits:` locale entries can never activate.
**Action: FIX** via M1, or **INTEGRATE** an alternative `stageDives` source.

**M3. [HIGH] Three milestones can never fire**
- `src/data/milestones/milestones.ts:260-267` — `stage_diver` requires `stageDives >= 10` (frozen at 0, see M2).
- `src/data/milestones/milestones.ts:301-309` — `collector` requires `unlocks.length >= 5`, but exactly ONE unlock exists in all game data (`unlock: 'rare_vinyl'`, `src/data/events/transport.ts:301`; `public/locales/en/unlocks.json` confirms). Max reachable is 1.
- `src/data/milestones/milestones.ts:218-226` — `full_band` requires `band.members.length >= 4`; the roster is fixed at 3, and no reward type, event delta, or code path can add a member (verified: `questRewards.ts` only patches existing members; `delta.ts:397-413` only pushes per-member skill deltas).

**Action: INTEGRATE** (more unlockables via the fully-built `type: 'unlock'` plumbing; a recruit mechanic) or **DELETE**/retune the milestones.

**M4. [MED] Event-driven game-over path is fully built but has no data producer**
`src/utils/eventEngine/eventEffectHandlers.ts:169-171` (`game_over` handler), `src/domain/eventResolver.ts:247-262` (`flags.gameOver` branch: toast + save + scene change to GAMEOVER), `src/context/useEventSystem.ts:122` (`case 'gameOverToast'`).
No event in `src/data/events/` uses effect `type: 'game_over'` (effect-type census confirms) and no flag effect is named `gameOver`. The entire "an event can end the run" feature is unreachable; game over only occurs via bankruptcy.
**Action: INTEGRATE** (author a game-over event, e.g. a harsher `deal_devil` branch) or **DELETE** the three dead segments together.

**M5. [MED] `buildSongChartDensity`** — see O1.

**M6. [MED] `mystery_pick` reward item has no gameplay effect**
`src/data/events/special.ts:69` (`strange_roadside_shrine` luck-check success). The item lands in `band.inventory` and renders in the generic inventory list, but unlike `golden_pick` (gates chatter lines and a post option) nothing anywhere reads `mystery_pick`. A skill-check "win" with zero mechanical payoff.
**Action: INTEGRATE** an effect/condition keyed on it (pattern: `golden_pick` in `src/data/postOptions.ts:899`, `src/data/chatter/standardChatter.ts:1931`).

---

## Verified clean (checked, no findings — saves the fix pass from re-auditing)

- **Action wiring:** all 66 `ActionTypes` have a reducer handler (type-checked dispatch table + `assertNever` in `gameReducer.ts`), an action creator, and a real dispatch site (incl. rival-band actions via `useRivalBandDispatchActions` → `Overworld.tsx`/`useArrivalLogic.ts`; reducer-internal `assetForeclosed` at `gameReducer.ts:229`; `SET_PENDING_RISK_EVENT` populated by `ADVANCE_DAY` at `systemReducer.ts:625`).
- **Scenes:** all 13 `GAME_PHASES` reachable.
- **Locale parity:** all 10 EN/DE JSON files have identical key sets (ui.json 1432 keys, chatter 1190, events 1049, …); 0 of 983 namespaced `t()` literals missing from EN (flat-key aware, `keySeparator: false`); every `formatCurrency` call passes a locale; no hardcoded `€` in locale JSON.
- **Colors:** no hex/0x color literals outside `src/utils/brandColors.ts`; every `--color-*` token used exists in `src/index.css`; no invented aliases; both fallback consumers derive from `BRAND_COLOR_HEX`.
- **Other AGENTS.md rules:** no `@ts-ignore`/`@ts-nocheck`; no `.propTypes`/`prop-types`; no Tone.js time reads outside `src/utils/audio/`; no `currentGig?.venue` misuse; no `audioPlaybackEnded` usage; no payloadless `createAdvanceDayAction()`; bankruptcy (`systemReducer.ts:545`) and travel checks (`travelUtils.ts:389`, `useSoftlockEffect.ts:59`, `travelSoftlockUtils.ts:108`) all use `getTotalDailyObligations`; leaderboards submit `leaderboardId` (`leaderboardUtils.ts:67`); `fame`/`fameLevel` pairing consistent; `Object.hasOwn` used throughout; single `MODIFIER_COSTS`/`CHASSIS_CONFIG`/`MODULE_REGISTRY`; one shared Fisher–Yates (`src/utils/shuffleUtils.ts`).
- **Data registries:** quests 32/32 wired; crafting recipe inputs/outputs and contraband ids all resolve; all 45 venue-chatter ids match `venues.ts`; brand deals, post options, HQ items, and milestones (except M3) all consumed; all queued event ids resolve.
- **`||` vs `??` sweep:** remaining `||` numeric fallbacks (`bpm || 120`, `devicePixelRatio || 1`, counters `|| 0`) only collapse invalid-or-equal falsy values.
- **Fixed since the 2026-07-01 audit** (re-verified gone): `gigReducer` local reputation clamp; `minigameReducer:449` inline `clamp0to100`; the `item` effect handler's bare-`typeof` guard (`eventEffectHandlers.ts` now nests `Number.isFinite`); the 7 inline string-array filters in quest producers.

---

## Suggested fix-pass ordering

1. **M1 decision first** (integrate vs. delete the in-gig event system) — it resolves M2, M3 (partially), X2, and X3 in one stroke and is the largest player-facing payoff either way.
2. **Safety cluster** (I1–I9, D9, D10+I12) — mechanical `finiteNumberOr`/`isFiniteNumber` substitutions plus the two already-drifted duplicates; low-risk, covered by golden-path/state-safety tests.
3. **Security-sensitive merges** D1 (stash sanitizer) and D14 (primitive-record sanitizers), with tests covering both input shapes.
4. **Structural merges** (D2–D8, D11–D13, D17–D23) — each a local refactor with existing test coverage.
5. **Cleanups & decisions** (O2 test-API migration, X1, X4–X6, I10, I11, I13, I14, M4–M6).
