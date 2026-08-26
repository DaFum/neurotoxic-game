# src/utils/audio - Agent Instructions

## Public API

All imports from outside this directory must go through `audioEngine.ts`. Direct imports from sub-modules (`./AudioManager`, `./audioService`, `./playback`, etc.) are only permitted inside `src/utils/audio/`.

Deliberate exception (dependency-injection seam): `./audioEngineInterface` may
be imported directly from outside this directory. It is the substitutable
`IAudioEngine` surface (`toneAudioEngine`, `NullAudioEngine`,
`createStubAudioEngine`), and re-exporting it from `audioEngine.ts` would make
the barrel depend on a module that namespace-imports the barrel back. Current
consumers are `src/context/AudioEngineContext.tsx` (the React seam) and
`src/components/PixiStageController.ts` (takes the engine as a constructor
argument). Do not widen this to other sub-modules, and do not import
`toneAudioEngine` anywhere else: the composition root mounts
`<AudioEngineProvider>` without an `engine` prop and lets the context resolve
the real engine.

Deliberate exception: pure, stateless helpers consumed by modules that are themselves dependencies of this directory's playback stack may be imported directly from their sub-module. `src/utils/chartDensity.ts` imports `buildMidiTrackEvents` from `./audio/midiUtils` and `src/utils/rhythmUtils.ts` imports `resolveSongPlaybackWindow` from `./audio/songUtils` — routing these through the `audioEngine.ts` barrel would create an import cycle (`rhythmUtils` is imported by `midiPlayback.ts`, `playbackStrategies.ts`, and `songSequencer.ts`, which the barrel re-exports) and would pull the stateful audio stack into pure utility modules and their `node:test` runs. Do not "fix" these two imports to use the barrel; do not extend this exception to stateful sub-modules.

Roles:

- `audioManager` (stateful class instance) — for non-React contexts: Pixi stage controllers, hook lifecycle, imperative timing.
- `audioService` (React-safe adapter) — for React components and hooks that need `useSyncExternalStore`-style reactivity.

## Gig playback sequencing

- In `gigPlayback.ts`, natural source-end cleanup must clear the ended source state before invoking `gigOnEnded`. Setlist chaining can synchronously start the next song clock; clearing after the callback erases that next-song state.
- `stopGigPlayback()` must invalidate `playRequestId` so it cancels starts waiting in `ensureAudioContext()` or `loadAudioBuffer()`. Cleanup performed inside `startGigPlayback()` must use the non-invalidating internal path, and regressions must call the exported stop function instead of mutating `playRequestId` directly.

## Snapshots and subscription

- Snapshot consumers must call `getStateSnapshot()` when that method exists; use `getState()` only as a compatibility fallback. Always normalize partial snapshots to complete `AudioSnapshot` shapes.
- React consumers own the polling fallback. Use `audioService.hasNativeSubscribe()`; when it returns `false` or `subscribe` is not a function, keep interval polling active instead of probing `audioManager.subscribe` outside this folder.

## Drum kits and SFX

- `audioState.midiDrumKit` is `Nullable<DrumKitSynth>` but `playDrumNote` expects `DrumKitSynth | undefined`; pass `audioState.midiDrumKit ?? undefined` so the default drum-kit fallback can run. If no kit exists, `playDrumNote` no-ops.
- New SFX types must be added both to the `AudioSfxType` union and to `VALID_SFX_TYPES` in `AudioManager`. Unknown keys cause `playSFX()` to `logger.warn('AudioSystem', 'Unknown SFX type: …')` and silently return.
- `audioService.setSfxVolume` (lowercase acronym, React-facing) bridges to `audioManager.setSFXVolume` (uppercase acronym, class-internal). Calling the wrong casing on a facade throws `TypeError` at runtime.

## Disposal

- Every node assigned to `audioState` in `instruments.ts` must have an entry in `AUDIO_RESOURCE_KINDS` (`state.ts`). `disposeAudio` (`dispose.ts`) iterates `audioResourceRegistry` instead of naming nodes, so registering the slot is the only step needed to have it torn down; an unregistered node leaks across teardowns. The master chain owns `masterLimiter`, `masterComp`, `musicGain`, `neuroDistortion`, `reverb`, `reverbSend`, and the `masterCorruption*` trio.
- Single-slot teardown goes through `releaseAudioResource(key)`, not per-source helpers. Releasing `'gigSource'` also runs `resetGigState()`, so use it only where the whole gig clock should go; pause and resume-retry deliberately keep the buffer and seek offset and manage the source themselves.

## Decoding

- Decoding helpers (e.g. `decodeAudioDataWithTimeout`) must not double-check the same promise; rely on the outer abort/timeout path.
- Audio fetch/decode failures warn and return `null` from load helpers; do not synthesize fallback `AudioBuffer` objects for corrupt data.

## Playback cancellation

- `startGigPlayback` claims a generation id (`audioState.playRequestId`) and re-checks it after every `await`; `stopGigPlayback` bumps that id. Any new `await` added to that function needs the same re-check, or a playback whose buffer was still loading when the gig ended will start afterwards.
- Its `false` return currently means "failed OR cancelled" — the two are indistinguishable. `playbackStrategies` reads `false` as "strategy unavailable" and falls through, so a cancelled start can be followed by MIDI/procedural audio beginning after the gig stopped. Do not add new fallback decisions keyed on that boolean without distinguishing the two cases first.
