# AGENTS.md — `src/scenes/`

Scope: Applies to all files in `src/scenes/`.

## Purpose

Scenes are route-level game screens selected by `currentScene` in `App.jsx`:

- `INTRO` → `IntroVideo.jsx`
- `MENU` → `MainMenu.jsx`
- `SETTINGS` → `Settings.jsx`
- `CREDITS` → `Credits.jsx`
- `GAMEOVER` → `GameOver.jsx`
- `OVERWORLD` → `Overworld.jsx`
- `PREGIG` → `PreGig.jsx`
- `GIG` → `Gig.jsx`
- `POSTGIG` → `PostGig.jsx`

## Code-Aligned Gameflow Contracts

1. Intro/menu chain must remain stable (`INTRO` handoff to `MENU`).
2. Overworld drives travel/map interactions and can route to `PREGIG` / `GAMEOVER` based on state.
3. Gig pipeline must remain coherent: `PREGIG` → `GIG` → `POSTGIG` with stats persistence.
4. Post-gig resolution must support both continuation (`OVERWORLD`) and fail outcomes (`GAMEOVER`).
5. Global overlays are controlled by `App.jsx`; scenes should not duplicate global overlay responsibility.

## Editing Rules

1. Keep scenes focused on composition/orchestration, not low-level engine logic.
2. Route reusable UI to `src/ui/` and Pixi/runtime rendering to `src/components/`.
3. Use context actions (`changeScene`, update helpers, action creators) for global mutations.
4. Preserve keyboard/accessibility behavior for scene-level actions and buttons.

## Validation & Test Targets

When scene behavior changes, verify related flow tests (not exhaustive):

- `tests/goldenPath.test.js`
- hook tests that drive scene transitions (`tests/useRhythmGameLogic.test.js`, `tests/useTravelLogic.test.js`)

Then run:

```bash
npm run lint
npm run test
npm run build
```

_Last updated: 2026-02-23._
