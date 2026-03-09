# Missing Tests — Codebase Inventory

This inventory lists source files with **no direct test coverage target** (no matching `*.test.js|jsx` name and no explicit source import/path reference in existing test files).

## Method

- Compared all files under `src/**/*.js` and `src/**/*.jsx` against test files in `tests/**/*.test.js|jsx|mjs`.
- Marked a source file as covered if either:
  - a test filename contains the source filename stem, or
  - a test file text references the source path/import.
- Everything else is currently considered missing test coverage and listed below.

## Missing test targets (21)

### Stage / rendering core

- `src/components/stage/BaseStageController.js`

### Context / reducers

- `src/context/reducers/sceneReducer.js`

### Data modules

- `src/data/brandDeals.js`
- `src/data/events/consequences.js`
- `src/data/events/financial.js`
- `src/data/events/relationshipEvents.js`
- `src/data/events/special.js`

### Rhythm game hooks

- `src/hooks/rhythmGame/useRhythmGameAudio.js`
- `src/hooks/rhythmGame/useRhythmGameLoop.js`
- `src/hooks/rhythmGame/useRhythmGameState.js`

### Scene components

- `src/scenes/KabelsalatScene.jsx`
- `src/scenes/Overworld.jsx`
- `src/scenes/TourbusScene.jsx`

### UI components

- `src/ui/DebugLogViewer.jsx`
- `src/ui/GigModifierButton.jsx`
- `src/ui/bandhq/SettingsTab.jsx`
- `src/ui/bandhq/ShopItem.jsx`
- `src/ui/bandhq/ShopTab.jsx`
- `src/ui/bandhq/UpgradesTab.jsx`
- `src/ui/shared/Icons.jsx`
- `src/ui/shared/propTypes.js`

## Notes

- This is a file-level inventory (not branch/line-level coverage).
- Existing branch-level missing behavior tracking for PostGig remains in `tests/PostGig.missing-tests.md`.
