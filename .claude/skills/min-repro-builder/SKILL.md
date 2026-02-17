---
name: min-repro-builder
description: create minimal reproduction cases for bugs. Trigger when asked to isolate an issue, create a test case, or debug a complex interaction.
---

# Minimal Repro Builder

Isolate bugs by creating a minimal, self-contained reproduction environment.

## Workflow

1.  **Select the Canvas**
    Identify where to build the repro.
    *   **Unit Test**: `tests/repro.test.js` (for logic/state).
    *   **Component**: `src/ui/Repro.jsx` (for UI/rendering).
    *   **Scene**: `src/scenes/ReproScene.jsx` (for game loop/audio).

2.  **Minimize State**
    Start with `initialState` and strip everything not needed.
    *   *Need*: `player.money`, `audioManager`.
    *   *Don't Need*: `inventory`, `unlocks` (unless relevant).

3.  **Reuse Assets**
    Do not add new media/data files. Use existing assets where possible:
    *   `src/assets/rhythm_songs.json`
    *   `public/placeholder.png` (if exists)

4.  **Inject the Bug**
    Force the condition.
    *   *Example*: "Set `player.health = -1` on init to test death screen."

5.  **Document Usage**
    "To run the repro, import `ReproScene` in `App.jsx` and set it as the initial route."

## Example

**Input**: "The game crashes when the player has 0 fuel and tries to travel."

**Action**:
1.  Create `tests/repro_travel_crash.test.js`.
2.  Import `gameReducer`.
3.  Set up state: `fuel: 0`.
4.  Dispatch `TRAVEL` action.
5.  Assert: Should throw an error.

**Output**:
"Created `tests/repro_travel_crash.test.js`. Run with `node --test tests/repro_travel_crash.test.js`. Confirmed it throws an error."

_Skill sync: compatible with React 19.2.4 / Vite 7.3.1 baseline as of 2026-02-17._
