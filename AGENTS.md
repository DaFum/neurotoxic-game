<!-- TODO: Implement this -->
# Neurotoxic — Agent Instructions

## Critical Commands

- Logic tests (`node:test`): `pnpm run test`
- UI tests (Vitest): `pnpm run test:ui`
- Run single logic test: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js`
- Run single UI test: `pnpm dlx vitest run tests/<file>.test.jsx`

## Architecture Constraints

- **Version Pinning**: Pinned to exact versions: React 19.2.4, Vite 8.0.0, Tailwind 4.2.1, Framer Motion 12.36.0, Tone.js 15.5.6. Node.js 22.13+ required. Do NOT introduce Howler.js.
- **Tailwind v4**: Colors are registered in `@theme` with `--color-` prefix (e.g., `--color-toxic-green`) and consumed as native utilities (`bg-void-black`, `text-toxic-green`, `border-blood-red/60`). Use `@import "tailwindcss"` NOT `@tailwind base`. For non-color tokens that don't match a Tailwind namespace (z-index `--z-*`, etc.), use the arbitrary value syntax `z-(--z-crt)` or inline `style={{ zIndex: 'var(--z-crt)' }}`.
- **Colors**: Never hardcode colors. Use CSS vars (e.g., `var(--color-toxic-green)`). In PixiJS, use `getPixiColorFromToken('--toxic-green')` (pass the name without the `--color-` prefix; the utility resolves it internally).
- **State Updates**: Adding actions requires updating `ActionTypes`, the reducer case, and `actionCreators.js` together.
- **State Limits**: Clamp `player.money` >= 0 and `band.harmony` 1–100 via `gameStateUtils.js` helpers.
- **Audio**: The single runtime clock source is `audioEngine.getGigTimeMs()`. Do not access Tone.js directly.
- **I18n**: All user-facing text MUST be localized using `t('key')` or `<Trans>`. Keys must be namespaced (e.g., `ui:button.save`). Provide both `en` and `de` translations.

## Gotchas

- `songs.js` is excluded from ESLint — do not attempt to lint-fix it.
- Never import PIXI in Minigame hooks (`useTourbusLogic`, `useRoadieLogic`). They only return reactive state for StageControllers.
- `useArrivalLogic` owns arrival routing (including direct PREGIG entry for performance nodes).
- `START_GIG` reducer resets `gigModifiers` to defaults; previous gig selections do not carry over.
- `COMPLETE_TRAVEL_MINIGAME` does NOT reset the scene — routing is deferred to `useArrivalLogic`.
- Pixi.js v8 cleanup: Always destroy on unmount using `app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true })`.
- Audio end dual-gate: Do NOT use `audioPlaybackEnded`. Use `setlistCompleted` + `isNearTrackEnd` instead.
- Note-driven audio end: For songs with JSON notes, OGG/MIDI playback is capped to `maxNoteTime + NOTE_TAIL_MS`. For procedurally-generated songs the full excerpt duration is used.
- `MODIFIER_COSTS` in `economyEngine.js` is the single source of truth for PreGig modifier costs — never re-declare inline.
- Default chatter is limited to `MENU`, `OVERWORLD`, `PREGIG`, `POSTGIG` — `GIG` requires explicit conditional entries.
- **Image Loading**: Always use the `loadTexture` utility for dynamic images (especially `gen.pollinations.ai` URLs) to prevent PixiJS parsing errors and test failures.
- **Leaderboards API**: Always resolve song IDs via `SONGS_BY_ID.get().leaderboardId` (API-safe slug) before submitting to `/api/leaderboard/song`. Never submit the raw `currentGig.songId` directly.

## Style & Conventions

- Commits must use Conventional Commits (e.g., `feat:`, `fix:`).

## Localization & Review Update

- Treat all user-facing strings as localized content; use namespaced keys (`ui:*`, `events:*`, etc.) instead of hardcoded text.
- When introducing new i18n keys, update both `public/locales/en/*.json` and `public/locales/de/*.json` in the same change.
- Keep interpolation placeholders consistent across languages (e.g., `{{cost}}`, `{{location}}`).
- For non-visual error/toast paths, prefer resilient fallbacks (`defaultValue`) so missing keys do not surface raw key names to players.
- In React callbacks/hooks, keep translation usage consistent with hook dependency expectations (`t` included in callback deps when used in callback scope).
- Before merging localization work, run the project test commands (`pnpm run test` and `pnpm run test:ui`) and include results in the PR summary.

## Extended Knowledge Base

### 🏗️ Architecture: React, UI, & Styling

- **React 19 / Refs:** Pass `ref` as a standard prop and destructure it directly from props (do not use `React.forwardRef()`).
- **Component Optimization:** Wrap static UI blocks/icons in `React.memo()`. Rely on shallow comparison and stable references (`useMemo`/`useCallback`). Avoid custom equality comparators.
- **Event Handlers & `cloneElement`:** Wrap handlers in `useCallback`. Wrap disabled children in `<span tabIndex={0}>` so they can receive keyboard focus.
- **Structural Components:** Expose `contentClassName` for internal flex constraints (like `flex-1 min-h-0`) instead of hardcoding spacing.
- **CSS / Flexbox:** Chain `flex-1 min-h-0 flex flex-col` for internal scrolling.
- **Tailwind v4:** Colors use `@theme` native tokens (`bg-void-black`, `text-toxic-green`). For non-color tokens that don't match a Tailwind namespace (e.g., z-index `--z-*`), use arbitrary value syntax `z-(--z-crt)`. Avoid aggressive regex replacements that strip `var()`. Tokenize class strings (`.split(' ')`) instead of direct `.includes()` for dynamic utility checks.
- **UI Accessibility:** Wrap icon-only buttons in `Tooltip` components with `aria-label`s.
- **Shop / Consumables UI:** Consumables use the `inventory_add` effect and should not display as 'OWNED' to allow multi-purchase.
- **UX & State Consistency:** Success toasts for bounded state changes must display the actual applied delta.

### ⚙️ Architecture: Data, State, & JS Fundamentals

- **State Safety (NEUROTOXIC):** Resources must never be negative (`player.money`/`fame` >= 0; `band.harmony` 1-100). Enforce boundary checks.
- **Redux / State Mutability:** ONLY use Action Creators. NEVER call reducers directly.
- **State Derivation:** Pre-calculate bounded values into a local variable before assigning to state for better readability.
- **Data Access:** Prefer $O(1)$ lookups via pre-computed Maps (e.g., `SONGS_BY_ID`) over $O(N)$ array searches.
- **Data Schemas:** `hqItems.js` uses a singular `effect` object. `events/special.js` events require unique IDs, category 'special', i18n keys (`events:`), and an `options` array.
- **ES2022 & Performance:** Use `Object.hasOwn()`. Use `for...in` + `Object.hasOwn()` over `Object.keys().reduce()` to avoid array allocations. Combine nested `if`s with `&&`.
- **Localization:** Use `t('key')` for ALL text. Follow AGENTS.md prefixes (e.g., `ui:`). Include `t` in React hook dependencies.

### 🧪 Testing & Mocks

- **Framework Configuration:** `node:test` for `.js` logic/data. `vitest` exclusively for `.jsx` React/UI components.
- **Testing React Hooks:** Vitest is strictly for hooks; extract pure logic if using `node:test`.
- **Mocking:**
  - Explicitly populate lookup Maps in mocked data.
  - Mocks for structural components (`vi.mock`) must replicate core DOM hierarchy and forward layout props.
  - Mock `window.localStorage.setItem` in Vitest, wrapped in `try/finally` for cleanup.
  - For `react-i18next`, include `initReactI18next: { type: '3rdParty', init: () => {} }`.
- **Security & Prototypes:** Use `Object.hasOwn(obj, '__proto__')` to check for stripped forbidden keys.

### 🌍 Environment, Setup, & Tooling

- **Package Management:** Use `pnpm` exclusively (`dev`, `build`, `test`, `test:ui`, `test:all`, `lint`, `format`).
- **Dependencies (LOCKED):** React 19.2.4, Vite 8.0.0, Tailwind 4.2.1, Framer Motion 12.36.0, Tone.js 15.5.6. Node.js 22.13+. Do NOT use Howler.js.
- **Node.js Scripts:** Ad-hoc scripts using `require()` must end in `.cjs`. Use CLI tools (`sed`, `awk`) for JSX refactoring instead of `@babel/core`.
- **Environment Variables:** Maintain `.env.example`. Use `process.env.VITE_VAR` for Vite/node:test dual compatibility.
- **Linting / Coverage:** Use `@eslint-react/eslint-plugin`. Ignore `Songs.js` in ESLint. Add `coverage/` to `.gitignore`.
- **Pollinations API:** The key is safe to publish.

### 📋 Workflow, PRs, & Planning Constraints

- **Planning / Pre-Commit Rules:** Use concrete, actionable tool-call steps. The pre-commit step must immediately precede the final submission with the exact phrasing: "Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done." Run full test suite (`pnpm run test:all`) before this step.
- **PR Formatting Rules:** Ensure Conventional Commits format. Use strict prefixes and sections based on type (🧪 Testing, 🧹 Code Health, ⚡ Performance, 🔒 Security).
- **PR Noise Management:** Prefer targeted CLI refactoring (e.g., `sed -i`) over global formatting to minimize noise.
- **Verification Rules:** Always verify fixes, remove temporary verification files, and ensure `frontend_verification_complete` screenshots exist on disk.
- **Agent Context:** Use Context7 MCP for documentation and setup generation automatically.
