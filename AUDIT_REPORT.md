# Neurotoxic Codebase Audit Report

Audit of `/home/user/neurotoxic-game/src/` against `AGENTS.md` + `CLAUDE.md` and nested AGENTS files. No files were modified. Findings categorized by type, severity (HIGH / MED / LOW), with file:line, description, and recommended action (DELETE / MERGE / INTEGRATE / FIX).

Sections:
1. Duplicates
2. Orphans / unintegrated code
3. Inconsistencies
4. Dead / unreachable code
5. Missing integration
6. Summary & priorities

---

## 1. DUPLICATES

### HIGH

- **HIGH** `src/components/GigHUD.tsx:25` vs `src/types/components.d.ts:53` — `GigHUDProps` duplicated with **divergent shapes** (local: inline `stats`, fixed handlers, `gameStateRef.current: GameState`; shared: `GigHUDStats`, optional handlers, `projectiles?: unknown[]`). Action: **DELETE** the shared (unused) version.
- **HIGH** `src/components/MapNodeView.tsx:34` vs `src/types/components.d.ts:68` — `MapNodeProps` incompatible (local has 14 fields incl. `visibility`, `isReachable`; shared has 4). Action: **DELETE** from `components.d.ts`.
- **HIGH** `src/components/MapConnection.tsx:10` vs `src/types/components.d.ts:75` — `MapConnectionProps` duplicated, shared unused. Action: **DELETE**.
- **HIGH** `src/components/HecklerOverlay.tsx:19` vs `src/types/components.d.ts:81` — `HecklerOverlayProps` duplicated, shared unused. Action: **DELETE**.
- **HIGH** `src/utils/` — `clampVanCondition` vs `clamp0to100` overlap on identical bound semantics. Action: **MERGE** to a single canonical helper in `gameStateUtils.ts`.
- **HIGH** `src/context/reducers/socialReducer.ts:316-392` (`handlePirateBroadcast`) vs `:394-474` (`handleDarkWebLeak`) — ~80 lines of near-identical clamp/spend/toast composition, differing only by `lastPirateBroadcastDay` vs `lastDarkWebLeakDay`. Same for `PirateBroadcastPayload` / `DarkWebLeakPayload` in `src/types/actions.d.ts:29-45`. Action: **MERGE** behind a single `applyZealotryAction(state, payload, dayField)` helper.

### MED

- **MED** `src/components/overworld/OverworldMap.tsx:24`, `src/components/MapConnection.tsx:3`, `src/components/MapNodeView.tsx:19` — `NodeVisibility = 'visible' | 'dimmed' | 'hidden'` defined three times. Action: **MERGE** into `src/types/map.d.ts`.
- **MED** `src/utils/eventEngine.ts:91` vs `src/utils/gameStateUtils.ts:414` — `EventDelta` defined twice with divergent shapes. Action: **MERGE** into `src/types/events.d.ts`.
- **MED** `src/utils/purchaseLogicUtils.ts:17-21` vs `src/ui/bandhq/hooks/usePurchaseLogic.ts:46-50` — `PlayerPatch` / `BandPatch` duplicated verbatim. Action: **MERGE** into shared types.
- **MED** `src/scenes/kabelsalat/components/SocketGraphics.tsx:11` and `PlugGraphics.tsx:11` — `ConnectorType` union duplicated. Action: **MERGE** into `src/types/kabelsalat.d.ts`.
- **MED** `src/hooks/minigames/useTourbusLogic.ts:19` vs `src/components/stage/TourbusObstacleManager.ts:4` — `TourbusObstacle` duplicated. Action: **MERGE**.
- **MED** `src/scenes/kabelsalat/components/ConnectionPaths.tsx:8` — re-derives `SocketId` from a prop instead of importing the canonical `SocketId`. Action: **FIX** to import.
- **MED** Player money/fame clamp logic duplicated in `createUpdatePlayerAction` (`src/context/actionCreators.ts:83-121`) and `handleUpdatePlayer` (`src/context/reducers/playerReducer.ts:17-56`); reducer re-clamps even when payload key is absent. Action: **FIX** reducer to clamp only when payload key present (keep terminal clamp).
- **MED** Inline `Math.max(0, Math.min(100, …))` for controversy in `socialReducer.ts:277-280, 358-361, 440-443` — `clampControversyLevel` already exists in `gameStateUtils.ts`. Action: **MERGE** to use the helper.
- **MED** Amp dial 0–1000 clamp re-implemented in three layers: `src/hooks/minigames/useAmpLogic.ts:243`, `src/components/minigames/amp/AmpControls.tsx:34,37,44,48`, `src/components/stage/AmpStageController.ts:66`. Action: **MERGE** into a `clampAmpDial` helper.

### LOW

- **LOW** `src/utils/audio/rhythmGameAudioUtils.ts:33`, `src/utils/socialEngine.ts:37`, `src/utils/rhythmUtils.ts:6` — `type RandomFn = () => number` declared three times. Action: **MERGE**.
- **LOW** `src/utils/audio/audioService.ts` is a thin facade over `AudioManager.ts` used only by `useAudioControl.ts`; other hooks bypass it. Action: **DELETE** facade or route all consumers through it.
- **LOW** `src/utils/clinicLogicUtils.ts`, `bloodBankUtils.ts`, `pirateRadioUtils.ts`, `darkWebLeakUtils.ts`, `contrabandStashUtils.ts` — five tiny validators with the same `{ isValid, errorKey, defaultMessage }` shape; `bloodBankUtils` returns boolean instead (inconsistent). Action: standardize result type in `validationTypes.d.ts`.
- **LOW** `src/utils/purchaseLogicUtils.ts:240` `applyInventoryAdd` vs `src/utils/gameStateUtils.ts:321` `applyInventoryItemDelta` — overlapping responsibility, different error semantics. Action: cross-reference docstrings or **MERGE**.
- **LOW** `src/utils/eventEngine.ts:350` `EFFECT_HANDLERS` shares its name with `src/utils/purchaseLogicUtils.ts:395` `EFFECT_HANDLERS` (two different registries). Action: rename to `EVENT_EFFECT_HANDLERS`.
- **LOW** `src/components/postGig/FinancialColumn.tsx:21-26` and `FinancialList.tsx:23` independently derive income/expense color. Action: **MERGE** into a shared helper.
- **LOW** `src/data/chatter.ts` — one-line re-export shim. Optional **DELETE**.

---

## 2. ORPHANS / UNINTEGRATED CODE

### HIGH

- **HIGH** `UPDATE_RIVAL_BAND` fully orphaned: declared `src/context/actionTypes.ts:38`, creator `actionCreators.ts:563-579` (`createUpdateRivalBandAction`), handler `reducers/rivalReducer.ts:46-59`, mapped at `gameReducer.ts:143`, typed at `src/types/game.d.ts:155`. **No dispatcher anywhere**. Action: **DELETE** end-to-end or **INTEGRATE** if rival HP/power mutation is intended.
- ~~**HIGH** `src/utils/postGigUtils.ts` — `calculateExcessMissMoneyPenalty` / `applyPostGigPerformancePenalty` are never invoked~~ **RETRACTED**: both are integrated. `deriveFinancials` (`postGigUtils.ts:769`) calls `applyPostGigPerformancePenalty`, which calls `calculateExcessMissMoneyPenalty` (`postGigUtils.ts:597`); `deriveFinancials` is consumed by `src/hooks/usePostGigLogic.ts:92`. No action.
- **HIGH** `src/utils/eventValidator.ts` — `validateGameEvent` is exported but never imported in `src/`; schemas under `src/schemas/` reference it as the validator of record. Action: **INTEGRATE** at event ingestion or **DELETE**.

### MED

- **MED** `src/context/reducers/questReducer.ts:12,14` — `handleCompleteQuest`, `handleFailQuests` exported but never imported (callers use `QuestLifecycle.*` directly). Action: **DELETE** the pass-throughs.
- **MED** `src/types/components.d.ts` orphan exports never imported: `GenericListProps` (l.85), `MinigameLogicBase` (l.127), `TourbusMinigameLogic` (l.134), `ToggleRadioProps` (l.176), `TutorialManagerProps` (l.180), `ClinicMemberCardHeaderProps` (l.188), `ClinicMemberCardActionProps` (l.202), `FinancialCategory` (l.428), `CatalogEffect` / `CatalogInputEffect` (l.464-465), `Balances` (l.506), `UnlockMessageKind` (l.531). Action: **DELETE**.
- **MED** `src/types/actions.d.ts:1` `CompleteTravelMinigamePayload` — never imported. Action: **DELETE** or wire to action union.
- **MED** `src/types/audio.d.ts:2` `NoteType` — never imported. Action: **DELETE**.
- **MED** `src/types/callbacks.d.ts` — `AsyncCallback`, `GigFinalizeHandler`, `RemoveByIdCallback` never imported. Action: **DELETE**.
- **MED** `src/types/npc.d.ts:1` `CharacterProfile` — never imported. Action: **DELETE**.
- **MED** `src/types/rhythmGame.d.ts:43` `GigStats` — only used internally; external callers use `Parameters<typeof createSetLastGigStatsAction>` instead. Action: export properly or **DELETE**.

### LOW

- **LOW** `src/context/GameState.tsx:83-89` imports `SAVE_KEY`, `createRawLoadPayload`, `safeStorage`, `safeStorageNoFallback` but doesn't reference them. Action: **DELETE** unused imports.
- **LOW** Locale ui.json: ~160 likely-unused keys (after excluding dynamically indexed `featureList.*`). Confirmed unused: `ui:milestones.high_harmony.reward`, `ui:arrival.harmonyTooLowToPerform`, `ui:brutalist.glitchPlaceholder`, `ui:button.sign`, `ui:bandhq.money`, `ui:bandhq.funds`, plus `chatter_labels.*`, stale `chatter.*` (msg1-3, random1), `rewards.*`, `terminal.*`, `leaderboard.*`, etc. Action: **DELETE** from EN+DE.

---

## 3. INCONSISTENCIES

### HIGH

- **HIGH** Numeric `|| 0` instead of `?? 0` (AGENTS gotcha: preserve falsy zeros):
  - `src/hooks/minigames/useRoadieLogic.ts:180,188,297,304` — `contrabandCount || 0`
  - `src/hooks/rhythmGame/useRhythmGameScoring.ts:181,335,362,394` — `hits`, `corruptionLevel`, `overload`
  - `src/hooks/useTravelLogic.ts:586` — `layer || 0` (layer 0 is valid)
  - `src/hooks/usePostGigLogic.ts:65` — `lastGigStats?.score || 0`
  - `src/components/MapNodeView.tsx:156` — `node.venue?.diff || 0`
  - `src/utils/gigStats.ts:86` — `stats.hits || 0`
  - widespread in `src/utils/postGigUtils.ts`, `socialEngine.ts`, `eventEngine.ts`, `arrivalUtils.ts`. Action: **FIX** to `??`.
- **HIGH** Hardcoded Tailwind z-index instead of `z-(--z-X)` tokens:
  - `src/components/PixiStage.tsx:65` (z-20)
  - `src/components/GigHUD.tsx:51` (z-30)
  - `src/components/HecklerOverlay.tsx:108` (z-20)
  - `src/components/MapNodeView.tsx:107,304,340`
  - `src/components/overworld/OverworldMap.tsx:232` (z-30)
  - `src/components/minigames/tourbus/TourbusControls.tsx:11` (z-40)
  - `src/components/minigames/tourbus/TourbusHUD.tsx:8` (z-30)
  - `src/components/minigames/amp/AmpHUD.tsx:19` (z-30)
  - `src/components/minigames/roadie/RoadieHUD.tsx:9` (z-30)
  - `src/components/minigames/roadie/RoadieControls.tsx:102,112,126,132`
  - `src/components/hud/StatsOverlay.tsx:26` (z-10). Action: **FIX** with design tokens.
- **HIGH** `COMPLETE_AMP_CALIBRATION` discriminated union missing `hijacksOverridden`: `src/types/game.d.ts:149-152` declares only `{ score, voidResonance, purgesUsed }`, but creator (`actionCreators.ts:529-538`) and reducer (`minigameReducer.ts:302`) both read/write `hijacksOverridden`. Action: **FIX** the union member.
- **HIGH** `SET_GIG_MODIFIERS` reducer signature wider than the action union: `gigReducer.ts:54-64` accepts `Record<string, boolean>` while the union (`game.d.ts:125-128`) is `Partial<GigModifiers>`. Action: **FIX** reducer signature.

### MED

- **MED** Currency/format inconsistency — utilities `formatCurrency`/`formatNumber` exist (`src/utils/numberUtils.ts`) but multiple components concatenate raw numbers with `€`:
  - `src/components/clinic/ClinicHeader.tsx:24`
  - `src/components/clinic/ClinicMemberCard.tsx:94`
  - `src/components/postGig/DealCard.tsx:179,189`
  - `src/components/pregig/MerchStrategyBlock.tsx:90-91`
  - `src/hooks/usePostGigHandlers.ts:166,257-258,330`
  - `src/hooks/useTravelLogic.ts:670,725,739,774,798,825`. Action: **MERGE** through `formatCurrency`.
- **MED** `handleAddVenueBlacklist` toastId not unique: `gigReducer.ts:176-180` passes deterministic `${gigVenueId}-blacklisted` though the creator uses `getSafeUUID()`. Re-blacklisting collides. Action: **FIX**.
- **MED** `handleAddCooldown` (`eventReducer.ts:43-54`) lacks `isForbiddenKey` guard while other string-into-array helpers vary in their guards. Action: **FIX** or document.
- **MED** `sanitizeNonNegativePayload` floors negative `harmonyCost`/`staminaCost`/`controversyGain` to 0 silently in `actionCreators.ts:746-752, 783-789, 827-834, 851-858`. Action: **FIX** (reject vs floor) or document.
- **MED** `handleUpdateBand` clamps only `harmony` while `stress`, `luck`, `tempo`, member `stamina`/`mood` flow through unclamped (`bandReducer.ts:30-62`). Action: **FIX** with shared band clamps.
- **MED** `src/context/gameConstants.ts:22` `MINIGAME_TYPES` is a plain object literal; adjacent `GAME_PHASES` uses `as const satisfies …`. Action: **FIX** to use `as const satisfies`.
- **MED** Per `src/types/AGENTS.md`, shared domain contracts must live in `src/types/`, but `MapNodeProps`, `MapConnectionProps`, `HecklerOverlayProps`, `GigHUDProps`, `EventDelta`, `TourbusObstacle`, `PlayerPatch`, `BandPatch`, `ConnectorType`, `NodeVisibility` are duplicated locally and the shared versions drift. Action: **MERGE**/**DELETE**.
- **MED** `src/hooks/usePreGigLogic.ts:314` — `currentGig?.id || \`gig_${getSafeUUID()}\`` will mint a new UUID for `id === ''`. Action: **FIX** to `??`.

### LOW

- **LOW** `createUpdatePlayerAction` (`actionCreators.ts:108-110`) conditionally derives `fameLevel`, but reducer always recomputes it (`playerReducer.ts:46-47`). Action: **FIX** creator (remove conditional).
- **LOW** `handleBloodBankDonate` uses `Number(x) || 0` (`clinicReducer.ts:197-200`) which doesn't floor negatives; relies on the creator's clamp. Action: **FIX** for defense-in-depth.
- **LOW** `src/utils/mapGenerator.ts:694-695` `dx = this.random() - 0.5 || 0.1` uses `||` for non-zero guard. Cryptic; refactor as ternary.
- **LOW** `src/hooks/usePostGigLogic.ts:149-157` `errorHandledRef` mixes `false` with object discriminants. Action: **FIX** to typed discriminated union (`{ kind: 'idle' | 'pending' | 'handled' }`).
- **LOW** `src/components/postGig/CompletePhase.tsx:101` hardcodes `'Spin Story (-200€, -25 Controversy)'` in i18n defaultValue — drifts from `MODIFIER_COSTS`. Action: **FIX** with interpolation.
- **LOW** `src/components/postGig/CompletePhase.tsx:80-81` magic `'unknown'` platform fallback. Action: **FIX** with named constant.

---

## 4. DEAD / UNREACHABLE CODE

### HIGH

- **HIGH** `src/types/components.d.ts:53-83` — four Props interfaces (`GigHUDProps`, `MapNodeProps`, `MapConnectionProps`, `HecklerOverlayProps`) entirely unused and drifted from local truth. Action: **DELETE**.

### MED

- **MED** `src/context/reducers/bandReducer.ts:445` `if (!('payload' in action)) return state` — every BAND_ACTION has a payload; the guard is unreachable. Action: **DELETE** or replace with `assertNever`.
- **MED** `src/types/migration-stubs.d.ts` — file name and contents suggest a complete migration; verify and **DELETE** if obsolete.
- **MED** `src/hooks/minigames/minigameConstants.ts:7-8` — `GRID_WIDTH`/`GRID_HEIGHT` aliases superseded by `ROADIE_*` names. Action: **DELETE**.

### LOW

- **LOW** `src/context/initialState.ts:301-302` — `pendingBandHQOpen: false` and `completedMilestones: []` overrides after `...initialState` spread are redundant. Action: **DELETE**.
- **LOW** `src/types/actions.d.ts:68` `MerchPressPayload.isSuccess` is never read. Action: **DELETE** field.
- **LOW** `src/context/reducers/socialReducer.ts:302-303` orphan "inventory rewards removed" comment. Action: **DELETE**.
- **LOW** `src/context/gameReducer.ts:191-209` final `assertNever(action as never)` is unreachable (guarded by `Object.hasOwn` checks) and the `as never` defeats exhaustiveness. Action: **FIX** narrative/comment.
- **LOW** `src/context/reducers/systemReducer.ts:1684`, `minigameReducer.ts:300,345`, `tradeReducer.ts:52` typed payload as `Record<string, unknown>` even though the action union is precise. Action: **FIX** to narrow payload types via `ReducerMap`.
- **LOW** `src/schemas/crisis.json` — header says authoritative validation is `validateCrisisEvent` in `eventValidator`; no code consumes the JSON schema. Action: wire or **DELETE**.
- **LOW** `src/utils/imageGen.ts:4` — hardcoded API key (gitleaks-allowed). Note only.

---

## 5. MISSING INTEGRATION

- **HIGH** `UPDATE_RIVAL_BAND` (see Orphans §2 HIGH) — likely a feature gap: rival HP/power can never be mutated. Action: **INTEGRATE** into encounter resolution OR **DELETE**.
- ~~**HIGH** `applyPostGigPerformancePenalty` / `calculateExcessMissMoneyPenalty`~~ **RETRACTED**: already wired via `deriveFinancials` → `usePostGigLogic.ts`. No action.
- **HIGH** `validateGameEvent` (see Orphans §2 HIGH) — schema validator unused at event ingestion. Action: **INTEGRATE** or **DELETE**.
- **LOW** `src/context/reducers/systemReducer.ts:1500-1510` `handleSetMap(null)` logs as warning, but `useMapGeneration.ts:88` dispatches null as the legitimate retry-exhausted path. Action: **FIX** log level.
- **LOW** `GAME_PHASES.PRACTICE` is not in `SCENES_WITHOUT_HUD` in `App.tsx:23-33`. Confirm HUD-during-practice is intentional.
- All 14 `src/scenes/*.tsx` files resolve through `SceneRouter.tsx`; all UI modals have at least one consumer; no orphan scenes or hooks at the routing layer.

---

## 6. SUMMARY & PRIORITIES

### Headline metrics
- ~95 findings: ~15 HIGH, ~45 MED, ~30 LOW (2 HIGH findings retracted post-review; see §2/§5)
- No orphan hooks/components; no `forwardRef`, `.propTypes`, `@ts-ignore`/`@ts-nocheck`, or `: any` in audited surfaces
- Locale parity (scalar paths) between EN/DE: clean
- Hex literals in components: all intentional Pixi-token fallbacks

### Top-priority fixes (highest ROI)
1. **Resolve `UPDATE_RIVAL_BAND`** — delete or integrate the full chain.
2. **Sync `COMPLETE_AMP_CALIBRATION` union with `hijacksOverridden`** — type/runtime drift hidden by assertions.
3. **Tighten `SET_GIG_MODIFIERS` reducer signature** to match the action union.
4. **Sweep numeric `|| 0` → `?? 0`** in hooks/utils — explicit AGENTS gotcha, masks valid zero state.
5. **Tokenize hardcoded `z-*` Tailwind values** across HUD/minigames — single-PR mechanical fix.
6. **Delete the four drift-prone props interfaces** in `src/types/components.d.ts`.
7. **Merge `handlePirateBroadcast`/`handleDarkWebLeak`** behind a parametrized helper.
8. **Consolidate amp-dial clamp** into one helper.
9. **Standardize currency rendering** through `formatCurrency`.
10. **Wire or delete `validateGameEvent`** at event ingestion.

### Highest-leverage cleanup batches
- `src/types/components.d.ts` orphan/duplicate purge (~15 deletions in one PR).
- Locale ui.json stale-key purge (~160 keys, EN+DE in lockstep).
- `||` → `??` sweep (hooks + utils, ~15 sites).
- `z-*` tokenization sweep (~12 sites).

### Audit confidence notes
- Orphan claims verified via ripgrep across `src/` excluding self-files; locale claims cross-checked against literal-string usage and dynamic indexing patterns (`featureList.*` excluded as dynamic).
- "Missing integration" findings are conservative: only flagged where a fully-implemented function is unreferenced and AGENTS.md mandates its use, OR where an action type has a full reducer/creator chain with zero dispatchers.
- A few items overlap categories (e.g. `UPDATE_RIVAL_BAND` is both Orphan and Missing Integration); each is listed once with cross-references.
