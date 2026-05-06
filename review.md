# Comprehensive Review Report

## Inconsistencies
*   **Duplicate File Names in Different Scopes:** Several files use identical, generic names (e.g., `constants.ts`, `utils.ts`, `index.ts`), but they are scattered across different folders like `scenes/`, `components/`, and `hooks/`. This can cause ambiguity when resolving imports and tracking domain logic. For example, `constants.ts` exists in `hooks/minigames/`, `scenes/kabelsalat/`, `utils/audio/`, and `data/events/`.
*   **Decentralized Event & Data Definitions:** Some configuration data is handled redundantly instead of using a central source of truth.

## Doubled Components / Functions
*   **SVG Icons:** In `src/ui/shared/Icons.tsx` and `src/ui/shared/BrutalistUI.tsx`, there are duplicated or functionally identical SVG icon wrappers (e.g., `SkullIcon` inside `BrutalistUI.tsx` and `VoidSkullIcon` inside `Icons.tsx`).
*   **Unused Toolkit Elements:** Many stylized "brutalist" components exist in `BrutalistUI.tsx` but remain entirely unused across the application.

## Unused but Available Functions / Components (Integration Details)

Based on a static analysis scan of all exports in the `src/` directory, several functions, action creators, and components are exported but never imported or invoked in the live game logic.

### 1. Action Creators (`src/context/actionCreators.ts`)
The following dispatch actions have been defined but are disconnected from any user interactions or logic loops:
*   `createAddContrabandAction`: Meant to add contraband to the player's stash.
    *   **Integration:** Update the `useContrabandStash` hook (or `EventResolver`) to dispatch this action when the player discovers items in the overworld or completes a successful transaction with a dealer.
*   `createCompleteQuestAction`: The reducers have logic to process quest completion, but the UI/systems never trigger it.
    *   **Integration:** Wire this to `src/hooks/useQuestsModal.ts` or `src/domain/eventResolver.ts` so that when a quest target is mathematically met, the state updates accordingly.
*   `createFailQuestsAction`: Counterpart to completing quests.
    *   **Integration:** Should be invoked in the game loop (e.g., inside `useRhythmGameLoop.ts` upon failing a critical, quest-linked gig).
*   `createUpdateNeurotoxicPedalAction`: Manipulates the band's neurotoxic pedal state.
    *   **Integration:** Bind this within the equipment or settings interfaces, likely inside `useBandHQModal.ts` or `Settings.tsx`, to allow players to actively toggle the pedal effect.

### 2. UI Components (`src/ui/shared/BrutalistUI.tsx` and `src/ui/shared/index.tsx`)
Several fully-formed stylized components are available but orphaned:
*   `BrutalFader`, `BrutalSlot`, `BrutalTabs`, `BrutalToggle`: A complete "brutalist" UI toolkit suite.
    *   **Integration:** Replace the standard generic tabs/toggles currently utilized in `SettingsPanel.tsx` and the `BandHQ` tabs (`StatsTab.tsx`, `UpgradesTab.tsx`) to unify the game's aesthetic.
*   `CrisisModal`, `ToxicChatter`, `VoidDecryptor`, `TerminalReadout`: Specialized narrative UI elements.
    *   **Integration:** Invoke these from `useEventSystem.ts` or conditionally render them in `OverworldHUD.tsx` when specific story flags trigger (e.g., dark web leaks, high neurotoxicity glitches).
*   `SelloutContract`: A specialized UI component.
    *   **Integration:** Incorporate it into `DealCard.tsx` or `NegotiationModal.tsx` for visual flair during post-gig record label negotiations.

### 3. Minigame Variables & Utilities
*   `ALLOWED_SCENES`, `BASE_SPEED`, `MAX_SPEED`, `TARGET_DISTANCE`: Exported constants that are defined but dormant.
    *   **Integration:** These constants should govern the physics and transition logic within `TourbusScene.tsx` or `RoadieRunScene.tsx`.
*   `calculateHealAmounts`: Exported utility function for health mechanics.
    *   **Integration:** This should replace inline magic numbers/calculations within `src/hooks/useClinicLogic.ts`.
*   `RhythmMatrix`, `SetlistSelector`: Unused rhythm game interface elements.
    *   **Integration:** Introduce these components into the pre-show setup phase (`Gig.tsx` / `PreGig.tsx`) to let the player visually build or observe their setlist.
