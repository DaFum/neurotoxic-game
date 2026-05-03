# Neurotoxic - Agent Instructions

## Workflow

- Use the Superpower skill before any repo action that changes code, tests, tooling, docs, config, git history, or agent instructions.
- Read only the relevant nested `AGENTS.md` files before editing; nested files add scope rules and override root guidance when more specific.

## Critical Commands

- Use `pnpm` only. Do not use `npm` or `yarn`.
- Full PR gate: `pnpm run test:all`.
- Fast local gate: `pnpm run test`.
- UI and migrated suites: `pnpm run test:ui`.
- Full legacy node suites: `pnpm run test:node`.
- Extended perf and locale suites: `pnpm run test:additional`.
- Single `node:test` file: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js`.
- Single Vitest file: `pnpm run test:ui:file -- tests/<file>.test.js(x)`.
- Type gates: `pnpm run typecheck:core`; `pnpm run typecheck` is the scoped reducer gate.

## Architecture Constraints

- Do not upgrade pinned dependencies without discussion; do not add Howler.js.
- All state updates go through action creators. New actions must update `actionTypes`, reducer handling, and `actionCreators` together.
- Clamp bounded state once in action creators via `src/utils/gameStateUtils.ts`: `player.money >= 0`, `band.harmony` in `1..100`. Reducers must not re-clamp.
- Audio gameplay timing must use `audioEngine.getGigTimeMs()`, never direct Tone.js time reads.
- PreGig modifier costs come only from `MODIFIER_COSTS` in `src/utils/economyEngine.ts`.

## TypeScript

- `@ts-nocheck` budget is zero; never add `@ts-ignore`.
- Use `Object.hasOwn()` for untrusted property checks; prototype-pollution tests assert hostile keys are stripped.
- `isolatedModules` requires type-only imports (`import type` or mixed `import { Foo, type Bar }`).
- Action creators return `Extract<GameAction, { type: typeof ActionTypes.X }>`; do not hand-write action object shapes.
- Reducer default branches must call `assertNever(action)`.
- Preserve valid falsy values with nullish checks (`??`), not truthy fallbacks (`||`).
- Give categorize/split helpers explicit named return types instead of broad `Record<string, T[]>`.

## Style

- Commits use Conventional Commits (`feat:`, `fix:`, etc.).
- Tailwind v4 uses `@import "tailwindcss"`; non-color tokens use syntax such as `z-(--z-crt)` or `style={{ zIndex: 'var(--z-crt)' }}`.

## Gotchas

- Never add band members to their own `relationships` map; self-relationships corrupt trait and infighting logic.
- `createInitialState` settings sanitization keeps only `crtEnabled`, `tutorialSeen`, and `logLevel`.
- Audio end detection uses `setlistCompleted` plus `isNearTrackEnd`; do not use `audioPlaybackEnded`.
- JSON-note OGG/MIDI caps at `maxNoteTime + NOTE_TAIL_MS`; procedural songs use full excerpt duration.
- Default chatter scenes are `MENU`, `OVERWORLD`, `PREGIG`, and `POSTGIG`; `GIG` needs explicit conditional entries.
- Consumables use `inventory_add` and must not display as `OWNED`.
- Use `.cjs` for ad-hoc Node scripts using `require()`.
- Use `process.env.VITE_VAR` for env vars shared by Vite and `node:test`.
