---
applyTo: 'src/**'
---

@AGENTS.md

## Purpose

Minimal Copilot instruction (applies to files under `src/`). Imports `AGENTS.md` and highlights a few high-impact, non-discoverable rules.

## Critical Rules

- Use `pnpm` exclusively; never use `npm` or `yarn`.
- Run the full quality gate before PR: `pnpm run test:all`. For UI changes also run `pnpm run test:ui`.
- Node.js 22.13+; ensure generated code targets this runtime.
- Commits must follow Conventional Commits (`type(scope): description`).
- Do NOT add Howler.js.
- Tailwind v4: use `@import "tailwindcss"` (do not use `@tailwind base`).
- Color tokens: use CSS variables (`var(--color-...)`) — do not hardcode hex/rgb/hsl.
- Do NOT import PIXI inside Minigame hooks (e.g., `useTourbusLogic`, `useRoadieLogic`).
- Audio: use `audioEngine.getGigTimeMs()` as the timing source; do not read Tone.js time directly.
- When adding/renaming i18n keys, update both `public/locales/en/*.json` and `public/locales/de/*.json` in the same change.

## When to escalate

If an instruction conflicts with `AGENTS.md` or `CLAUDE.md`, prefer `AGENTS.md` and open an issue.

## Notes for maintainers

- Keep this file minimal and focused — fold general rules into `AGENTS.md`.
- If you want these rules to apply repo-wide, move this content into `AGENTS.md` and remove the `applyTo` frontmatter.
