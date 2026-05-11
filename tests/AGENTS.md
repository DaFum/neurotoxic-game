# tests - Agent Instructions

## Scope

Applies to `tests/**` unless a deeper `AGENTS.md` overrides it.

## Runner Rules

- Choose runner by neighboring tests, not extension alone.
- Do not mix `node:test` and Vitest idioms in one file.
- Full PR gate: `pnpm run test:all`.
- Legacy logic suites: `pnpm run test`.
- UI/migrated suites: `pnpm run test:ui`.
- Node split for triage: `pnpm run test:node:quick` and `pnpm run test:node:heavy`.

## Mocking

- Vitest localStorage assertions must mock/restore `window.localStorage.setItem` in `try/finally`.

## Gotchas

- Keep `tests/security/**` adversarial-only.
- Keep `tests/events/**` on event-data contracts and condition gating; reducer math belongs in node/reducer suites.
- Build fixtures with canonical state keys so tests mirror runtime sanitizers.
- Add reachability assertions when UI controls are reorganized.
- Keep fixture-transform tests separate from real-dataset contract tests.
- Pixi mocks must include `Assets.cache.get()` for tests covering `stageRenderUtils` (it calls `Assets.cache?.get(url)`). Production code relies on the optional chain as a backstop; without the mock, the cached-texture path is silently skipped.
- When mocking `src/utils/imageGen.ts` for code paths that render generated/offline-fallback images, export the symbols the unit under test actually invokes — usually `getGenImageUrl`, `isImageGenerationAvailable`, and `getGeneratedImageFallbackUrl`. The PWA-related PR added `isImageGenerationAvailable`/`getGeneratedImageFallbackUrl` and previously-passing perf mocks broke until they were added.
- The `virtual:pwa-register/react` alias must resolve via `fileURLToPath(new URL('./tests/mocks/virtual-pwa.js', import.meta.url))` in every vitest config (`vitest.config.js`, `vitest.config.node.js`, `vitest.config.perf.js`); absolute paths break CI.
- Test setup (`tests/setup.mjs`) sets `process.env.NODE_ENV = 'test'` before any imports so `__testInternals` exports (e.g. in `src/utils/crypto.ts`) are present; suites that bypass it must set it themselves.
- Audio mocks target the hub: `vi.mock('.../utils/audio/audioEngine', …)` (or the equivalent `mock.module` for `node:test`) and must include **both** `audioManager` and `audioService` in `namedExports`. Mocking `AudioManager.ts` or `audioService.ts` directly no longer intercepts callers, which all import from `audioEngine`. Vitest hoisted mock fixtures should share one listener set so `audioService` and `audioManager` stay observably linked across the test.
