# src/utils/audio - Agent Instructions

## Public API

All imports from outside this directory must go through `audioEngine.ts`. Direct imports from sub-modules (`./AudioManager`, `./audioService`, `./playback`, etc.) are only permitted inside `src/utils/audio/`.

Roles:

- `audioManager` (stateful class instance) — for non-React contexts: Pixi stage controllers, hook lifecycle, imperative timing.
- `audioService` (React-safe adapter) — for React components and hooks that need `useSyncExternalStore`-style reactivity.

## Snapshots and subscription

- Snapshot consumers must call `getStateSnapshot()` when that method exists; use `getState()` only as a compatibility fallback. Always normalize partial snapshots to complete `AudioSnapshot` shapes.
- React consumers own the polling fallback. Use `audioService.hasNativeSubscribe()`; when it returns `false` or `subscribe` is not a function, keep interval polling active instead of probing `audioManager.subscribe` outside this folder.

## Drum kits and SFX

- `audioState.midiDrumKit` is `Nullable<DrumKitSynth>` but `playDrumNote` expects `DrumKitSynth | undefined`; pass `audioState.midiDrumKit ?? undefined` so the default drum-kit fallback can run. If no kit exists, `playDrumNote` no-ops.
- New SFX types must be added both to the `AudioSfxType` union and to `VALID_SFX_TYPES` in `AudioManager`. Unknown keys cause `playSFX()` to `logger.warn('AudioSystem', 'Unknown SFX type: …')` and silently return.
- `audioService.setSfxVolume` (lowercase acronym, React-facing) bridges to `audioManager.setSFXVolume` (uppercase acronym, class-internal). Calling the wrong casing on a facade throws `TypeError` at runtime.

## Disposal

- Every node assigned to `audioState` in `instruments.ts` must have a matching `safeDispose` call in `disposeAudio` (`dispose.ts`). The master chain owns `masterLimiter`, `masterComp`, `musicGain`, `neuroDistortion`, `reverb`, `reverbSend`, and the `masterCorruption*` trio; when adding a new master-chain node, extend `disposeAudio` in the same change to avoid leaking it across teardowns.

## Decoding

- Decoding helpers (e.g. `decodeAudioDataWithTimeout`) must not double-check the same promise; rely on the outer abort/timeout path.
- Audio fetch/decode failures warn and return `null` from load helpers; do not synthesize fallback `AudioBuffer` objects for corrupt data.
