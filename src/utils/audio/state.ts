import type * as Tone from 'tone'
import { logger } from '../logger'
import type { DrumKitSynth } from '../../types/audio'

/**
 * Shared mutable state for the audio engine.
 */
type Nullable<T> = T | null

type InstrumentSynth = Tone.PolySynth | Tone.Synth
type TonePart = Tone.Part<unknown>
// Tone sequences can carry either single-note values or nested arrays (polyrhythms).
type ToneSequence = Tone.Sequence<string | null> | Tone.Sequence<string[]>
type BufferSource = AudioBufferSourceNode
/**
 * Identifies the audio buffer driving the current gig and where it ends.
 *
 * @remarks
 * Used to detect end-of-song against the gig clock. `filename`/`durationMs` are
 * `null` until a buffer is loaded; `offsetMs` is the playback start offset within
 * that buffer.
 */
export type GigEndInfo = {
  filename: string | null
  durationMs: number | null
  offsetMs: number
}

/**
 * Mutable audio graph and playback state shared by low-level audio modules.
 */
export const audioState = {
  // Instruments
  guitar: null as Nullable<Tone.PolySynth>,
  bass: null as Nullable<Tone.PolySynth>,
  drumKit: null as Nullable<DrumKitSynth>,
  loop: null as Nullable<ToneSequence>,
  part: null as Nullable<TonePart>,
  midiParts: [] as TonePart[],
  sfxSynth: null as Nullable<InstrumentSynth>,
  sfxGain: null as Nullable<Tone.Gain>,
  musicGain: null as Nullable<Tone.Gain>,
  masterLimiter: null as Nullable<Tone.Limiter>,
  masterComp: null as Nullable<Tone.Compressor>,
  masterCorruption: null as Nullable<Tone.Distortion>,
  neuroDistortion: null as Nullable<Tone.Chebyshev>,
  reverb: null as Nullable<Tone.Reverb>,
  reverbSend: null as Nullable<Tone.Gain>,
  distortion: null as Nullable<Tone.Distortion>,
  masterCorruptionDistortion: null as Nullable<Tone.Distortion>,
  masterCorruptionBypass: null as Nullable<Tone.Gain>,
  masterCorruptionWetGain: null as Nullable<Tone.Gain>,
  guitarChorus: null as Nullable<Tone.Chorus>,
  guitarEq: null as Nullable<Tone.EQ3>,
  widener: null as Nullable<Tone.StereoWidener>,
  bassEq: null as Nullable<Tone.EQ3>,
  bassComp: null as Nullable<Tone.Compressor>,
  drumBus: null as Nullable<Tone.Gain>,
  midiDryBus: null as Nullable<Tone.Gain>,
  midiLead: null as Nullable<Tone.PolySynth>,
  midiBass: null as Nullable<Tone.PolySynth>,
  midiDrumKit: null as Nullable<DrumKitSynth>,
  midiReverb: null as Nullable<Tone.Reverb>,
  midiReverbSend: null as Nullable<Tone.Gain>,

  // State flags & IDs
  isSetup: false,
  isCorruptionAudioActive: false,
  playRequestId: 0,
  transportEndEventId: null as Nullable<number>,
  transportStopEventId: null as Nullable<number>,

  // Gig Playback State
  gigSource: null as Nullable<BufferSource>,
  gigBuffer: null as Nullable<AudioBuffer>,
  gigFilename: null as Nullable<string>,
  gigStartCtxTime: null as Nullable<number>,
  gigSeekOffsetMs: 0,
  gigBaseOffsetMs: 0,
  gigDurationMs: null as Nullable<number>,
  gigOnEnded: null as Nullable<(args: GigEndInfo) => void>,
  gigIsPaused: false,

  // Cache & Asset State
  audioBufferCache: new Map<string, AudioBuffer>(),
  currentCacheByteSize: 0,
  ambientSource: null as Nullable<BufferSource>,

  // Setup/Rebuild Locks
  setupLock: null as Nullable<Promise<void>>,
  setupError: null as Nullable<unknown>,
  rebuildLock: null as Nullable<Promise<void>>
}

/**
 * Resets the gig state to default values.
 *
 * @remarks
 * This only clears the gig playback subset. Instrument setup, cached buffers,
 * preferences, and ambient playback state remain owned by their dedicated paths.
 */
export const resetGigState = () => {
  audioState.gigSource = null
  audioState.gigBuffer = null
  audioState.gigFilename = null
  audioState.gigStartCtxTime = null
  audioState.gigSeekOffsetMs = 0
  audioState.gigBaseOffsetMs = 0
  audioState.gigDurationMs = null
  audioState.gigOnEnded = null
  audioState.gigIsPaused = false
}

/**
 * Safely disposes a Tone.js node, catching errors if the context is closed.
 * @param node - The Tone.js node to dispose.
 * @returns Always returns null.
 */
export function safeDispose(
  node: { dispose?: () => void } | null | undefined
): null {
  if (node && typeof node.dispose === 'function') {
    try {
      node.dispose()
    } catch (err) {
      logger.debug('AudioEngine', 'Node disposal failed (likely benign)', err)
    }
  }
  return null
}

/** How the registry releases whatever a slot holds. */
type AudioResourceKind =
  /** Tone.js node: stopped when it exposes `stop()`, then disposed. */
  | 'node'
  /** Drum-kit bundle: every voice disposed individually. */
  | 'drumKit'
  /** Raw `AudioBufferSourceNode`: stopped, then disconnected. */
  | 'source'
  /** The gig source, whose release also clears the gig clock state. */
  | 'gigSource'

/**
 * Every `audioState` slot holding a releasable audio resource, in teardown
 * order.
 *
 * @remarks
 * Sources come first so buffer playback stops before the buses feeding it are
 * disposed. This table is the single disposal contract: a node assigned to
 * `audioState` but missing here leaks across teardowns, because `disposeAudio`
 * iterates {@link audioResourceRegistry} rather than naming nodes one by one.
 */
const AUDIO_RESOURCE_KINDS = {
  gigSource: 'gigSource',
  ambientSource: 'source',

  guitar: 'node',
  bass: 'node',
  drumKit: 'drumKit',
  sfxSynth: 'node',
  sfxGain: 'node',
  musicGain: 'node',
  midiLead: 'node',
  midiBass: 'node',
  midiDrumKit: 'drumKit',
  midiReverbSend: 'node',
  midiReverb: 'node',
  midiDryBus: 'node',
  distortion: 'node',
  guitarChorus: 'node',
  guitarEq: 'node',
  widener: 'node',
  bassEq: 'node',
  bassComp: 'node',
  drumBus: 'node',
  reverbSend: 'node',
  reverb: 'node',
  masterCorruptionDistortion: 'node',
  masterCorruptionBypass: 'node',
  masterCorruptionWetGain: 'node',
  neuroDistortion: 'node',
  masterComp: 'node',
  masterLimiter: 'node'
} as const satisfies Partial<Record<keyof typeof audioState, AudioResourceKind>>

/** Name of an `audioState` slot tracked by {@link audioResourceRegistry}. */
type AudioResourceKey = keyof typeof AUDIO_RESOURCE_KINDS

/**
 * Writable view of the registered slots.
 *
 * @remarks
 * Reads come back as `unknown` and are narrowed by the kind handler; writes
 * only ever store `null`, which every registered slot accepts.
 */
const resourceSlots: Record<AudioResourceKey, unknown> = audioState

const DRUM_VOICES = ['kick', 'snare', 'hihat', 'crash'] as const

/**
 * Stops a node that exposes `stop()`, ignoring an already-stopped source.
 */
const stopIfStoppable = (node: unknown, key: string): void => {
  if (!node || typeof node !== 'object') return
  const stoppable = node as { stop?: () => void; disposed?: boolean }
  if (typeof stoppable.stop !== 'function' || stoppable.disposed === true) {
    return
  }
  try {
    stoppable.stop()
  } catch (err) {
    // A node stopped twice reports InvalidStateError; that is the expected
    // outcome of the second call, not a failure worth logging.
    if (!(err instanceof Error) || err.name !== 'InvalidStateError') {
      logger.debug('AudioEngine', `${key} stop failed`, err)
    }
  }
}

/**
 * Stops and disconnects a raw buffer source.
 */
const releaseSource = (node: unknown, key: string): void => {
  stopIfStoppable(node, key)
  if (!node || typeof node !== 'object') return
  const connectable = node as { disconnect?: () => void }
  if (typeof connectable.disconnect !== 'function') return
  try {
    connectable.disconnect()
  } catch (err) {
    logger.debug('AudioEngine', `${key} disconnect failed`, err)
  }
}

const releaseByKind: Record<
  AudioResourceKind,
  (node: unknown, key: string) => void
> = {
  node: (node, key) => {
    stopIfStoppable(node, key)
    safeDispose(node as { dispose?: () => void } | null)
  },
  drumKit: node => {
    if (!node || typeof node !== 'object') return
    const kit = node as Partial<
      Record<(typeof DRUM_VOICES)[number], { dispose?: () => void }>
    >
    for (const voice of DRUM_VOICES) {
      safeDispose(kit[voice])
    }
  },
  source: releaseSource,
  gigSource: (node, key) => {
    releaseSource(node, key)
    resetGigState()
  }
}

/**
 * A single registered audio resource.
 */
type AudioResourceEntry = {
  /** The `audioState` field this entry owns. */
  key: AudioResourceKey
  /** Reads whatever the slot currently holds, or `null` when it is empty. */
  ref: () => unknown
  /** Releases the resource in the slot and empties it. */
  dispose: () => void
}

/**
 * The engine's audio resources, keyed by `audioState` slot in teardown order.
 *
 * @remarks
 * The one place node lifetimes are declared. `disposeAudio` iterates it and
 * {@link releaseAudioResource} addresses a single slot, so neither has to
 * repeat per-node disposal calls.
 */
export const audioResourceRegistry: ReadonlyMap<
  AudioResourceKey,
  AudioResourceEntry
> = new Map(
  (Object.keys(AUDIO_RESOURCE_KINDS) as AudioResourceKey[]).map(key => {
    const ref = () => resourceSlots[key] ?? null
    return [
      key,
      {
        key,
        ref,
        dispose: () => {
          releaseByKind[AUDIO_RESOURCE_KINDS[key]](ref(), key)
          resourceSlots[key] = null
        }
      }
    ]
  })
)

/**
 * Releases one registered audio resource and empties its slot.
 *
 * @param key - The `audioState` slot to release.
 *
 * @remarks
 * Releasing `'gigSource'` also runs {@link resetGigState}, so the gig clock
 * never outlives the source that anchored it. It therefore resets gig state
 * even when no source is active — callers that must preserve the buffer and
 * seek offset (pause, resume-retry) manage the source themselves.
 */
export const releaseAudioResource = (key: AudioResourceKey): void => {
  audioResourceRegistry.get(key)?.dispose()
}
