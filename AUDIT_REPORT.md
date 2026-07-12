# Neurotoxic Codebase Audit Report

Generated on: 2026-07-12

## 1. DUPLICATES

### Exact Duplicates & Near Duplicates

- **Severity: HIGH** | `src/components/assets/assetsHub.css:78` & `src/components/assets/assetsHub.css:255`
  - **Description**: Duplicate CSS blocks for asset hub styling.
  - **Action**: MERGE common styles into a shared class.

- **Severity: HIGH** | `src/components/hud/GigControlsCluster.tsx:72` & `src/ui/HUD.tsx:107`
  - **Description**: Near identical React component logic for Gig controls.
  - **Action**: MERGE into `GigControlsCluster` and import in `HUD`.

- **Severity: MED** | `src/data/events/band.ts:380` & `src/data/events/relationshipEvents.ts:204`
  - **Description**: Duplicate event data structures.
  - **Action**: FIX by deduplicating and sharing the event definition.

- **Severity: MED** | `src/data/postOptions.ts:549` & `src/data/postOptions.ts:1114`
  - **Description**: Duplicate post options configuration.
  - **Action**: DELETE one and reference the other.

- **Severity: MED** | `src/data/questRegistry.ts:2` & `src/data/questRegistry.ts:40`
  - **Description**: Duplicate quest registry logic/data.
  - **Action**: MERGE entries.

- **Severity: MED** | `src/hooks/minigames/useAmpLogic.ts:38` & `src/hooks/minigames/useAmpLogic.ts:497`
  - **Description**: Duplicate hook logic within the same file.
  - **Action**: MERGE into a shared internal helper.

- **Severity: MED** | `src/utils/assetSelectors/moduleUnlock.ts:112` & `src/utils/assetSelectors/moduleUnlock.ts:196`
  - **Description**: Duplicate module unlock checks.
  - **Action**: MERGE into a shared utility function.

## 2. ORPHANED / UNINTEGRATED CODE

- **Severity: MED** | `src/hooks/useAudioControl.ts:24`
  - **Description**: Export `executeAudioAction` is not used anywhere else in `src/`. It appears to be a public API surface for audio manipulation that was built but hasn't been integrated yet into any components. It lacks specific test files for this integration.
  - **Action**: INTEGRATE into components requiring manual audio control.

- **Severity: MED** | `src/hooks/useAudioControl.ts:53`
  - **Description**: Export `createAudioHandlers` is not used anywhere else in `src/`. Similar to `executeAudioAction`, it seems like an intended public API for binding audio events to UI elements.
  - **Action**: INTEGRATE into UI components.

- **Severity: LOW** | `src/utils/travelUtils.ts:68`
  - **Description**: Export `resolveVenue` is not used anywhere else in `src/`. It looks like an unused helper function, likely a remnant of refactoring map travel logic. No obvious missing call sites. Clear orphan.
  - **Action**: DELETE as a clear orphan.

- **Severity: LOW** | `src/utils/rhythmGameLoopUtils.ts:42`
  - **Description**: Export `handleOverlayResume` is not used anywhere else in `src/`. This looks like a partially built feature intended for use when pausing/resuming the game loop via overlays, but never integrated. Missing call site in overlay logic.
  - **Action**: INTEGRATE into overlay UI or DELETE if overlay pausing was scrapped.

- **Severity: LOW** | `src/utils/rhythmGameLoopUtils.ts:122`
  - **Description**: Export `processToxicMode` is not used anywhere else in `src/`. The name implies a game mechanic that was developed but not wired into the main loop. Lack of imports suggests it's an unintegrated feature.
  - **Action**: INTEGRATE into the `RhythmGameLoop` if the feature is desired.

- **Severity: MED** | `src/domain/questEffects.ts:86`
  - **Description**: Export `getBrandReputationKey` is not used anywhere else in `src/`. It appears to be an internal utility for quest effects that was exported but never needed externally. Clear orphan.
  - **Action**: DELETE the export keyword if used internally, otherwise DELETE the function.

- **Severity: MED** | `src/components/stage/ToxicFilterManager.ts:69`
  - **Description**: Export `BrutalistFilter` is not used anywhere else in `src/`. It seems like a specific visual effect intended for the stage but never applied. No obvious call site. Unintegrated code.
  - **Action**: DELETE if abandoned, or INTEGRATE into stage effects list.

## 3. INCONSISTENCIES

- **Severity: HIGH** | `src/context/reducers/clinicReducer.ts` vs `src/context/reducers/systemReducer.ts`
  - **Description**: Clamps for member stats (`clampMemberMood`, `clampMemberStamina`) are applied inconsistently or implemented differently across multiple reducers.
  - **Action**: FIX by ensuring `finiteNumberOr` is always used before arithmetic, and clamp functions are always applied on the final result across all reducers as per `AGENTS.md` rules.

- **Severity: MED** | `src/context/reducers/socialReducer.ts`
  - **Description**: Uses `||` operator instead of `??` for fallbacks on potentially valid falsy values like `0`.
  - **Action**: FIX by switching to `??` where appropriate to adhere to `AGENTS.md`.

## 4. DEAD / UNREACHABLE CODE

- **Severity: LOW** | `src/hooks/usePreGigLogic.ts:56`
  - **Description**: `PreGigLogicReturn` type is exported but never used outside the file. It's an unreachable type definition.
  - **Action**: DELETE export.

- **Severity: LOW** | `src/hooks/usePostGigHandlers.ts:17`
  - **Description**: `UsePostGigHandlersReturn` type is exported but never used outside the file. Unreachable type.
  - **Action**: DELETE export.

- **Severity: LOW** | `src/utils/brandDealI18n.ts:16`
  - **Description**: `BrandDealDisplay` type is exported but never used anywhere. Dead code.
  - **Action**: DELETE export.

## 5. MISSING INTEGRATION

- **Severity: HIGH** | `src/scenes/kabelsalat/components/HardwareProps.tsx:43`
  - **Description**: Component `RackScrew` is exported but not imported anywhere.
  - **Action**: INTEGRATE into the main `Kabelsalat` scene UI or DELETE if decorative elements were scrapped.

- **Severity: HIGH** | `src/ui/shared/KeyboardShortcuts.tsx:6`
  - **Description**: `SHORTCUTS` is exported but never wired into a global event listener or UI overlay.
  - **Action**: INTEGRATE by connecting to `useEffect` global listener in `App.tsx` or `HUD.tsx`.

