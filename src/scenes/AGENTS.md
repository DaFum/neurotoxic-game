# AGENTS.md — `src/scenes/`

Scope: Applies to all files in `src/scenes/`.

## Purpose

Scenes are route-level game screens selected by `currentScene` in `App.jsx`:

- `INTRO` → `IntroVideo.jsx`
- `MENU` → `MainMenu.jsx`
- `SETTINGS` → `Settings.jsx`
- `CREDITS` → `Credits.jsx`
- `GAMEOVER` → `GameOver.jsx`
- `OVERWORLD` → `TourbusScene.jsx` (`TRAVEL_MINIGAME`)
- `PREGIG` → `RoadieRunScene.jsx` (`PRE_GIG_MINIGAME`) → `Gig.jsx`
- **New Types**: `OVERWORLD` map now supports `FESTIVAL` and `FINALE` icons/performance logic.
- **Direct Flow**: `TRAVEL_MINIGAME` routes directly to `PREGIG` for performance nodes via `useArrivalLogic`.

## Code-Aligned Gameflow Contracts

1. Intro/menu chain must remain stable (`INTRO` handoff to `MENU`).
2. Overworld map travel triggers `TRAVEL_MINIGAME` (`TourbusScene`) before resolving arrival logic in `Overworld`.
3. Gig pipeline must remain coherent: `PREGIG` → `PRE_GIG_MINIGAME` (Roadie Run) → `GIG` → `POSTGIG`.
4. Post-gig resolution must support both continuation (`OVERWORLD`) and fail outcomes (`GAMEOVER`).
5. Global overlays are controlled by `App.jsx`; scenes should not duplicate global overlay responsibility.
6. **Modifier cost source of truth**: `PreGig.jsx` imports modifier costs from `MODIFIER_COSTS` in `economyEngine.js`. Never re-declare cost values inline in scene files; both the UI preview and the PostGig expense calculation must use the same constant.
7. **`gigModifiers` reset**: the `START_GIG` reducer case resets `gigModifiers` to `DEFAULT_GIG_MODIFIERS` — modifier selections from the previous gig must not carry forward into `PreGig`.

## Editing Rules

1. Keep scenes focused on composition/orchestration, not low-level engine logic.
2. Route reusable UI to `src/ui/` and Pixi/runtime rendering to `src/components/`.
3. Use context actions (`changeScene`, update helpers, action creators) for global mutations.
4. Preserve keyboard/accessibility behavior for scene-level actions and buttons.

## Validation & Test Targets

When scene behavior changes, verify related flow tests (not exhaustive):

- `tests/goldenPath.test.js`
- hook tests that drive scene transitions (`tests/useRhythmGameLogic.test.js`, `tests/useTravelLogic.test.js`)
- Minigame transitions: `tests/useArrivalLogic.test.js` (covers `TRAVEL_MINIGAME`), `tests/minigameState.test.js` (logic), and `tests/gameReducer.test.js`.

Then run:

```bash
npm run lint
npm run test
npm run build
```

_Last updated: 2026-02-23._
