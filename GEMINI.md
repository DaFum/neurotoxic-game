# Neurotoxic - Agent Instructions

## Tech Stack & Architecture

- **Frameworks:** React 19.2.5, Pixi.js 8.17.1 (2D renderer), Tone.js 15.5.6 (WebAudio), Framer Motion 12.38.0.
- **Styling:** Tailwind CSS v4.2.2.
- **Tooling:** Vite 8.0.8, pnpm (strict requirement, NO npm/yarn). Node >= 22.13.0.
- **TypeScript:** Strict CheckJS for `.js/.jsx`. No `@ts-nocheck` or `@ts-ignore` allowed.

## Workflow & Commands

- **Testing:**
  - `pnpm run test` (fast local tests via node:test/Vitest)
  - `pnpm run test:all` (Full PR gate)
  - `pnpm run test:ui` (Vitest UI components)
  - `pnpm run test:node` (Node logic tests)
- **Type Checking:** `pnpm run typecheck:core` and `pnpm run typecheck`.
- **Formatting:** `pnpm run lint:fix` and `pnpm run format` (Prettier/ESLint).
- **Dependencies:** Do NOT upgrade pinned dependencies without explicit discussion.

## Domain Invariants & Rules

- **State Updates:** All updates must flow through action creators -> reducers. Reducers are the final authority and must re-clamp computed state using canonical helpers like `finiteNumberOr(value, fallback)` from `src/utils/gameStateUtils.ts`.
- **Audio:** Use Tone.js exclusively via `audioEngine.ts`. No Howler.js or direct Tone.js reads for game timing (use `audioEngine.getGigTimeMs()`).
- **Styling & Assets:** Do not hardcode colors. Use defined CSS variables (`var(--color-toxic-green)`) or Pixi token helpers (`getPixiColorFromToken('--toxic-green')`). The design theme is "Void Worship": Toxic Green on Void Black.
- **Components:** No `.propTypes`. Use TypeScript interfaces or inline JSDoc/prop types.
- **I18n:** Treat all user-facing strings as localized. Update both `public/locales/en/*.json` and `public/locales/de/*.json`. Use `formatCurrency(value, i18n.language)` for localized currency inside reducers/action creators.
- **Symbols Index:** Do not hand-edit `symbols.json`. Run `pnpm run symbols:update` after exporting new APIs or changing type shapes.

## Simplicity & Surgical Changes

- **Minimum Viable Code:** Write the minimum code needed to solve the problem. Do not add speculative "flexibility" or abstractions.
- **Surgical Edits:** Touch only what you must. Do not refactor adjacent code or "improve" styling unless requested.
- **Goal-Driven:** Define success criteria and write tests before implementing changes. A task is incomplete until verified by a test. Matches the test runner framework to the nearest existing tests (Vitest vs `node:test`).
