---
name: perf-budget-enforcer
description: Define and enforce performance budgets (bundle size, load time, FPS considerations). Use when addressing performance regressions or optimizing builds.
---

# Performance Budget Enforcer

## Key Files

- `vite.config.js` — Vite 5 build configuration and chunking strategy
- `package.json` — dependency list (Pixi.js 8, Tone.js 15, Howler.js are heavy)
- `src/main.jsx` — app entry point (lazy loading candidates)
- `src/assets/` — MIDI files, images, and JSON data
- `src/components/PixiStage.jsx` — Pixi.js is a major bundle contributor
- `.github/workflows/deploy.yml` — CI build step where size checks could run

## Workflow

1. Run `npx vite build` and inspect the output size report for large chunks.
2. Identify heavy dependencies: Pixi.js (~500KB), Tone.js (~300KB), Howler.js — consider lazy loading.
3. Check `src/assets/` for large MIDI files that could be loaded on demand.
4. Propose measurable budgets (e.g., initial JS < 500KB, total assets < 2MB).
5. Suggest code splitting via dynamic `import()` for scenes and heavy components.
6. Add size checks to `.github/workflows/deploy.yml` if not present.

## Output

- Provide recommended budgets, current measurements, and optimization next steps.

## Related Skills

- `pixi-lifecycle-memory-leak-sentinel` — memory leaks directly affect runtime performance
- `ci-hardener` — for adding budget enforcement to CI
