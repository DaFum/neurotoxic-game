# Architecture Review — 2026-05-01

## Scope

Static review for inconsistencies, doubled components/functions, and exported-but-not-integrated logic across `src/**`.

## Findings

### 1) Scene guard constant is now integrated

- `ALLOWED_SCENES` currently lives in `src/context/reducers/sceneReducer.ts` and is used by `handleChangeScene` validation.
- Follow-up recommendation:
  - Keep `ALLOWED_SCENES` as the reducer-level source of truth for phase validity checks.
  - Keep bidirectional set-alignment coverage in `tests/context/reducers/sceneReducer.test.js` so `GAME_PHASES` and `ALLOWED_SCENES` stay equivalent during future additions.

### 2) Potentially doubled overlay concept

- Distinct game-over overlays now exist by design:
  - `src/components/hud/GameOverOverlay.tsx` (global gig HUD overlay)
  - `src/scenes/kabelsalat/components/overlays/KabelsalatGameOverOverlay.tsx` (Kabelsalat minigame overlay)
- Risk remains: parallel implementations can still diverge in copy or accessibility behavior.
- Integration recommendation:
  - Keep naming explicit (`GameOverOverlay` vs `KabelsalatGameOverOverlay`) to preserve ownership boundaries.
  - If future behavior converges, extract shared presentational primitives while keeping mode-specific wrappers minimal.

### 3) Naming inconsistency hotspots (`constants.ts`, `utils.ts`)

- Repeated generic filenames across domains:
  - `constants.ts` in hooks/minigames, kabelsalat, data/events, utils/audio
  - `utils.ts` in kabelsalat and stage
- Risk: import ambiguity during refactors and weaker grep-ability for domain-specific rules.
- Integration recommendation:
  - Prefer domain-qualified module names for new files (e.g., `kabelsalatConstants.ts`, `stageRenderUtils.ts`).
  - Keep existing modules but migrate opportunistically when touching nearby code.

## AGENTS coverage actions completed

To satisfy local convention coverage in active domain folders, nested `AGENTS.md` files were added for:

- `src/scenes/credits/`
- `src/scenes/gameover/`
- `src/scenes/intro/`
- `src/ui/overworld/`

These files only include domain-specific gotchas and defer shared policy to parent AGENTS files.
