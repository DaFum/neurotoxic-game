// TODO: Review this file
/**
 * Shared mutable state for the audio engine.
 */
type NullableUnknown = unknown | null

export const audioState = {
  // Instruments
  guitar: null as NullableUnknown,
  bass: null as NullableUnknown,
  drumKit: null as NullableUnknown,
  loop: null as NullableUnknown,
  part: null as NullableUnknown,
  midiParts: [] as unknown[],
  sfxSynth: null as NullableUnknown,
  sfxGain: null as NullableUnknown,
  musicGain: null as NullableUnknown,
  masterLimiter: null as NullableUnknown,
  masterComp: null as NullableUnknown,
  reverb: null as NullableUnknown,
  reverbSend: null as NullableUnknown,
  distortion: null as NullableUnknown,
  guitarChorus: null as NullableUnknown,
  guitarEq: null as NullableUnknown,
  widener: null as NullableUnknown,
  bassEq: null as NullableUnknown,
  bassComp: null as NullableUnknown,
  drumBus: null as NullableUnknown,
  midiDryBus: null as NullableUnknown,
  midiLead: null as NullableUnknown,
  midiBass: null as NullableUnknown,
  midiDrumKit: null as NullableUnknown,
  midiReverb: null as NullableUnknown,
  midiReverbSend: null as NullableUnknown,

  // State flags & IDs
  isSetup: false,
  playRequestId: 0,
  transportEndEventId: null as NullableUnknown,
  transportStopEventId: null as NullableUnknown,

  // Gig Playback State
  gigSource: null as NullableUnknown,
  gigBuffer: null as NullableUnknown,
  gigFilename: null as NullableUnknown,
  gigStartCtxTime: null as NullableUnknown,
  gigSeekOffsetMs: 0,
  gigBaseOffsetMs: 0,
  gigDurationMs: null as NullableUnknown,
  gigOnEnded: null as NullableUnknown,
  gigIsPaused: false,

  // Cache & Asset State
  audioBufferCache: new Map(),
  currentCacheByteSize: 0,
  ambientSource: null as NullableUnknown,

  // Setup/Rebuild Locks
  setupLock: null as NullableUnknown,
  setupError: null as NullableUnknown,
  rebuildLock: null as NullableUnknown
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
