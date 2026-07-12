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

- **Severity: MED** | `src/utils/assetSelectors/moduleUnlock.ts:112` & `src/utils/assetSelectors/moduleUnlock.ts:196`
  - **Description**: Duplicate module unlock checks.
  - **Action**: MERGE into a shared utility function.

## 2. ORPHANED / UNINTEGRATED CODE

- **Severity: LOW** | `src/utils/rhythmGameLoopUtils.ts:42`
  - **Description**: Export `handleOverlayResume` is not used anywhere else in `src/`. This looks like a partially built feature intended for use when pausing/resuming the game loop via overlays, but never integrated. Missing call site in overlay logic.
  - **Action**: INTEGRATE into overlay UI or DELETE if overlay pausing was scrapped.

- **Severity: LOW** | `src/utils/rhythmGameLoopUtils.ts:122`
  - **Description**: Export `processToxicMode` is not used anywhere else in `src/`. The name implies a game mechanic that was developed but not wired into the main loop. Lack of imports suggests it's an unintegrated feature.
  - **Action**: INTEGRATE into the `RhythmGameLoop` if the feature is desired.

- **Severity: MED** | `src/domain/questEffects.ts:86`
  - **Description**: Export `getBrandReputationKey` is not used anywhere else in `src/`. It appears to be an internal utility for quest effects that was exported but never needed externally. Clear orphan.
  - **Action**: DELETE the export keyword if used internally, otherwise DELETE the function.

## 3. INCONSISTENCIES

- **Severity: HIGH** | `src/context/reducers/clinicReducer.ts` vs `src/context/reducers/systemReducer.ts`
  - **Description**: Clamps for member stats (`clampMemberMood`, `clampMemberStamina`) are applied inconsistently or implemented differently across multiple reducers.
  - **Action**: FIX by ensuring `finiteNumberOr` is always used before arithmetic, and clamp functions are always applied on the final result across all reducers as per `AGENTS.md` rules.

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



