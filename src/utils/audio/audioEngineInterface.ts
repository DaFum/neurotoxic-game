// A namespace import of the `audioEngine` hub rather than named imports of the
// submodules: the hub is the documented entry point for the Tone.js stack, and
// a namespace binding resolves each function at call time, so suites that mock
// the hub with a partial export set still link.
import * as audioEngineHub from './audioEngine'
import type { AudioSfxType } from './AudioManager'
import type { GigEndInfo } from './state'
import type { ActiveSong, MutableRef } from './rhythmGameTypes'
import type { RhythmGameRefState } from '../../types/rhythmGame'
import type { ToastCallback, TranslationCallback } from '../../types/callbacks'

/**
 * Parameters accepted by {@link IAudioEngine.startGig}.
 */
interface StartGigParams {
  /** Audio asset filename for the gig track. */
  filename: string
  /** Offset into the buffer at which playback begins, in ms. */
  bufferOffsetMs?: number
  /** Delay before playback starts, in ms. */
  delayMs?: number
  /** Playback window length in ms, or `null` for the whole buffer. */
  durationMs?: number | null
  /** Called once playback ends naturally. */
  onEnded?: ((args: GigEndInfo) => void) | null
}

/**
 * Substitutable gig-audio surface.
 *
 * @remarks
 * The audio stack stays Tone.js behind `src/utils/audio/audioEngine.ts`; this
 * is an interface extraction, not a library swap. Consumers depend on the
 * interface rather than importing the singleton at module scope, so tests and
 * CI can substitute {@link NullAudioEngine} and drive gig logic without an
 * `AudioContext`.
 *
 * `getGigTimeMs()` remains the only source of gameplay timing — the injected
 * `IClock` covers timestamps and cooldowns, never gig timing. `getGigTimeMs()`
 * must stay within `GIG_CLOCK_DRIFT_TOLERANCE_MS` (see `./constants.ts`) of the
 * expected timeline; `tests/node/audioEngineGigClock.test.js` is the contract
 * test.
 */
export interface IAudioEngine {
  /** Elapsed gig time in ms, read from the raw audio context. */
  getGigTimeMs(): number
  /** Starts gig playback. Resolves `false` when it failed or was cancelled. */
  startGig(params: StartGigParams): Promise<boolean>
  /** Stops gig playback and releases the active source. */
  stopGig(): void
  /**
   * Schedules a single instrument note.
   *
   * @param midiPitch - MIDI note number.
   * @param lane - Lane whose instrument plays the note.
   * @param whenSeconds - Absolute context time in seconds.
   * @param velocity - MIDI velocity, 0–127.
   */
  scheduleNote(
    midiPitch: number,
    lane: string,
    whenSeconds: number,
    velocity?: number
  ): void
  /**
   * Unlocks the audio context after a user gesture.
   *
   * @returns `true` once the context is running.
   *
   * @remarks
   * Part of the interface precisely so a substituted engine never constructs an
   * `AudioContext`: a seam that covered only the clock would still let the real
   * Tone.js stack initialise underneath it.
   */
  ensureAudioContext(): Promise<boolean>
  /**
   * Plays a setlist from the given index, chaining songs as each ends.
   *
   * @param index - Index into the setlist to start from.
   * @param setlist - Resolved songs for this gig.
   * @param gameStateRef - Mutable rhythm state the sequencer reads and updates.
   * @param addToast - Toast callback for song-transition messages.
   * @param t - Translator used by those messages.
   */
  playSongSequence(
    index: number,
    setlist: ActiveSong[],
    gameStateRef: MutableRef<RhythmGameRefState>,
    addToast: ToastCallback,
    t: TranslationCallback | undefined
  ): Promise<void>
  /** Stops all playback and invalidates in-flight play requests. */
  stopAudio(): void
  /** Current transport state. */
  getTransportState(): 'started' | 'stopped' | 'paused'
  /** Pauses the transport and gig playback. */
  pauseAudio(): Promise<void>
  /** Resumes the transport. Resolves `false` when playback could not resume. */
  resumeAudio(): Promise<boolean>
  /**
   * Toggles the master corruption effect.
   *
   * @param active - `true` to ramp the effect in, `false` to ramp it out.
   */
  setCorruptionEffect(active: boolean): void
  /** Arms the corruption-burst audio chain. */
  enableCorruptionBurstAudio(): void
  /**
   * Absolute audio-context time in ms.
   *
   * @remarks
   * Exists solely to schedule MIDI notes against the audio clock, which needs
   * an absolute reference. Gameplay timing stays on `getGigTimeMs()`.
   */
  getToneAbsoluteTimeMs(): number
  /**
   * Plays a one-shot sound effect.
   *
   * @param id - Effect to play.
   */
  playSFX(id: AudioSfxType): void
  /** Stops ambient/menu music, e.g. before gig playback starts. */
  stopMusic(): void
  /**
   * Id of the current play request.
   *
   * @returns A counter the engine bumps whenever a new audio session starts.
   *
   * @remarks
   * Callers compare it across an await or timer to detect that a different gig
   * session started meanwhile. It reads mutable engine state, so a substituted
   * engine has to own it too.
   */
  getPlayRequestId(): number
}

/**
 * Real engine, delegating to the Tone.js-backed modules in this directory.
 */
export const toneAudioEngine: IAudioEngine = {
  getGigTimeMs: (): number => audioEngineHub.getGigTimeMs(),
  startGig: (params: StartGigParams): Promise<boolean> =>
    audioEngineHub.startGigPlayback(params),
  stopGig: (): void => audioEngineHub.stopGigPlayback(),
  scheduleNote: (
    midiPitch: number,
    lane: string,
    whenSeconds: number,
    velocity = 127
  ): void =>
    audioEngineHub.playNoteAtTime(midiPitch, lane, whenSeconds, velocity),
  ensureAudioContext: (): Promise<boolean> =>
    audioEngineHub.audioManager.ensureAudioContext(),
  playSongSequence: (index, setlist, gameStateRef, addToast, t) =>
    audioEngineHub.playSongSequence(index, setlist, gameStateRef, addToast, t),
  stopAudio: (): void => audioEngineHub.stopAudio(),
  getTransportState: (): 'started' | 'stopped' | 'paused' =>
    audioEngineHub.getTransportState(),
  pauseAudio: (): Promise<void> => audioEngineHub.pauseAudio(),
  resumeAudio: (): Promise<boolean> => audioEngineHub.resumeAudio(),
  setCorruptionEffect: (active: boolean): void =>
    audioEngineHub.setCorruptionEffect(active),
  enableCorruptionBurstAudio: (): void =>
    audioEngineHub.enableCorruptionBurstAudio(),
  getToneAbsoluteTimeMs: (): number => audioEngineHub.getToneAbsoluteTimeMs(),
  playSFX: (id: AudioSfxType): void => audioEngineHub.audioService.playSFX(id),
  stopMusic: (): void => audioEngineHub.audioService.stopMusic(),
  getPlayRequestId: (): number => audioEngineHub.getPlayRequestId()
}

/**
 * Engine that produces no sound and reports a frozen gig clock.
 *
 * @remarks
 * For CI and for tests that exercise gig logic without an `AudioContext`.
 * `getGigTimeMs()` returns `0` so callers see a deterministic clock; drive time
 * explicitly with {@link createStubAudioEngine} when a test needs it to move.
 */
export class NullAudioEngine implements IAudioEngine {
  /** {@inheritDoc IAudioEngine} */
  getGigTimeMs(): number {
    return 0
  }

  /** {@inheritDoc IAudioEngine} */
  async startGig(): Promise<boolean> {
    return false
  }

  /** {@inheritDoc IAudioEngine} */
  stopGig(): void {}

  /** {@inheritDoc IAudioEngine} */
  scheduleNote(): void {}

  /** {@inheritDoc IAudioEngine} */
  async ensureAudioContext(): Promise<boolean> {
    // Reports "not unlocked" without ever touching the Web Audio API, so a gig
    // wrapped in this engine cannot initialise Tone.js.
    return false
  }

  /** {@inheritDoc IAudioEngine} */
  async playSongSequence(): Promise<void> {}

  /** {@inheritDoc IAudioEngine} */
  stopAudio(): void {}

  /** {@inheritDoc IAudioEngine} */
  getTransportState(): 'started' | 'stopped' | 'paused' {
    return 'stopped'
  }

  /** {@inheritDoc IAudioEngine} */
  async pauseAudio(): Promise<void> {}

  /** {@inheritDoc IAudioEngine} */
  async resumeAudio(): Promise<boolean> {
    return false
  }

  /** {@inheritDoc IAudioEngine} */
  setCorruptionEffect(): void {}

  /** {@inheritDoc IAudioEngine} */
  enableCorruptionBurstAudio(): void {}

  /** {@inheritDoc IAudioEngine} */
  getToneAbsoluteTimeMs(): number {
    return 0
  }

  /** {@inheritDoc IAudioEngine} */
  playSFX(): void {}

  /** {@inheritDoc IAudioEngine} */
  stopMusic(): void {}

  /** {@inheritDoc IAudioEngine} */
  getPlayRequestId(): number {
    return 0
  }
}

/**
 * Builds a silent engine whose gig clock is driven by the caller.
 *
 * @param getTimeMs - Returns the gig time each call, so tests can advance it.
 * @returns A no-sound engine reporting the supplied gig time.
 */
export const createStubAudioEngine = (
  getTimeMs: () => number
): IAudioEngine => ({
  getGigTimeMs: getTimeMs,
  startGig: async (): Promise<boolean> => true,
  stopGig: (): void => {},
  scheduleNote: (): void => {},
  ensureAudioContext: async (): Promise<boolean> => true,
  playSongSequence: async (): Promise<void> => {},
  stopAudio: (): void => {},
  getTransportState: (): 'started' | 'stopped' | 'paused' => 'started',
  pauseAudio: async (): Promise<void> => {},
  resumeAudio: async (): Promise<boolean> => true,
  setCorruptionEffect: (): void => {},
  enableCorruptionBurstAudio: (): void => {},
  getToneAbsoluteTimeMs: getTimeMs,
  playSFX: (): void => {},
  stopMusic: (): void => {},
  getPlayRequestId: (): number => 0
})
