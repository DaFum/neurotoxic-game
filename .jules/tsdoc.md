# TSDoc Refactoring Ledger

| Date (YYYY-MM-DD) | File Path                                     | Entities Documented                                                                                                                                      |
| :---------------- | :-------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-06        | src/context/GameState.tsx                     | GameStateProvider, useGameDispatch, useGameActions, useGameSelector                                                                                      |
| 2026-06-06        | src/hooks/usePreGigLogic.ts                   | \_\_testInternals                                                                                                                                        |
| 2026-06-06        | src/domain/questAcceptance.ts                 | getQuestKindForSlots, hasQuestSlot, getCurrentVenueScopeKey, canAcceptQuest                                                                              |
| 2026-06-08        | src/components/stage/NoteSpritePool.ts        | NoteSpriteFactory, \_getEffectiveTexture, createNoteSprite, initializeNoteSprite, acquireSpriteFromPool, destroyNoteSprite, releaseSpriteToPool, dispose |
| 2026-06-08        | src/components/stage/RoadieStageController.ts | RoadieStageState, RoadieStageController                                                                                                                  |
| 2026-06-08        | src/utils/assetSelectors/constants.ts         | NEUTRAL_ASSET_MODIFIERS, BROKEN_THRESHOLD                                                                                                                |
| 2026-06-11        | src/utils/brandOfferFlavor/helpers.ts         | pick, roundTo                                                                                                                                            |
| 2026-06-12        | src/utils/errors/safeStorage.ts               | runSafeStorageOperation                                                                                                                                  |
| 2026-06-13 | src/App.tsx | resolveVercelTelemetryEnabled, SceneLoadingFallback, App |
| 2026-06-14 | src/components/HecklerOverlay.tsx | updateOverlayNodes |
| 2026-06-15 | src/hooks/travel/useVanMaintenance.ts | useVanMaintenance |
