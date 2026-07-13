# CATEGORIZED FINDINGS REPORT

## DUPLICATES

- **[LOW]** `src/data/postOptions.ts:551`: Duplicate post options effect logic found in same file at line 1116. **Action:** MERGE

## ORPHANED / UNINTEGRATED CODE

- **[MED]** `src/components/overworld/hooks/useOverworldUrls.ts:85`: `resetSvgTokenStyleCacheForTesting` (const) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/hooks/minigames/useAmpLogic.ts:70`: `AmpGameRefs` (interface) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/hooks/minigames/useAmpLogic.ts:89`: `AmpGameSetters` (interface) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/hooks/postGig/handlers/useContinueHandler.ts:207`: `UseContinueHandlerProps` (interface) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/hooks/postGig/handlers/useDealHandlers.ts:69`: `UseDealHandlersProps` (interface) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/hooks/postGig/handlers/useMinorHandlers.ts:13`: `UseMinorHandlersProps` (interface) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/hooks/postGig/handlers/useSocialPostHandler.ts:162`: `UseSocialPostHandlerProps` (interface) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/hooks/preGig/usePreGigDerivations.ts:17`: `UsePreGigDerivationsProps` (interface) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/hooks/preGig/usePreGigDerivations.ts:25`: `UsePreGigDerivationsReturn` (interface) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/hooks/preGig/usePreGigHandlers.ts:66`: `UsePreGigHandlersReturn` (interface) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/hooks/rhythmGame/useRhythmGameAudio.ts:212`: `RhythmGameAudioReturn` (type) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/hooks/rhythmGame/useRhythmGameInput.ts:19`: `RhythmGameInputReturn` (type) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/hooks/rhythmGame/useRhythmGameScoring.ts:52`: `RhythmGameScoringReturn` (type) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/hooks/rhythmGame/useRhythmGameState.ts:110`: `RhythmGameStateHookReturn` (type) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/hooks/useMinigameSceneLogic.ts:7`: `UseMinigameSceneLogicProps` (interface) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/hooks/usePostGigHandlers.ts:28`: `UsePostGigHandlersProps` (interface) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/ui/bandhq/hooks/useBandHQLogic.ts:29`: `BandHQLogicResult` (interface) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/ui/bandhq/hooks/usePurchaseLock.ts:6`: `PurchaseLockResult` (interface) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/data/craftingRecipes.ts:74`: `isCraftingRecipeId` (const) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/data/milestones/milestones.ts:17`: `Milestone` (interface) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.
- **[MED]** `src/data/questRegistry.ts:79`: `isQuestRegistryId` (const) is exported but NOT imported anywhere in src/. Verify if it's dead code or public API. **Action:** DELETE (if dead code) or remove export.

## INCONSISTENCIES

- **[MED]** `src/components/HecklerOverlay.tsx:38`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/components/MapNodeView.tsx:188`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/components/PixiStageController.ts:223`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/scenes/PreGig.tsx:103`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/scenes/PostGig.tsx:113`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/hooks/useMerchPress.ts:22`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/hooks/useLeaderboardSync.ts:89`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/hooks/useBloodBank.ts:22`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/hooks/usePostGigLogic.ts:123`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/hooks/useClinicLogic.ts:156`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/hooks/useForeclosureModal.ts:30`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/hooks/useGigSession.ts:90`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/hooks/useAudioControl.ts:229`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/utils/brandDealLogic.ts:215`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/utils/travelUtils.ts:175`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/utils/chartDensity.ts:77`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/utils/leaderboardUtils.ts:52`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/utils/unlockCheck.ts:100`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/utils/purchaseLogicUtils.ts:234`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/utils/rhythmUtils.ts:56`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/utils/gigModifiersUtils.ts:213`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/utils/socialEngine.ts:121`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/utils/assetTicks.ts:349`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/utils/mapGenerator.ts:437`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/utils/questProgress.ts:441`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/utils/crypto.ts:115`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/data/postOptions.ts:321`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/data/songs.ts:82`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/ui/QuestsModal.tsx:405`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)
- **[MED]** `src/ui/PirateRadioModal.tsx:136`: Uses `|| 0` or `?? 0` instead of `finiteNumberOr(value, 0)` for numeric fallback. **Action:** FIX (Use `finiteNumberOr`)

## DEAD / UNREACHABLE CODE

- No obvious permanently false conditionals (`if (false)`) found in current logic sweeps.


## MISSING INTEGRATION

- **[HIGH]** `src/types/components.d.ts:503`: Interface/Type `FinancialCategory` is exported but appears to be dead code (no imports found). **Action:** DELETE or remove export
- **[HIGH]** `src/types/components.d.ts:548`: Interface/Type `CatalogInputEffect` is exported but appears to be dead code (no imports found). **Action:** DELETE or remove export
- **[HIGH]** `src/types/components.d.ts:604`: Interface/Type `Balances` is exported but appears to be dead code (no imports found). **Action:** DELETE or remove export
- **[HIGH]** `src/types/components.d.ts:638`: Interface/Type `UnlockMessageKind` is exported but appears to be dead code (no imports found). **Action:** DELETE or remove export
- **[HIGH]** `src/components/assets/sectionRegistry.ts:19`: Component `SectionView` looks fully built but is never imported/rendered. **Action:** INTEGRATE or DELETE
- **[HIGH]** `src/components/minigames/amp/AmpCalibrationView.tsx:17`: Interface/Type `AmpCalibrationViewProps` is exported but appears to be dead code (no imports found). **Action:** DELETE or remove export
- **[HIGH]** `src/components/assets/shared/AssetSlotButton.tsx:10`: Interface/Type `AssetSlotButtonProps` is exported but appears to be dead code (no imports found). **Action:** DELETE or remove export
- **[HIGH]** `src/scenes/kabelsalat/components/ConnectionPath.tsx:11`: Interface/Type `ConnectionPathProps` is exported but appears to be dead code (no imports found). **Action:** DELETE or remove export
