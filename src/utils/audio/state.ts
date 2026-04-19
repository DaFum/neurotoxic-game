// TODO: Review this file
/**
 * Shared mutable state for the audio engine.
 */
export const audioState = {
  // Instruments
  guitar: null as any,
  bass: null as any,
  drumKit: null as any,
  loop: null as any,
  part: null as any,
  midiParts: [] as any[],
  sfxSynth: null as any,
  sfxGain: null as any,
  musicGain: null as any,
  masterLimiter: null as any,
  masterComp: null as any,
  reverb: null as any,
  reverbSend: null as any,
  distortion: null as any,
  guitarChorus: null as any,
  guitarEq: null as any,
  widener: null as any,
  bassEq: null as any,
  bassComp: null as any,
  drumBus: null as any,
  midiDryBus: null as any,
  midiLead: null as any,
  midiBass: null as any,
  midiDrumKit: null as any,
  midiReverb: null as any,
  midiReverbSend: null as any,

  // State flags & IDs
  isSetup: false,
  playRequestId: 0,
  transportEndEventId: null as any,
  transportStopEventId: null as any,

  // Gig Playback State
  gigSource: null as any,
  gigBuffer: null as any,
  gigFilename: null as any,
  gigStartCtxTime: null as any,
  gigSeekOffsetMs: 0,
  gigBaseOffsetMs: 0,
  gigDurationMs: null as any,
  gigOnEnded: null as any,
  gigIsPaused: false,

  // Cache & Asset State
  audioBufferCache: new Map(),
  currentCacheByteSize: 0,
  ambientSource: null as any,

  // Setup/Rebuild Locks
  setupLock: null as any,
  setupError: null as any,
  rebuildLock: null as any
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
