# Neurotoxic Codebase Audit: Categorized Findings

## 1. DUPLICATES

**HIGH SEVERITY**

- **Near-Duplicate Event Choices**: `src/utils/eventEngine/resolveChoice.ts` lines 111-124 and 146-157 contain near-identical logic for processing choice consequences.
  - _Recommended Action_: MERGE into a single utility function for evaluating effect bounds.
- **Quest Configuration Clones**: `src/data/quests/quest_alchemist.ts` (13-22) and `src/data/quests/quest_crisis_manager.ts` (20-29) contain duplicated structural shapes.
  - _Recommended Action_: MERGE by extracting a shared quest-node builder utility.

**MEDIUM SEVERITY**

- **Duplicate CSS Rules**: `src/components/assets/assetsHub.css` has duplicated layout rules across blocks (78:21 vs 255:17, 95:21 vs 236:27, 141:28 vs 340:44).
  - _Recommended Action_: MERGE into reusable utility classes or CSS variables.
- **Duplicate Sprite Pool Logic**: `src/components/stage/EffectSpritePool.ts` (62-74) and `src/components/stage/NoteSpritePool.ts` (200-215) share identical instance-reset logic.
  - _Recommended Action_: MERGE by abstracting a base generic `SpritePool` class.
- **Component Duplication**: `src/scenes/mainmenu/MainMenuFooter.tsx` (7-15) and `src/scenes/mainmenu/MainMenuSecondaryButtons.tsx` (19-27) duplicate the same button row structure.
  - _Recommended Action_: MERGE the UI components or pass standard button configs via props to a single component.
- **HUD Logic Duplication**: `src/ui/HUD.tsx` (188-202, 268-275) and `src/ui/overworld/OverworldHUD.tsx` (158-172, 192-199) duplicate core layout and stat-fetching logic.
  - _Recommended Action_: MERGE into a `SharedHUDComponents` module.

**LOW SEVERITY**

- **Duplicate Types**: `NoteTextures` is defined in both `src/components/stage/NoteSpritePool.ts:28` and `src/components/stage/NoteTextureManager.ts:9`.
  - _Recommended Action_: MERGE by keeping only the manager's export and importing it in the pool.
- **Duplicate Types**: `CableId` is defined in both `src/scenes/kabelsalat/kabelsalatConstants.ts:54` and `src/scenes/kabelsalat/components/ConnectionPaths.tsx:6`.
  - _Recommended Action_: MERGE into the constants file and import into components.
- **Duplicate Interfaces**: The `Props` interface is redefined across over 10 different modal components in `src/components/assets/` (e.g. `SellConfirmModal.tsx`, `RiskEventModal.tsx`, etc.).
  - _Recommended Action_: FIX by extracting a shared `BaseModalProps` or `ConfirmModalProps` into a `src/types/ui.d.ts` or similar shared file.

## 2. ORPHANED / UNINTEGRATED CODE

**HIGH SEVERITY**

- **`useTourbusLogic` Constants**: `BASE_SPEED` and `TARGET_DISTANCE` in `src/hooks/minigames/useTourbusLogic.ts` are exported but unused anywhere else.
  - _Recommended Action_: FIX by removing export modifier.
- **Overworld SVG Caching Test Util**: `__resetBaseAssetPathCache` exported from `src/utils/audio/playbackUtils.ts` is only used for tests (if at all) but exported alongside runtime code.
  - _Recommended Action_: DELETE from main exports, move to a test-specific file.

**MEDIUM SEVERITY**

- **Orphaned Types**: Types like `CalculatePostGigStateParams`, `ResolvedPostResult`, `SpinStoryMoneyUpdate` from `src/utils/postGig/index.ts` and `HandlerDispatchers`, `ProcessingGuardReturn` from `src/hooks/postGig/handlers/index.ts` are exported but unused outside their index file.
  - _Recommended Action_: FIX by removing the `export` keyword if they are purely internal, or moving them to a `.d.ts` file if they are meant to be public APIs.
- **BandHQ Detailed Stats Types**: `CharacterDefinition`, `PlayerData`, `SocialData` etc in `src/ui/bandhq/detailedStats/index.ts` are exported but unused.
  - _Recommended Action_: FIX by removing the export or using them to type the props of the components correctly.

## 3. INCONSISTENCIES

**HIGH SEVERITY**

- **Action Type Usage**: The codebase uses both `ActionTypes.XXX` enum access and string literals (e.g., in reducers checking `case 'ADVANCE_DAY':` vs `case ActionTypes.ADVANCE_DAY:`).
  - _Recommended Action_: FIX by standardizing strictly on the `ActionTypes` enum values as mandated by TypeScript strictness rules.

**MEDIUM SEVERITY**

- **Locale Files Structure**: While we couldn't run a full parser, manual inspection implies that i18n keys are sometimes hardcoded instead of using the `t('key')` function properly, based on memory guidelines.
  - _Recommended Action_: FIX by ensuring all user-facing text goes through the translation function.
- **State Updates**: Some action creators validate parameters, but reducers don't consistently re-validate, creating a risk if state updates are called directly.
  - _Recommended Action_: FIX by ensuring reducers enforce the final bounds (e.g. `Math.max(0, ...)` for money).
- **Missing TSDoc**: Many interfaces do not use TSDoc properly as per the style guidelines `@remarks` / `@returns` without types.
  - _Recommended Action_: FIX by adding proper TSDoc tags.

## 4. DEAD / UNREACHABLE CODE

**HIGH SEVERITY**

- **Testing DB In Main Code**: `_CONTRABAND_DB_FOR_TESTING` in `src/data/contraband.ts` is exported purely for testing and pollutes production bundles.
  - _Recommended Action_: DELETE or move to tests.

**MEDIUM SEVERITY**

- **Legacy Event Engine Shapes**: The `EngineGameState` and `TemplateContext` in `src/utils/eventEngine/index.ts` seem largely unintegrated with the modern React context-driven game loop, though occasionally cast via `unknown`.
  - _Recommended Action_: FIX by refactoring to use the standard Redux-like context state instead of parallel models.

## 5. MISSING INTEGRATION

**HIGH SEVERITY**

- **Asset Foreclosure Loop**: While asset foreclosure via zero-condition is integrated with `ADVANCE_DAY`, loan/payment delinquency logic and `ActionTypes.DISMISS_FORECLOSURE_NOTICE` remain unintegrated.
  - _Recommended Action_: INTEGRATE a check for missing payments into the `advanceDay` or post-gig logic to trigger foreclosure, and integrate the dismiss action to allow the user to clear notices.
- **Risk Events**: `ActionTypes.SET_PENDING_RISK_EVENT` exists in the reducer, and a `RiskEventModal` exists in `src/components/assets/`, but the trigger to actually roll for and apply a risk event to an asset seems unintegrated into the main loop.
  - _Recommended Action_: INTEGRATE into the `advanceDay` or `processCrowdfundTick` / post-gig logic.
