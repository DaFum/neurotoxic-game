# tests - Agent Instructions

## Runner split

- Node split for triage: `pnpm run test:node:quick` and `pnpm run test:node:heavy`.

## Mock gotchas

- Pixi mocks must include `Assets.cache.get()` for tests covering `stageRenderUtils` (it calls `Assets.cache?.get(url)`); without the mock, the cached-texture path is silently skipped.
- When mocking `src/utils/imageGen.ts`, export `getGenImageUrl`, `isImageGenerationAvailable`, and `getGeneratedImageFallbackUrl` — the latter two were added with the PWA work and silently broke perf mocks until included.
- The `virtual:pwa-register/react` alias must resolve via `fileURLToPath(new URL('./tests/mocks/virtual-pwa.js', import.meta.url))` in every vitest config (`vitest.config.js`, `vitest.config.node.js`, `vitest.config.perf.js`); absolute paths break CI.
- `tests/setup.mjs` sets `process.env.NODE_ENV = 'test'` before any imports so `__testInternals` exports (e.g. in `src/utils/crypto.ts`) are present; suites that bypass it must set it themselves.
- Audio mocks target the hub: `vi.mock('.../utils/audio/audioEngine', …)` (or equivalent `mock.module` for `node:test`) and must include **both** `audioManager` and `audioService` in `namedExports`. Mocking `AudioManager.ts` or `audioService.ts` directly no longer intercepts callers, which all import from `audioEngine`. Hoisted fixtures should share one listener set so `audioService` and `audioManager` stay observably linked.
- `node:test` `mock.module(...)` options must use `namedExports:`, not the `exports:` shorthand. The `exports:` form was added in Node v25.9.0 and silently fails on CI's Node v22 (transitive mocks become no-ops without erroring).

## Folder boundaries

- Keep `tests/security/**` adversarial-only.
- Keep `tests/events/**` on event-data contracts and condition gating; reducer math belongs in node/reducer suites.
