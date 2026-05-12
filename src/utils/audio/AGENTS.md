# src/utils/audio - Agent Instructions

## Scope

Applies to `src/utils/audio/**`.

## Rules

- `audioEngine.getGigTimeMs()` is the canonical gig clock source.
- Keep OGG-unavailable fallback paths intact for MIDI/procedural playback.
- Preserve setup/playback/dispose cleanup semantics.
- Song/note contracts live in `src/types/audio.d.ts` and `src/types/rhythmGame.d.ts`; import with `import type`.
- Rely on bundled Tone.js and @tonejs/midi declarations; do not add stub `.d.ts` shims.

## Gotchas

- Narrow array/map lookups before use; this domain is under stricter CheckJS.
- Snapshot consumers should prefer `getStateSnapshot()` and normalize partial snapshots to complete `AudioSnapshot` shapes.
- Native subscription is valid only when `subscribe` is a function; otherwise polling must stay active.
- `audioState.midiDrumKit` is `Nullable<DrumKitSynth>` but `playDrumNote` expects `DrumKitSynth | undefined`; pass `audioState.midiDrumKit ?? undefined` (not the raw value) when calling it.
- New SFX types must be added both to the `AudioSfxType` union and to `VALID_SFX_TYPES` in `AudioManager`. If a key is dispatched without being in `VALID_SFX_TYPES`, `playSFX()` logs `logger.warn('AudioSystem', 'Unknown SFX type: …')` and returns without playing — easy to miss in normal log output.
- Decoding helpers (e.g. `decodeAudioDataWithTimeout`) must not double-check the same promise; rely on the outer abort/timeout path.
- `audioService` and `audioManager` use deliberately different method casing for the same operations: `audioService.setSfxVolume` (lowercase acronym, React-facing) bridges to `audioManager.setSFXVolume` (uppercase acronym, class-internal). Both are camelCase — they differ only in how the `SFX` acronym is cased. Calling the wrong-cased method on a facade throws `TypeError: x is not a function` at runtime, so always import the facade that matches the casing you intend to use.
- Use `audioService.hasNativeSubscribe()` to gate native subscription vs. polling fallback in React consumers; do not probe `audioManager.subscribe` directly from outside this folder.

## Public API

All imports from outside this directory must go through `audioEngine.ts`.
Direct imports from sub-modules (`./AudioManager`, `./audioService`,
`./playback`, etc.) are only permitted inside `src/utils/audio/` itself.

Roles:

- `audioManager` (stateful class instance) — for non-React contexts:
  Pixi stage controllers, hook lifecycle, imperative timing.
- `audioService` (React-safe adapter) — for React components and hooks
  that need `useSyncExternalStore`-style reactivity.
- All other utilities are stateless and safe to call from anywhere.
