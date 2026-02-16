---
name: game-improver
description: Improve gameplay, balance, and code quality. Trigger when asked to fix bugs, add features, optimize performance, or refactor code. Acts as a general-purpose game engineer.
---

# Game Improver

Implement production-ready improvements, bug fixes, and features for NEUROTOXIC.

## Workflow

1.  **Categorize the Request**
    *   **Balance**: Use `game-balancing-assistant`.
    *   **Audio**: Use `audio-debugger-ambient-vs-gig` or `webaudio-reliability-fixer`.
    *   **UI**: Use `convention-keeper-brutalist-ui`.
    *   **Core Logic**: Proceed with this skill.

2.  **Consult Standards**
    Before writing code, read the relevant reference:
    *   **General Rules**: `references/game-improver-playbook.md`
    *   **Coding Standards**: `references/implementation-standards.md`
    *   **Workflow**: `references/operational-workflows.md`
    *   **QA & Release**: `references/quality-and-release.md`

3.  **Implement Changes**
    *   **State**: Use `ActionTypes` and reducers. No direct mutation.
    *   **UI**: Brutalist design (see `convention-keeper-brutalist-ui`).
    *   **Performance**: Watch for re-renders and Pixi leaks.

4.  **Verify**
    Run `npm run lint` and `npm run test` before submitting.

## Core Constraints

*   **Stack**: React 18, Vite 5, Tailwind 4, Pixi 8.
*   **State**: `player.money` must be >= 0. `band.harmony` must be > 0.
*   **Audio**: Must handle AudioContext state (suspended/running).

## Example

**Input**: "Add a new upgrade that increases harmony recovery."

**Action**:
1.  Read `src/data/upgrades.js` to see existing structure.
2.  Add new entry: `{ id: 'meditation_pod', cost: 500, effect: 'harmony_regen' }`.
3.  Update `src/utils/economyEngine.js` or `src/hooks/useGameLoop.js` to implement the effect.
4.  Verify balance (cost vs benefit).

**Output**:
"Implemented `meditation_pod` upgrade. Added logic to `useGameLoop` to regenerate +1 harmony per day."
