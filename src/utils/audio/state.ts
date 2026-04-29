import type * as Tone from 'tone'
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
type GigEndInfo = {
  filename: string | null
  durationMs: number | null
  offsetMs: number
}

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
  reverb: null as Nullable<Tone.Reverb>,
  reverbSend: null as Nullable<Tone.Gain>,
  distortion: null as Nullable<Tone.Distortion>,
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
