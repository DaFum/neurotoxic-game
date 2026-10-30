# TSDoc Refactoring Ledger
| Date (YYYY-MM-DD) | File Path | Entities Documented |
| :--- | :--- | :--- |
| 2026-09-12 | src/hooks/travel/actions/useGetLocationName.ts | useGetLocationName |
| 2026-09-11 | src/components/stage/stageRenderUtils.ts | getPixiColorFromToken, calculateNoteY, _getCachedTexture, _hasFileExtension |
| 2026-09-13 | src/hooks/travel/actions/useHandleTravel.ts | UseHandleTravelParams, useHandleTravel |
| 2026-09-18 | src/components/assets/CrowdfundSetupModal.tsx | CrowdfundSetupModal |
| 2026-09-21 | src/utils/travelSoftlockUtils.ts | getSellableAssets, getPostSaleScenarios |
| 2026-09-23 | src/utils/gigVisualStatus.ts | GigVisualStatus, deriveGigVisualStatus |
| 2026-09-24 | src/context/reducers/crewReducer.ts | handleRecordExpeditionCrewStressSource, handleRecordExpeditionRelationshipOutcome, handleAdvanceExpeditionCrewInjury, handleAdvanceExpeditionBandInjury, handleCreateContactIntelGrant, applyResolvedCrewEventOutcome |
| 2026-09-29 | src/components/stage/TourbusObstacleManager.ts | TourbusRenderState, TourbusObstacleManager |
| 2026-10-02 | src/context/expeditionActionCreators.ts | recordExpeditionObligationSignal, doubleDownExpeditionObligation, offerExpeditionDraft, selectExpeditionDraft, resolveExpeditionSocialResult, createSocialIntelGrant, recordExpeditionCrewStressSource, recordExpeditionRelationshipOutcome, advanceExpeditionCrewInjury, advanceExpeditionBandInjury, createContactIntelGrant |
| 2026-10-03 | src/utils/eventEngine/filterEvents.ts | filterEvents |
| 2026-10-04 | src/utils/objectUtils.ts | copySafePrimitiveObject |
| 2026-10-06 | src/components/stage/CrowdTextureManager.ts | CrowdTextures, CrowdTextureManager |
| 2026-10-07 | src/context/useCareerDispatchActions.ts | CareerDispatchActions, useCareerDispatchActions |
| 2026-10-07 | src/components/assets/sectionTabs.ts | TabIcon, AssetSectionTab, ASSET_SECTION_TABS, ASSET_SECTION_TABS_MAP |
| 2026-10-12 | src/context/reducers/careerReducer.ts | handleSettleExpeditionCrewCareer, handleAcquireExpeditionCrewSignature |
| 2026-10-14 | src/utils/mapGenerator/types.ts | MapConnection, GeneratedMapNode, MapGeneratorState, VenuePools |
| 2026-10-15 | src/components/assets/ForeclosureModal.tsx | Props, ForeclosureModal |
| 2026-10-17 | src/context/reducers/expeditionReducer.ts | handleRecordExpeditionObligationSignal, handleDoubleDownExpeditionObligation, handleOfferExpeditionDraft, handleSelectExpeditionDraft, handleResolveExpeditionSocialResult, handleCreateSocialIntelGrant |
| 2026-10-18 | src/data/craftingRecipes.ts | CraftingRecipe |
| 2026-10-19 | src/data/expedition/contracts.ts | MAX_NATIVE_EXPEDITION_CONTRACTS, EXPEDITION_CONTRACTS_BY_ID |

## 2026-10-20 - [src/data/expedition/crew.ts]

**Learning:** Documented EXPEDITION_CREW, EXPEDITION_CREW_BY_ID
**Action:** Kept constants properly typed using const assertions and explicit typing for dictionary lookups while adding semantic TSDoc documentation for their purpose and optimizations.
| 2026-10-23 | src/data/expedition/crewSignatureTraits.ts | EXPEDITION_CREW_SIGNATURE_BY_ROLE |
| 2026-10-25 | src/context/GameState.tsx | useRequiredContext, replaceState, isShallowEqual, useGameSelector |
| 2026-10-25 | src/App.tsx | SCENES_WITHOUT_HUD, parseBooleanEnvFlag, VERCEL_TELEMETRY_ENABLED |
| 2026-10-26 | src/utils/brandOfferFlavor/hooks.ts | pickContextualHook |
| 2026-10-30 | src/utils/rhythmGameLoopUtils.ts | finalizeGig |
