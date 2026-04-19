# src/utils/audio — Agent Instructions

## Scope

Applies to `src/utils/audio/**`.

## Audio Timing Authority

- Use `audioEngine.getGigTimeMs()` as the canonical gig clock source.
- Do not introduce direct Tone.js timing reads in gameplay logic.

## Asset/Playback Rules

- Keep fallback path intact when OGG assets are unavailable (MIDI/procedural path must still work).
- Preserve existing cleanup/dispose semantics in setup/playback/dispose helpers.

## TypeScript Patterns

- Song/note contracts live in `src/types/audio.d.ts` and `src/types/rhythmGame.ts`. Import with `import type` and do not re-declare local structural clones.
- This domain is in the stricter CheckJS scope (`jsconfig.checkjs.json` adds `noUncheckedIndexedAccess`) — always narrow array/map lookups before use (`const n = notes[i]; if (!n) return`). Do not silence with `!`.
- For Tone.js / @tonejs/midi, rely on bundled declarations; do not add stub `.d.ts` shims.

## Change Rules

- Keep conversions behavior-preserving; separate refactors from type-shape changes.

## TypeScript Gotcha: Interface ↔ PropTypes Sync

- If a React component exposes both a TypeScript props interface and `propTypes`, keep optional/required fields in strict sync in the same PR.
- Example: if `controllerFactory?: ...` in `src/types/components.d.ts`, then the runtime contract must be `PropTypes.func` (not `PropTypes.func.isRequired`) in `src/components/MinigameSceneFrame.tsx`.

## TypeScript Best Practices (Repo)

- Keep TS interfaces and runtime validators/PropTypes synchronized in the same PR; optional vs required mismatches are contract bugs.
- Prefer `unknown` at untrusted boundaries (`JSON.parse`, storage, API payloads) and narrow with guards; never use `any`.
- Use `Object.hasOwn()` for untrusted property checks instead of `in`/`hasOwnProperty` to avoid prototype-chain pollution.
- Under strict CheckJS + `noUncheckedIndexedAccess`, guard indexed reads (`array[i]`) before use.
- Preserve discriminated-union safety in reducers/action creators (`Extract<...>`, `assertNever(action)`) when adding new action variants.
- Use `import type` for type-only imports (`isolatedModules: true`) and keep type-only refactors behavior-preserving.
- Prefer `??` over `||` when `0`/`''` are valid values.
- Use `@ts-expect-error <reason>` only with a tracked follow-up; never use `@ts-ignore`.
