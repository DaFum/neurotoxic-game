// A namespace import of the `audioEngine` hub rather than named imports of the
// submodules: the hub is the documented entry point for the Tone.js stack, and
// a namespace binding resolves each function at call time, so suites that mock
// the hub with a partial export set still link.
import * as audioEngineHub from './audioEngine'
import type { GigEndInfo } from './state'

/**
 * Parameters accepted by {@link IAudioEngine.startGig}.
 */
export interface StartGigParams {
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
 * `IClock` covers timestamps and cooldowns, never gig timing.
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
    audioEngineHub.playNoteAtTime(midiPitch, lane, whenSeconds, velocity)
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
  scheduleNote: (): void => {}
})
