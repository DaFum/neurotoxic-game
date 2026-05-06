# Comprehensive Review Report

## Introduction
This report was generated using a custom static analysis script leveraging Python and `grep` across the `src/` directory.
*   **Scope:** Analyzed all `.ts` and `.tsx` files in `src/` for duplicated filenames, unused exported variables/functions/components, and functionally identical elements.
*   **Limitations:** The static analysis cannot detect dynamic imports, runtime reflections, or implicit React component dependencies. False positives may occur if a function is used indirectly.
*   **When to Regenerate:** Run this analysis before major architectural refactoring or release cycles.
*   **Interpretation:** Findings are high-confidence for missing static imports, but integration suggestions should be manually verified against current business logic.

## Inconsistencies
*   **Duplicate File Names in Different Scopes:** Several files use identical, generic names (e.g., `constants.ts`, `utils.ts`, `index.ts`), but they are scattered across different folders like `scenes/`, `components/`, and `hooks/`. This can cause ambiguity when resolving imports and tracking domain logic. For example, `constants.ts` exists in `hooks/minigames/`, `scenes/kabelsalat/`, `utils/audio/`, and `data/events/`.
*   **Decentralized Event & Data Definitions:** Some configuration data is handled redundantly instead of using a central source of truth.
    *   *Example:* Game event definitions (`specialEvents`, `financialEvents`, `crisisEvents`) are fragmented across multiple files in `src/data/events/` and sometimes redefined or shadowed inside `src/domain/eventResolver.ts`.
    *   *Recommendation:* Consolidate event definitions into a single `events.data.ts` or explicitly map them via an `index.ts` export registry to prevent desyncs.

## Doubled Components / Functions
*   **SVG Icons:** In `src/ui/shared/Icons.tsx` and `src/ui/shared/BrutalistUI.tsx`, there are components with identical semantic themes (e.g., `SkullIcon` and `VoidSkullIcon`), though they differ in animation behavior. `VoidSkullIcon` includes SVG animations while `SkullIcon` is a static decoration.
*   **Unused Toolkit Elements:** Many stylized "brutalist" components exist in `BrutalistUI.tsx` but remain entirely unused across the application.

## Unused but Available Functions / Components (Integration Details)

Based on a static analysis scan of all exports in the `src/` directory, several functions, action creators, and components are exported but never imported or invoked in the live game logic.

### 1. Action Creators (`src/context/actionCreators.ts`)
The following dispatch actions have been defined but are disconnected from any user interactions or logic loops:
*   **[High]** `createAddContrabandAction`: Meant to add contraband to the player's stash.
    *   **Integration:** Update the `useContrabandStash` hook (or `EventResolver`) to dispatch this action when the player discovers items in the overworld or completes a successful transaction with a dealer.
*   **[Critical]** `createCompleteQuestAction`: The reducers have logic to process quest completion, but the UI/systems never trigger it.
    *   **Integration:** Wire this to `src/domain/eventResolver.ts` or a dedicated quest management hook so that when a quest target is mathematically met, the state updates accordingly.
*   **[Critical]** `createFailQuestsAction`: Counterpart to completing quests.
    *   **Integration:** Should be invoked in the game loop (e.g., inside `useRhythmGameLoop.ts` upon failing a critical, quest-linked gig).
*   **[Medium]** `createUpdateNeurotoxicPedalAction`: Manipulates the band's neurotoxic pedal state.
    *   **Integration:** Bind this within the equipment or settings interfaces, likely inside `useBandHQModal.ts` or `Settings.tsx`, to allow players to actively toggle the pedal effect.

### 2. UI Components (`src/ui/shared/BrutalistUI.tsx` and `src/ui/shared/index.tsx`)
Several fully-formed stylized components are available but orphaned:
*   **[Low]** `BrutalFader`, `BrutalSlot`, `BrutalTabs`, `BrutalToggle`: A complete "brutalist" UI toolkit suite.
    *   **Integration:** Replace the standard generic tabs/toggles currently utilized in `SettingsPanel.tsx` and the `BandHQ` tabs (`StatsTab.tsx`, `UpgradesTab.tsx`) to unify the game's aesthetic.
*   **[Medium]** `CrisisModal`, `ToxicChatter`, `VoidDecryptor`, `TerminalReadout`: Specialized narrative UI elements.
    *   **Integration:** Invoke these from `useEventSystem.ts` or conditionally render them in `OverworldHUD.tsx` when specific story flags trigger (e.g., dark web leaks, high neurotoxicity glitches).
*   **[Low]** `SelloutContract`: A specialized UI component.
    *   **Integration:** Incorporate it into `DealCard.tsx` or `NegotiationModal.tsx` for visual flair during post-gig record label negotiations.

### 3. Minigame Variables & Utilities
*   **[High]** `ALLOWED_SCENES`, `BASE_SPEED`, `MAX_SPEED`, `TARGET_DISTANCE`: Exported constants that are defined but dormant in some modules, though currently actively used within `useTourbusLogic.ts`.
    *   **Integration:** Consolidate these exports so that files do not duplicate dormant definitions vs active ones.
*   **[Medium]** `calculateHealAmounts`: Exported utility function for health mechanics.
    *   **Integration:** This should replace the static constants currently utilized within `src/hooks/useClinicLogic.ts` to allow for dynamic scaling of heal amounts.
*   **[Low]** `RhythmMatrix`, `SetlistSelector`: Unused rhythm game interface elements.
    *   **Integration:** Introduce these components into the pre-show setup phase (`Gig.tsx` / `PreGig.tsx`) to let the player visually build or observe their setlist.

## Recommended Next Steps
1.  **Critical:** Integrate the core gameplay loops by wiring `createCompleteQuestAction` and `createFailQuestsAction`.
2.  **High:** Unify event definitions (`src/data/events/`) into a central registry and resolve minigame variable exports (`useTourbusLogic.ts`).
3.  **Medium:** Add dynamic logic to the clinic using `calculateHealAmounts` and integrate narrative UI modals like `CrisisModal`.
4.  **Low:** Replace generic UI elements in Settings and BandHQ with the unused Brutalist UI elements (`BrutalTabs`, `BrutalToggle`).

## References
*   `src/context/actionCreators.ts`
*   `src/ui/shared/BrutalistUI.tsx`
*   `src/hooks/useClinicLogic.ts`
*   `src/data/events/` (multiple files)
*   `src/domain/eventResolver.ts`

*Last Updated: 2026-05-06*
