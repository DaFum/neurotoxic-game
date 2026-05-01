# Architecture Review — 2026-05-01

## Scope

Static review for inconsistencies, doubled components/functions, and exported-but-not-integrated logic across `src/**`.

## Findings

### 1) Exported constant appears unintegrated

- `ALLOWED_SCENES` is exported from `src/context/reducers/systemReducer.ts` and has no in-repo references beyond its declaration.
- Integration recommendation:
  - Use `ALLOWED_SCENES` in scene-transition guardrails (e.g., central transition action creator or routing hook) so scene validation relies on one source of truth.
  - Add a reducer/action-creator test that rejects unknown scene IDs using this constant.

### 2) Potentially doubled overlay concept

- `GameOverOverlay.tsx` exists in both:
  - `src/components/hud/GameOverOverlay.tsx`
  - `src/scenes/kabelsalat/components/overlays/GameOverOverlay.tsx`
- Risk: parallel implementations may diverge in copy, behavior, or visual contract.
- Integration recommendation:
  - Decide ownership: either shared HUD primitive consumed by Kabelsalat, or explicit split with naming that clarifies mode-specific behavior.
  - If behavior is shared, extract a single presentational core and keep mode-specific wrappers minimal.

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
