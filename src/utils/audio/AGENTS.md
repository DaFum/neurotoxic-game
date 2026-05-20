# src/utils/audio - Agent Instructions

## Public API

All imports from outside this directory must go through `audioEngine.ts`. Direct imports from sub-modules (`./AudioManager`, `./audioService`, `./playback`, etc.) are only permitted inside `src/utils/audio/`.

Roles:

- `audioManager` (stateful class instance) — for non-React contexts: Pixi stage controllers, hook lifecycle, imperative timing.
- `audioService` (React-safe adapter) — for React components and hooks that need `useSyncExternalStore`-style reactivity.

## Gotchas

- Snapshot consumers should prefer `getStateSnapshot()` and normalize partial snapshots to complete `AudioSnapshot` shapes.
- Native subscription is valid only when `subscribe` is a function; otherwise polling must stay active. Use `audioService.hasNativeSubscribe()` from React consumers — do not probe `audioManager.subscribe` directly from outside this folder.
- `audioState.midiDrumKit` is `Nullable<DrumKitSynth>` but `playDrumNote` expects `DrumKitSynth | undefined`; pass `audioState.midiDrumKit ?? undefined`.
- New SFX types must be added both to the `AudioSfxType` union and to `VALID_SFX_TYPES` in `AudioManager`. Unknown keys cause `playSFX()` to `logger.warn('AudioSystem', 'Unknown SFX type: …')` and silently return.
- `audioService.setSfxVolume` (lowercase acronym, React-facing) bridges to `audioManager.setSFXVolume` (uppercase acronym, class-internal). Calling the wrong casing on a facade throws `TypeError` at runtime.
- Decoding helpers (e.g. `decodeAudioDataWithTimeout`) must not double-check the same promise; rely on the outer abort/timeout path.
