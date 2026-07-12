# Neurotoxic Codebase Audit Report

**Date:** 2026-07-12
**Scope:** `src/` (excluding tests, dist, node_modules)

## 1. DUPLICATES

*(No exact duplicates or identical duplicated components found. Several utility re-implementations were identified and categorized under INCONSISTENCIES.)*

## 2. ORPHANED / UNINTEGRATED CODE

### Utils & Core Logic
- **[MED]** /app/src/utils/rhythmGameInputUtils.ts:4 - `DEBOUNCE_MS`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/travelUtils.ts:68 - `resolveVenue`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/travelUtils.ts:354 - `TravelCostsResult`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/arrivalUtils.ts:23 - `ArrivalNode`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/arrivalUtils.ts:31 - `GigArrivalNode`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/arrivalUtils.ts:54 - `ArrivalResult`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/chartDensity.ts:8 - `ChartDensityBar`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/merchUtils.ts:7 - `HQItemDef`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/merchUtils.ts:13 - `BASE_MERCH_CAPACITY`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/leaderboardUtils.ts:9 - `SongStat`
  - **Description**: Appears intended for use (has tests, has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/objectUtils.ts:6 - `RecordGuard`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/rhythmGameLoopUtils.ts:87 - `handleOverlayPause`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/rhythmGameLoopUtils.ts:144 - `processCorruptionBurst`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/rhythmGameLoopUtils.ts:171 - `processMissedNotes`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/mapUtils.ts:105 - `SoftlockContext`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[HIGH]** /app/src/utils/purchaseLogicUtils.ts:244 - `applyInventorySet`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[HIGH]** /app/src/utils/purchaseLogicUtils.ts:298 - `applyStatModifier`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/purchaseLogicUtils.ts:415 - `EFFECT_HANDLERS`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[HIGH]** /app/src/utils/purchaseLogicUtils.ts:500 - `applyUnlockUpgrade`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[HIGH]** /app/src/utils/purchaseLogicUtils.ts:534 - `applyUnlockHQ`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[HIGH]** /app/src/utils/purchaseLogicUtils.ts:704 - `applyPassive`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/logger.ts:252 - `LogEvent`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/storage.ts:17 - `GLOBAL_SETTINGS_KEY`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/assetConfig.ts:32 - `ChassisTierConfig`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/assetConfig.ts:53 - `DIY_PRICE_MULT`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/assetConfig.ts:58 - `DIY_UPKEEP_MULT`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/assetConfig.ts:63 - `DIY_RISK`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/assetConfig.ts:70 - `UPGRADE_OVERHEAD`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/assetConfig.ts:93 - `REPAIR_COST_PER_POINT`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/utils/loanProfiles.ts:63 - `REFINANCE_FEE_RATE`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.

### Hooks & Integrations
- **[HIGH]** /app/src/hooks/minigames/useAmpLogic.ts:70 - `AmpGameRefs`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[HIGH]** /app/src/hooks/minigames/useAmpLogic.ts:89 - `AmpGameSetters`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[HIGH]** /app/src/hooks/minigames/useAmpLogic.ts:322 - `updateAmpGameState`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[HIGH]** /app/src/hooks/minigames/useTourbusLogic.ts:37 - `HIT_DAMAGE_BASE`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[HIGH]** /app/src/hooks/minigames/useTourbusLogic.ts:39 - `HIT_DAMAGE_ARMOR`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[HIGH]** /app/src/hooks/minigames/useTourbusLogic.ts:41 - `HIT_DAMAGE_BULLBAR`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[HIGH]** /app/src/hooks/minigames/useTourbusLogic.ts:50 - `getHitDamage`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[HIGH]** /app/src/hooks/postGig/handlers/useMinorHandlers.ts:13 - `UseMinorHandlersProps`
  - **Description**: Appears intended for use (has docs). Missing obvious call site in component/scene. (Public API surface).
  - **Recommendation**: INTEGRATE into intended UI flow.
- **[HIGH]** /app/src/hooks/postGig/handlers/useProcessingGuard.ts:4 - `ProcessingGuardReturn`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[HIGH]** /app/src/hooks/postGig/handlers/useSocialPostHandler.ts:36 - `applySocialPostResult`
  - **Description**: Appears intended for use (has docs). Missing obvious call site in component/scene. (Public API surface).
  - **Recommendation**: INTEGRATE into intended UI flow.
- **[HIGH]** /app/src/hooks/postGig/handlers/useSocialPostHandler.ts:162 - `UseSocialPostHandlerProps`
  - **Description**: Appears intended for use (has docs). Missing obvious call site in component/scene. (Public API surface).
  - **Recommendation**: INTEGRATE into intended UI flow.
- **[HIGH]** /app/src/hooks/postGig/handlers/useDealHandlers.ts:32 - `buildAcceptDealQuestEvents`
  - **Description**: Appears intended for use (has docs). Missing obvious call site in component/scene. (Public API surface).
  - **Recommendation**: INTEGRATE into intended UI flow.
- **[HIGH]** /app/src/hooks/postGig/handlers/useDealHandlers.ts:69 - `UseDealHandlersProps`
  - **Description**: Appears intended for use (has docs). Missing obvious call site in component/scene. (Public API surface).
  - **Recommendation**: INTEGRATE into intended UI flow.
- **[HIGH]** /app/src/hooks/postGig/handlers/useContinueHandler.ts:47 - `buildSoldMerchInventory`
  - **Description**: Appears intended for use (has docs). Missing obvious call site in component/scene. (Public API surface).
  - **Recommendation**: INTEGRATE into intended UI flow.
- **[HIGH]** /app/src/hooks/postGig/handlers/useContinueHandler.ts:71 - `buildStoryFlagQuests`
  - **Description**: Appears intended for use (has docs). Missing obvious call site in component/scene. (Public API surface).
  - **Recommendation**: INTEGRATE into intended UI flow.
- **[HIGH]** /app/src/hooks/postGig/handlers/useContinueHandler.ts:117 - `dispatchEconomyQuests`
  - **Description**: Appears intended for use (has docs). Missing obvious call site in component/scene. (Public API surface).
  - **Recommendation**: INTEGRATE into intended UI flow.
- **[HIGH]** /app/src/hooks/postGig/handlers/useContinueHandler.ts:149 - `applyNeurotoxicPenalty`
  - **Description**: Appears intended for use (has docs). Missing obvious call site in component/scene. (Public API surface).
  - **Recommendation**: INTEGRATE into intended UI flow.
- **[HIGH]** /app/src/hooks/postGig/handlers/useContinueHandler.ts:171 - `handleContinueSceneTransition`
  - **Description**: Appears intended for use (has docs). Missing obvious call site in component/scene. (Public API surface).
  - **Recommendation**: INTEGRATE into intended UI flow.
- **[HIGH]** /app/src/hooks/postGig/handlers/useContinueHandler.ts:207 - `UseContinueHandlerProps`
  - **Description**: Appears intended for use (has docs). Missing obvious call site in component/scene. (Public API surface).
  - **Recommendation**: INTEGRATE into intended UI flow.
- **[HIGH]** /app/src/ui/bandhq/hooks/usePurchaseLock.ts:6 - `PurchaseLockResult`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[HIGH]** /app/src/ui/bandhq/hooks/useBandHQLogic.ts:29 - `BandHQLogicResult`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.

### UI & Components
- **[MED]** /app/src/ui/QuestsModal.tsx:230 - `QuestDeadlineView`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/ui/QuestsModal.tsx:239 - `getQuestDeadlineView`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/ui/QuestsModal.tsx:278 - `getQuestScopeHint`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/ui/QuestsModal.tsx:319 - `getQuestNextStepHint`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/ui/QuestsModal.tsx:335 - `getQuestPrimaryHint`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/ui/SupplyStopModal.tsx:16 - `SupplyStopModalProps`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/ui/DarkWebLeakModal.tsx:11 - `DarkWebLeakModalProps`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/ui/BandHQ.tsx:15 - `BandHQProps`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/ui/settings/SettingsPanel.tsx:13 - `SettingsPanelProps`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/ui/overworld/OverworldHeader.tsx:7 - `OverworldHeaderProps`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/ui/overworld/EventLog.tsx:8 - `EventLogProps`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/ui/overworld/OverworldHUD.tsx:19 - `OverworldHUDProps`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/ui/shared/KeyboardShortcuts.tsx:6 - `SHORTCUTS`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/ui/shared/GeneratedImagePanel.tsx:11 - `GeneratedImagePanelProps`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/ui/bandhq/ShopItem.tsx:17 - `ShopItemProps`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/ui/bandhq/BandHQContentArea.tsx:24 - `BandHQContentAreaProps`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/ui/bandhq/SetlistTab.tsx:98 - `SetlistTabProps`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/ui/bandhq/hooks/usePurchaseLock.ts:6 - `PurchaseLockResult`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.
- **[MED]** /app/src/ui/bandhq/hooks/useBandHQLogic.ts:29 - `BandHQLogicResult`
  - **Description**: Appears intended for use (has docs). (Public API surface).
  - **Recommendation**: Consider DELETING if no longer needed, or keep if part of planned public API.

### Data, Types & Schemas
- **[LOW]** /app/src/quests/producers/gigQuestEvents.ts:6 - `GigQuestEventInput`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/quests/producers/socialQuestEvents.ts:19 - `createSocialPostResolvedQuestEvent`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/quests/producers/socialQuestEvents.ts:36 - `createFollowersGainedQuestEvent`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/domain/questOfferEngine.ts:14 - `AvailableQuestOffer`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/domain/questRewards.ts:35 - `QuestRewardResult`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/domain/questPenalties.ts:22 - `QuestPenaltyResult`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/data/questRegistry.ts:79 - `isQuestRegistryId`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/data/songs.ts:42 - `transformSongsData`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/data/craftingRecipes.ts:11 - `CraftingRecipe`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/data/craftingRecipes.ts:66 - `CraftingRecipeId`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/data/craftingRecipes.ts:74 - `isCraftingRecipeId`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/data/hqItems.ts:19 - `ALL_HQ_ITEMS`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/data/events/index.ts:27 - `ALL_RAW_EVENTS`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/data/chatter/venueChatter.ts:7 - `VENUE_CHATTER_DB`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/data/milestones/milestones.ts:17 - `Milestone`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/context/useGameDispatchActions.ts:82 - `BaseGameDispatchActions`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/context/assetActionCreators.ts:134 - `PurchaseChassisInput`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/context/assetActionCreators.ts:233 - `InstallModuleInput`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/context/assetActionCreators.ts:494 - `StartCrowdfundInput`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/context/GameState.tsx:40 - `GameStore`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/context/useRivalBandDispatchActions.ts:25 - `UseRivalBandDispatchActionsProps`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/context/useMinigameDispatchActions.ts:19 - `MinigameDispatchActions`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/context/useAssetDispatchActions.ts:27 - `AssetDispatchActions`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/context/reducers/sceneReducer.ts:13 - `isValidGamePhase`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/context/reducers/bandReducer.ts:84 - `handleUpdateBand`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/context/reducers/bandReducer.ts:230 - `handleUnlockTrait`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/context/reducers/bandReducer.ts:266 - `handleConsumeItem`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/context/reducers/bandReducer.ts:665 - `handleToggleNeuroDecimator`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/context/reducers/clinicReducer.ts:34 - `MemberUpdaterResult`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/context/reducers/clinicReducer.ts:43 - `findBandMember`
  - **Description**: Appears intended for use (has docs). (Internal component/util).
  - **Recommendation**: DELETE as it is an unintegrated internal item.

## 3. INCONSISTENCIES

- **[HIGH]** /app/public/locales/de/ui.json (and EN)
  - **Description**: Missing i18n keys or mismatches between EN and DE locale files (based on diff). This violates the domain invariants for internationalization.
  - **Recommendation**: FIX: Re-sync EN and DE UI locale files to ensure all keys match.

- **[HIGH]** /app/src/context/reducers/clinicReducer.ts:44
  - **Description**: Arithmetic-then-clamp path `clampMemberMood(prevMood + moodGain)` lacks `finiteNumberOr` wrapper on the addends, violating state payload safety.
  - **Recommendation**: FIX: Wrap persisted values with `finiteNumberOr(value, fallback)` before arithmetic and clamping.

- **[HIGH]** /app/src/utils/gameState/delta.ts:51
  - **Description**: Arithmetic-then-clamp path `clampMemberMood(currentMood + moodChange)` lacks `finiteNumberOr` wrapper.
  - **Recommendation**: FIX: Apply `finiteNumberOr(currentMood, 0)`.

- **[MED]** /app/src/utils/questProgress.ts:429
  - **Description**: Re-implemented numeric narrowing `typeof context.loyalty === 'number' ? context.loyalty : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /app/src/utils/questProgress.ts:431
  - **Description**: Re-implemented numeric narrowing `typeof context.condition === 'number' ? context.condition : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /app/src/utils/questProgress.ts:434
  - **Description**: Re-implemented numeric narrowing `typeof context.harmony === 'number' ? context.harmony : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /app/src/utils/audio/midiPlayback.ts:567
  - **Description**: Re-implemented numeric narrowing `typeof midiRec.duration === 'number' ? midiRec.duration : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /app/src/utils/economy/gigLogic/calculators/calculateMerchIncome.ts:72
  - **Description**: Re-implemented numeric narrowing `typeof context.loyalty === 'number' ? context.loyalty : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /app/src/utils/hecklerLogic.ts:136
  - **Description**: Re-implemented numeric narrowing `typeof stats.combo === 'number' ? stats.combo : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /app/src/utils/unlockCheck.ts:65
  - **Description**: Re-implemented numeric narrowing `typeof gigStats.accuracy === 'number' ? gigStats.accuracy : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /app/src/utils/unlockCheck.ts:66
  - **Description**: Re-implemented numeric narrowing `typeof gigStats.misses === 'number' ? gigStats.misses : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /app/src/utils/unlockCheck.ts:69
  - **Description**: Re-implemented numeric narrowing `typeof gigStats.maxCombo === 'number' ? gigStats.maxCombo : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /app/src/utils/unlockCheck.ts:135
  - **Description**: Re-implemented numeric narrowing `typeof ctx.gearCount === 'number' ? ctx.gearCount : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[LOW]** /app/src/components/stage/stageRenderUtils.ts:308
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/components/stage/pixiAppTeardown.ts:38
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/components/overworld/utils.ts:24
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/components/postGig/SocialOptionButton.tsx:73
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/scenes/Overworld.tsx:112
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/scenes/PostGig.tsx:113
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/unlockCheck.ts:99
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/unlockCheck.ts:110
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/unlockCheck.ts:136
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/unlockCheck.ts:147
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/unlockCheck.ts:148
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/unlockCheck.ts:149
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/unlockCheck.ts:158
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/unlockCheck.ts:168
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/unlockCheck.ts:175
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/purchaseLogicUtils.ts:310
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/purchaseLogicUtils.ts:346
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/purchaseLogicUtils.ts:355
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/purchaseLogicUtils.ts:717
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/dailyTickLogic.ts:37
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/dailyTickLogic.ts:38
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/dailyTickLogic.ts:137
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/dailyTickLogic.ts:175
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/dailyTickLogic.ts:196
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/dailyTickLogic.ts:204
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/dailyTickLogic.ts:214
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/dailyTickLogic.ts:218
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/dailyTickLogic.ts:222
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/dailyTickLogic.ts:227
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/dailyTickLogic.ts:276
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/dailyTickLogic.ts:368
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/socialEngine.ts:487
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/eventEngine/resolveChoice.ts:70
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/eventEngine/eventSelection.ts:231
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/eventEngine/eventSelection.ts:232
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/economy/gigLogic/calculators/calculateTicketIncome.ts:69
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/economy/gigLogic/calculators/calculateTicketIncome.ts:92
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/audio/gigPhysics.ts:85
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/audio/assets.ts:126
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/audio/songSequencer.ts:22
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/audio/songSequencer.ts:25
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/audio/songSequencer.ts:28
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/audio/songSequencer.ts:29
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/audio/songSequencer.ts:32
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/utils/audio/songSequencer.ts:36
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/data/postOptions.ts:43
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/data/postOptions.ts:209
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/data/postOptions.ts:231
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/data/postOptions.ts:254
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/data/postOptions.ts:255
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/data/songs.ts:81
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/data/songs.ts:122
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/data/events/consequences.ts:87
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/data/events/consequences.ts:88
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/data/events/consequences.ts:135
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/data/events/consequences.ts:206
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/ui/shared/BrutalistUI.tsx:423
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/ui/bandhq/hooks/usePurchaseLogic.ts:379
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/ui/bandhq/hooks/usePurchaseLogic.ts:380
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/ui/bandhq/hooks/usePurchaseLogic.ts:505
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/ui/bandhq/detailedStats/components/SocialReachSection.tsx:85
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/actionCreators.ts:625
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/actionCreators.ts:626
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/actionCreators.ts:852
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/actionCreators.ts:859
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/actionCreators.ts:864
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/actionCreators.ts:941
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/actionCreators.ts:945
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/tradeReducer.ts:74
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/gigReducer.ts:274
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/gigReducer.ts:286
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/gigReducer.ts:294
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/gigReducer.ts:392
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/gigReducer.ts:401
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/gigReducer.ts:411
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/gigReducer.ts:422
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:228
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:232
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:237
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:321
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:324
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:344
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:576
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:577
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:578
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:670
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:671
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:672
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0`.

## 4. DEAD / UNREACHABLE CODE

*(No statically determinable unreachable switch cases or `if (false)` blocks found during this pass.)*

## 5. MISSING INTEGRATION

Several handler hooks and logic modules exist but are not connected to any caller. The most prominent missing integrations are:
- `useContinueHandler` (in `src/hooks/postGig/handlers/useContinueHandler.ts`) and its exported functions (`dispatchEconomyQuests`, `applyNeurotoxicPenalty`, etc.). These look like complete Post-Gig continue handlers but are never used by the post-gig UI.
- `useSocialPostHandler` and `useDealHandlers` (in `src/hooks/postGig/handlers/`) are completely unimported.
- Overworld and BandHQ Modals like `DarkWebLeakModal`, `SupplyStopModal`, `GeneratedImagePanel` are exported but never mounted in the component tree.
- `useBandHQLogic` and `usePurchaseLock` are unintegrated in BandHQ components.
- `StartCrowdfundInput` and `PurchaseChassisInput` in `assetActionCreators.ts` are unused, suggesting Crowdfunding and Chassis purchasing flows are partially unintegrated or using inline types instead of these shared contracts.

- **Recommendation**: INTEGRATE these hooks into their respective components (e.g., wire `useContinueHandler` into `PostGig.tsx`), or mount the missing Modals in the global modal provider.
