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

## Nested TypeScript Notes

- Keep time/unit fields explicit (`ms`, beats, ticks) in type names or comments to prevent subtle conversion bugs.

## Domain Gotchas

- Snapshot consumers should prefer `getStateSnapshot()` when available and normalize partial snapshots to complete `AudioSnapshot` shapes before comparing state.
- Native subscription is valid only when `subscribe` is an actual function; otherwise polling must remain active to avoid silent stale-state failures.

## Recent Findings (2026-04)

- Global keyboard listeners in UI overlays should consume Escape consistently to prevent accidental audio toggle/race behavior from competing handlers.
