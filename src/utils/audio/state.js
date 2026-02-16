/**
 * Shared mutable state for the audio engine.
 */
export const audioState = {
  // Instruments
  guitar: null,
  bass: null,
  drumKit: null,
  loop: null,
  part: null,
  midiParts: [],
  sfxSynth: null,
  sfxGain: null,
  musicGain: null,
  masterLimiter: null,
  masterComp: null,
  reverb: null,
  reverbSend: null,
  distortion: null,
  guitarChorus: null,
  guitarEq: null,
  widener: null,
  bassEq: null,
  bassComp: null,
  drumBus: null,
  midiDryBus: null,
  midiLead: null,
  midiBass: null,
  midiDrumKit: null,
  midiReverb: null,
  midiReverbSend: null,

  // State flags & IDs
  isSetup: false,
  playRequestId: 0,
  transportEndEventId: null,
  transportStopEventId: null,

  // Gig Playback State
  gigSource: null,
  gigBuffer: null,
  gigFilename: null,
  gigStartCtxTime: null,
  gigSeekOffsetMs: 0,
  gigBaseOffsetMs: 0,
  gigDurationMs: null,
  gigOnEnded: null,
  gigIsPaused: false,

  // Cache & Asset State
  audioBufferCache: new Map(),
  currentCacheByteSize: 0,
  ambientSource: null,

  // Setup/Rebuild Locks
  setupLock: null,
  setupError: null,
  rebuildLock: null
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
