// TODO: Review this file
/**
 * Shared mutable state for the audio engine.
 */
export const audioState = {
  // Instruments
  guitar: null as unknown,
  bass: null as unknown,
  drumKit: null as unknown,
  loop: null as unknown,
  part: null as unknown,
  midiParts: [] as unknown[],
  sfxSynth: null as unknown,
  sfxGain: null as unknown,
  musicGain: null as unknown,
  masterLimiter: null as unknown,
  masterComp: null as unknown,
  reverb: null as unknown,
  reverbSend: null as unknown,
  distortion: null as unknown,
  guitarChorus: null as unknown,
  guitarEq: null as unknown,
  widener: null as unknown,
  bassEq: null as unknown,
  bassComp: null as unknown,
  drumBus: null as unknown,
  midiDryBus: null as unknown,
  midiLead: null as unknown,
  midiBass: null as unknown,
  midiDrumKit: null as unknown,
  midiReverb: null as unknown,
  midiReverbSend: null as unknown,

  // State flags & IDs
  isSetup: false,
  playRequestId: 0,
  transportEndEventId: null as unknown,
  transportStopEventId: null as unknown,

  // Gig Playback State
  gigSource: null as unknown,
  gigBuffer: null as unknown,
  gigFilename: null as unknown,
  gigStartCtxTime: null as unknown,
  gigSeekOffsetMs: 0,
  gigBaseOffsetMs: 0,
  gigDurationMs: null as unknown,
  gigOnEnded: null as unknown,
  gigIsPaused: false,

  // Cache & Asset State
  audioBufferCache: new Map(),
  currentCacheByteSize: 0,
  ambientSource: null as unknown,

  // Setup/Rebuild Locks
  setupLock: null as unknown,
  setupError: null as unknown,
  rebuildLock: null as unknown
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
