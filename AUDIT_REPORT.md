# Neurotoxic Codebase Audit - Verified Findings

Verified against the current codebase on 2026-05-20.

Scope: `src/` with targeted checks in `tests/`, root and relevant nested `AGENTS.md`, and EN/DE locale parity. Tests were not audited as primary source except where needed to classify test-only exports or coverage gaps. Locale parity was rechecked across `public/locales/en/*.json` and `public/locales/de/*.json`; no key mismatches were found.

This replaces the two earlier draft reports that were concatenated in this file. Repeated findings were merged, stale recommendations were narrowed, and line references below reflect the current workspace.

## 1. Duplicates / Overlapping Utility Surfaces

### MED

- MED | `src/utils/gameStateUtils.ts:38`, `src/utils/saveValidator.ts:15`, `src/utils/errorHandler.ts:186`, `src/context/reducers/tradeReducer.ts:143` | `isPlainObject` | Confirmed. `gameStateUtils` and `saveValidator` carry the same loose object/non-array guard, while `errorHandler` requires `Object.prototype` and `tradeReducer` allows `Object.prototype` plus null-prototype objects. | MERGE: centralize the intended variants with explicit names such as `isLooseRecord` and `isPlainRecord`, then import the matching helper at each boundary.

- MED | `src/context/reducers/tradeReducer.ts:21`, `src/utils/errorHandler.ts:207` | `sanitizeContextValue` | Confirmed near-duplicate recursive context sanitizers. The trade reducer HTML-escapes toast context and strips forbidden keys; the error handler handles circular references and sensitive-key redaction. | MERGE: extract the shared recursive safe-object traversal and keep domain-specific transforms local.

- MED | `src/ui/SupplyStopModal.tsx:30`, `src/ui/SupplyStopModal.tsx:48`, `src/ui/bandhq/hooks/usePurchaseLogic.ts:226`, `src/ui/bandhq/hooks/usePurchaseLogic.ts:343`, `src/ui/bandhq/hooks/usePurchaseLogic.ts:435`, `src/utils/purchaseLogicUtils.ts:66`, `src/utils/purchaseLogicUtils.ts:359`, `src/utils/purchaseLogicUtils.ts:460` | supply-stop purchase flow | Confirmed. `SupplyStopModal` reimplements the Band HQ purchase pipeline: it manually picks `item.effects?.[0] ?? item.effect`, calls `processPurchaseEffect`, applies patches, and skips `validatePurchase` plus `processPurchaseUnlocks`. | MERGE: route supply-stop purchases through the canonical validation/effect/unlock path, then apply the supply-stop fame consequence as a wrapper.

- MED | `src/utils/postGigUtils.ts:59`, `src/data/platforms.ts:1`, `src/types/social.d.ts:3` | social platform IDs | Confirmed. `postGigUtils` hardcodes a `SOCIAL_PLATFORM_IDS` set even though `SOCIAL_PLATFORMS` and the `Platform` union already define the same ID domain. | MERGE: derive the set from `SOCIAL_PLATFORMS` or export a canonical platform ID set.

### LOW

- LOW | `src/components/postGig/DealCard.tsx:27`, `src/components/postGig/DealCard.tsx:42`, `src/components/postGig/DealCard.tsx:61`, `src/components/postGig/DealCard.tsx:108` | brand alignment metadata | Confirmed. Four switch statements separately encode image prompt, i18n key, default label, and color class for the same alignment domain. | MERGE: replace with one metadata map keyed by `BRAND_ALIGNMENTS`.

- LOW | `src/hooks/useTravelLogic.ts:90`, `src/utils/travelUtils.ts:41` | venue validation/resolution | Confirmed. `useTravelLogic` has a local `isVenue` guard while `travelUtils.resolveVenue` owns venue normalization in the same flow. | MERGE: centralize venue resolution/validation in `travelUtils`.

- LOW | `src/utils/storage.ts:13`, `src/utils/errorHandler.ts:548` | `safeStorageOperation` | Confirmed overlapping API surface. `storage.ts` re-exports a wrapper under the same public helper name as `errorHandler.ts`. | FIX: keep one public entrypoint for new callers and make the lower-level helper private or clearly renamed.

## 2. Orphaned / Over-Exported Symbols

Import graph checks did not identify fully orphaned TS/TSX source files. The findings below are symbol-level over-exports or compatibility surfaces.

### LOW

- LOW | `src/context/GameState.tsx:1016`, `tests/utils/architecture.test.jsx:134` | `useGameState` | Rewritten. Production source no longer consumes the deprecated combined hook, but `tests/utils/architecture.test.jsx` explicitly asserts the legacy compat export exists. | DOCUMENT/MIGRATE: do not delete blindly; either document it as compatibility API or migrate tests and remove the architecture assertion in the same change.

- LOW | `src/hooks/usePreGigLogic.ts:33`, `tests/ui/PreGig.test.jsx:126` | `_resetLastMinigameFallback` | Confirmed test-only export. | FIX: mark as test-only or replace with module isolation so production hook code does not expose a cleanup helper.

- LOW | `src/components/stage/NoteSpritePool.ts:27` | `NoteSpriteFactory` | Confirmed. The class is only instantiated by `NoteSpritePool` in the same file. | DELETE: remove the export unless an external factory API is intended.

- LOW | `src/components/stage/NoteSpritePool.ts:4` | note sprite constants | Confirmed. `NOTE_CENTER_OFFSET` is imported by `NoteManager`, but `NOTE_JITTER_RANGE`, `NOTE_SPRITE_SIZE`, `NOTE_FALLBACK_WIDTH`, `NOTE_FALLBACK_HEIGHT`, `NOTE_INITIAL_Y`, and `NOTE_LIGHTNING_LANE_INDEX` are only consumed inside `NoteSpritePool`; tests/benchmarks duplicate literal values instead of importing them. | FIX: make internal-only constants private, or import them in tests/benchmarks as the authoritative values.

- LOW | `src/components/stage/pixiAppTeardown.ts:33` | `isBenignDestroyError` | Confirmed. The helper is only used inside `pixiAppTeardown.ts`. | DELETE: remove the export or add focused tests if it is meant to be public teardown API.

- LOW | `src/components/stage/stageRenderUtils.ts:189`, `tests/node/pixiStageUtils.test.js:6` | `RHYTHM_LAYOUT` | Confirmed test-only production export. | FIX: document it as a testable layout contract or keep constants internal and test `buildRhythmLayout`.

- LOW | `src/context/initialState.ts:236` | `initialState` | Confirmed. Runtime uses `createInitialState()`; direct imports of `initialState` are test-only or same-module. | FIX: prefer `createInitialState()` in tests and make the base object internal if a mutable exported singleton is not intended API.

- LOW | `src/hooks/useLeaderboardSync.ts:58`, `src/hooks/useLeaderboardSync.ts:81`, `src/hooks/useLeaderboardSync.ts:103`, `src/hooks/useLeaderboardSync.ts:132` | leaderboard sync helpers | Confirmed. `isValidForSync`, `calculateTotalFollowers`, `createSyncPayload`, and `syncLeaderboardStats` are exported but only consumed by `useLeaderboardSync` in the same file. | DELETE: unexport unless they are intended public test APIs.

- LOW | `src/utils/brandDealI18n.ts:20`, `src/utils/brandDealI18n.ts:23` | brand deal i18n key helpers | Confirmed. `getBrandDealNameKey` and `getBrandDealDescriptionKey` are only used by `getTranslatedBrandDealDisplay` in the same file. | DELETE: make them module-private.

- LOW | `src/hooks/minigames/useRoadieLogic.ts:94`, `src/hooks/minigames/useRoadieLogic.ts:116` | roadie traffic helpers | Confirmed. `spawnTraffic` and `processTraffic` are only called inside `useRoadieLogic`; tests do not import them. | DELETE: unexport unless a test/helper API is planned.

- LOW | `src/utils/financialColors.ts:1` | `FinancialEntryType` | Confirmed. The exported type is only used by `getFinancialColors` in the same file. | DELETE: unexport the type unless external callers need it.

## 3. Inconsistencies

### HIGH

- HIGH | `src/hooks/rhythmGame/useRhythmGameAudio.ts:3`, `src/hooks/rhythmGame/useRhythmGameAudio.ts:9`, `src/utils/audio/AGENTS.md` | audio module boundary | Confirmed. The hook imports `setupGigPhysics`, `resolveActiveSetlist`, `playSongSequence`, and `resetGigStateTracking` directly from `../../utils/audio/rhythmGameAudioUtils`, while `src/utils/audio/AGENTS.md` requires all imports from outside `src/utils/audio/` to go through `audioEngine.ts`. | FIX: expose the needed facade from `audioEngine.ts` or move hook-facing orchestration out of the private audio submodule.

### MED

- MED | `src/data/milestones/milestones.ts:20`, `src/data/milestones/milestones.ts:29`, `src/context/gameReducer.ts:232`, `src/context/gameReducer.ts:237` | milestone actions/toasts | Confirmed. Milestones store hand-written `GameAction` objects and `gameReducer` creates a raw `ADD_TOAST`, bypassing the action-creator convention. | FIX: store reward factories/descriptors and dispatch through action creators such as `createUpdatePlayerAction`, `createUpdateSocialAction`, and `createAddToastAction`.

- MED | `src/utils/darkWebLeakUtils.ts:22`, `src/utils/darkWebLeakUtils.ts:24`, `src/utils/darkWebLeakUtils.ts:32` | `validateDarkWebLeak` | Confirmed. The validator uses `typeof === 'number'` plus comparisons, so `NaN` passes money, harmony, and controversy checks because range comparisons are false. | FIX: require `Number.isFinite` for money, harmony, and controversy before threshold checks.

- MED | `src/utils/eventValidator.ts:154`, `src/utils/eventValidator.ts:330` | `validateCrisisEvent` chance guard | Confirmed and narrowed. `validateGameEvent` later uses `Number.isFinite` for crisis-tagged events, but the standalone `validateCrisisEvent` chance guard does not. | FIX: add a finite-number check to the standalone `validateCrisisEvent` chance validation.

- MED | `src/scenes/Overworld.tsx:24`, `src/scenes/Overworld.tsx:100`, `src/scenes/Overworld.tsx:212`, `src/components/overworld/OverworldModals.tsx:56`, `src/hooks/overworld/useOverworldModals.ts:9`, `src/components/overworld/AGENTS.md:14` | `SupplyStopModal` modal ownership | Confirmed. `SupplyStopModal` is managed inline in `Overworld.tsx`, while nested instructions define `OverworldModals` plus `useOverworldModals()` as the canonical Overworld modal stack. | MERGE: move supply-stop modal state/rendering into the Overworld modal stack.

- MED | `src/components/stage/stageRenderUtils.ts:4`, `src/components/stage/AmpWaveManager.ts:70`, `src/components/stage/AmpWaveManager.ts:128`, `src/index.css:86` | Pixi token fallback for `--electric-blue` | Confirmed and narrowed from the earlier broad fallback-map finding. `AmpWaveManager` resolves `--electric-blue`, CSS defines `--color-electric-blue`, but `PIXI_TOKEN_FALLBACKS` lacks `--electric-blue`; non-DOM/test fallback resolves to white. | FIX: add `--electric-blue: '#3b82f6'` to Pixi token fallbacks and consider a token/fallback parity test.

- MED | `src/context/actionCreators.ts:55`, `src/context/actionCreators.ts:432`, `src/context/reducers/minigameReducer.ts:93`, `src/context/reducers/minigameReducer.ts:173` | numeric payload boundary handling | Confirmed and narrowed. `sanitizeNonNegativePayload` uses `Number(raw) || 0` before clamping, while travel minigame `rngValue` is passed through unsanitized and the reducer only checks `typeof rngValue === 'number'` before using it for member selection/drop logic. | FIX: use finite-number helpers at payload boundaries and clamp `rngValue` to `[0, 1)`.

- MED | `src/utils/bloodBankUtils.ts:3`, `src/utils/darkWebLeakUtils.ts:15`, `src/utils/pirateRadioUtils.ts:11`, `src/utils/pirateRadioUtils.ts:18` | Overworld service validators | Confirmed. Similar service validators handle invalid numeric resource state differently: blood bank silently defaults with `??`/`||`, dark web returns `false` for non-numbers but lets `NaN` through, and pirate radio throws on non-finite values before clamping. | FIX: standardize these validators around one finite-resource guard pattern.

### LOW

- LOW | `src/components/stage/NoteManager.ts:148` | Pixi hit-effect fallback color | Confirmed. The hit-effect fallback uses hardcoded `0xffffff` instead of a Pixi token helper such as `getPixiColorFromToken('--star-white')`. | FIX: route fallback colors through Pixi token helpers.

- LOW | `src/components/overworld/OverworldMap.tsx:104`, `src/components/overworld/OverworldMap.tsx:114`, `src/components/overworld/OverworldMap.tsx:123`, `src/components/overworld/OverworldMap.tsx:124` | offline map SVG copy/colors | Confirmed. Offline SVG assets embed English visible labels (`OFFLINE MAP`, `Routes and markers remain distinct while offline`, `YOU`, `RIVAL`) and hardcoded black/white SVG colors. | FIX: move visible fallback text to i18n keys and use project color tokens or generated token-derived values where possible.

## 4. Dead / Missing Integration

### HIGH

- HIGH | `src/context/actionCreators.ts:552`, `src/context/actionCreators.ts:559`, `src/context/gameReducer.ts:141`, `src/context/gameReducer.ts:142`, `src/context/GameState.tsx:211`, `src/context/GameState.tsx:817`, `src/scenes/Overworld.tsx:115`, `src/scenes/Overworld.tsx:133`, `src/hooks/useTravelLogic.ts:365`, `src/hooks/useTravelLogic.ts:80` | rival movement and encounter dispatch path | Confirmed. Rival movement/check action creators and reducers exist, and `useTravelLogic` still contains an optional raw `dispatch` path, but `Overworld` explicitly does not pass `dispatch`, and `GameDispatchActions` exposes only `spawnRivalBand`/`updateRivalBand`. In the primary travel flow the rival move/check branch is unreachable. | WIRE-UP: add named `moveRivalBand` and `checkRivalEncounter` actions to `GameDispatchActions`, include them in `dispatchValue`, call them from travel completion, then remove the optional raw `dispatch` prop/import path from `useTravelLogic`.

- HIGH | `src/hooks/overworld/useSpawnRivalBand.ts:11`, `src/hooks/overworld/useRivalEscalation.ts:19`, `src/hooks/useRhythmGameLogic.ts:71`, `src/hooks/rhythmGame/useRhythmGameScoring.ts:156`, `src/context/reducers/rivalReducer.ts:33`, `public/locales/en/ui.json:1559`, `public/locales/de/ui.json:1559` | static rival system | Confirmed. Rival spawning, same-location escalation, gig penalty, localized encounter toast, reducers, and action creators exist, but the rival band does not move after travel unless some non-primary caller supplies raw dispatch. This leaves most of the rival system dormant or static. | WIRE-UP: after player travel completes, move the rival, check for encounter, and ensure the rhythm-game rival penalty can activate naturally.

- HIGH | `src/scenes/TourbusScene.tsx:15`, `src/hooks/useArrivalLogic.ts:12`, `src/hooks/useArrivalLogic.ts:101`, `src/utils/arrivalUtils.ts:163`, `src/utils/arrivalUtils.ts:208`, `src/context/GameState.tsx:817` | Tourbus arrival modal bridges | Confirmed. `handleNodeArrival` supports `onShowSupplyStop` and `onShowHQ`, but `useArrivalLogic` accepts only `onShowHQ`, and `TourbusScene` calls `useArrivalLogic()` with no options. After minigame completion, supply-stop arrivals cannot open the shop modal, and START-node arrivals cannot trigger the pending Band HQ flow. | WIRE-UP: add a pending supply-stop modal path similar to `pendingBandHQOpen`, and pass `setPendingBandHQOpen(true)` or equivalent into the Tourbus arrival path.

## 5. Test Gaps

### LOW

- LOW | `tests/useTravelLogicTestUtils.js:141`, `tests/node/useTravelLogic.test.js:59`, `tests/ui/actionTypes.test.jsx:38` | rival travel integration coverage | Confirmed. Tests list rival action types, but `useTravelLogic` tests do not exercise a production-equivalent named rival move/check path; the test fixture also does not provide dispatchers for the missing named actions. | FIX: add a travel-completion test that asserts rival move/check dispatchers are called through named game actions, not raw dispatch.

## Rewritten Or Removed Draft Items

- The draft statement "No exact duplicated functions were confirmed" was incorrect. The loose `isPlainObject` helper in `gameStateUtils` and `saveValidator` is an exact duplicate.
- The broad Pixi fallback-map drift finding was rewritten to the concrete `--electric-blue` missing fallback; the remaining hardcoded fallback map may still deserve a parity test, but the confirmed defect is the missing token.
- The `useGameState` recommendation was narrowed from `DELETE` to `DOCUMENT/MIGRATE` because the architecture test intentionally requires the compatibility export.
- Rival dispatch, dead rival reducer paths, dormant rival encounter toast, and static rival penalty findings were consolidated into the two rival integration findings above.
- Supply-stop inline modal, supply-stop arrival, and supply-stop purchase-pipeline findings were consolidated, with separate recommendations for modal ownership, Tourbus arrival bridging, and canonical purchase handling.
