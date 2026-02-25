import * as Tone from 'tone'
import { logger } from '../logger.js'
import {
  canResumeAudioContextState,
  getPreferredAudioContextState,
  isClosedAudioContextState
} from '../audioContextState.js'
import { audioState } from './state.js'
import { HIHAT_CONFIG, CRASH_CONFIG } from './constants.js'
import {
  stopTransportAndClear,
  cleanupGigPlayback,
  cleanupAmbientPlayback,
  cleanupTransportEvents
} from './cleanupUtils.js'

/**
 * Safely disposes a Tone.js node, catching errors if the context is closed.
 * @param {object} node - The Tone.js node to dispose.
 * @returns {null} Always returns null.
 */
function safeDispose(node) {
  if (node && typeof node.dispose === 'function') {
    try {
      node.dispose()
    } catch (error) {
      logger.debug('AudioEngine', 'Node disposal failed (likely benign)', error)
    }
  }
  return null
}

/**
 * Creates a layered snare instrument (noise crack + membrane body) connected to the given bus.
 * @param {object} bus - Tone.js audio node to connect the snare to.
 * @returns {object} Proxy object with triggerAttackRelease, volume, and dispose methods.
 */
function createLayeredSnare(bus) {
  const snareBus = new Tone.Volume(0).connect(bus)
  const snareNoise = new Tone.NoiseSynth({
    envelope: { attack: 0.001, decay: 0.15, sustain: 0 },
    noise: { type: 'white' }
  }).connect(snareBus)
  const snareBody = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 4,
    envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }
  }).connect(snareBus)
  snareBody.volume.value = -4
  return {
    triggerAttackRelease: (dur, time, vel = 1) => {
      snareNoise.triggerAttackRelease(dur, time, vel)
      snareBody.triggerAttackRelease('G3', dur, time, vel * 0.6)
    },
    volume: snareBus.volume,
    dispose: () => {
      snareNoise.dispose()
      snareBody.dispose()
      snareBus.dispose()
    },
    _noise: snareNoise,
    _body: snareBody
  }
}

/**
 * Returns the raw Web Audio context used by Tone.js.
 * @returns {AudioContext} The raw AudioContext.
 */
export const getRawAudioContext = () => {
  const toneContext = Tone.getContext()
  return toneContext?.rawContext ?? toneContext
}

/**
 * Returns the raw AudioContext time in seconds.
 * @returns {number} Current raw AudioContext time in seconds.
 */
export const getAudioContextTimeSec = () => {
  return getRawAudioContext().currentTime
}

/**
 * Converts a raw AudioContext start time into a Tone.js time reference.
 * @param {number} rawStartTimeSec - Raw AudioContext time in seconds.
 * @returns {number} Tone.js time in seconds.
 */
export const getToneStartTimeSec = rawStartTimeSec => {
  const lookAhead = Tone.getContext()?.lookAhead ?? 0
  return rawStartTimeSec + lookAhead
}

/**
 * Disposes of audio engine resources.
 *
 * NOTE: This function duplicates stop logic from playback.js
 * (stopAudioInternal, stopGigPlayback, stopAmbientPlayback) because
 * setup.js must not import from playback.js to preserve the acyclic
 * dependency graph: state -> setup -> playback -> procedural.
 * If you change stop/cleanup logic in playback.js, update this function too.
 */
export function disposeAudio() {
  audioState.playRequestId++
  // stopAudioInternal() logic - we can't call it here directly if it's in playback
  // So we handle the disposal of shared resources manually

  stopTransportAndClear()
  cleanupTransportEvents()
  cleanupGigPlayback()
  cleanupAmbientPlayback()

  audioState.audioBufferCache.clear()
  audioState.currentCacheByteSize = 0

  audioState.guitar = safeDispose(audioState.guitar)
  audioState.bass = safeDispose(audioState.bass)

  if (audioState.drumKit) {
    audioState.drumKit.kick = safeDispose(audioState.drumKit.kick)
    audioState.drumKit.snare = safeDispose(audioState.drumKit.snare)
    audioState.drumKit.hihat = safeDispose(audioState.drumKit.hihat)
    audioState.drumKit.crash = safeDispose(audioState.drumKit.crash)
    audioState.drumKit = null
  }

  audioState.sfxSynth = safeDispose(audioState.sfxSynth)
  audioState.sfxGain = safeDispose(audioState.sfxGain)
  audioState.musicGain = safeDispose(audioState.musicGain)
  audioState.midiLead = safeDispose(audioState.midiLead)
  audioState.midiBass = safeDispose(audioState.midiBass)

  if (audioState.midiDrumKit) {
    audioState.midiDrumKit.kick = safeDispose(audioState.midiDrumKit.kick)
    audioState.midiDrumKit.snare = safeDispose(audioState.midiDrumKit.snare)
    audioState.midiDrumKit.hihat = safeDispose(audioState.midiDrumKit.hihat)
    audioState.midiDrumKit.crash = safeDispose(audioState.midiDrumKit.crash)
    audioState.midiDrumKit = null
  }

  audioState.midiReverbSend = safeDispose(audioState.midiReverbSend)
  audioState.midiReverb = safeDispose(audioState.midiReverb)
  audioState.midiDryBus = safeDispose(audioState.midiDryBus)

  audioState.distortion = safeDispose(audioState.distortion)
  audioState.guitarChorus = safeDispose(audioState.guitarChorus)
  audioState.guitarEq = safeDispose(audioState.guitarEq)
  audioState.widener = safeDispose(audioState.widener)

  audioState.bassEq = safeDispose(audioState.bassEq)
  audioState.bassComp = safeDispose(audioState.bassComp)

  audioState.drumBus = safeDispose(audioState.drumBus)

  audioState.reverbSend = safeDispose(audioState.reverbSend)
  audioState.reverb = safeDispose(audioState.reverb)
  audioState.masterComp = safeDispose(audioState.masterComp)
  audioState.masterLimiter = safeDispose(audioState.masterLimiter)

  audioState.isSetup = false
}

function setupMasterChain() {
  // Limiter prevents clipping, Compressor glues the mix
  audioState.masterLimiter = new Tone.Limiter(-3).toDestination()
  audioState.masterComp = new Tone.Compressor(-18, 4).connect(
    audioState.masterLimiter
  )
  audioState.musicGain = new Tone.Gain(1).connect(audioState.masterComp)

  // Global reverb send for natural space
  audioState.reverb = new Tone.Reverb({ decay: 1.8, wet: 0.15 }).connect(
    audioState.musicGain
  )
  audioState.reverbSend = new Tone.Gain(0.3).connect(audioState.reverb)
}

function setupGuitar() {
  // FM synthesis for richer harmonic content
  audioState.guitar = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 2,
    modulationIndex: 3,
    oscillator: { type: 'sawtooth' },
    modulation: { type: 'square' },
    envelope: { attack: 0.005, decay: 0.3, sustain: 0.15, release: 0.3 },
    modulationEnvelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.1,
      release: 0.3
    }
  })

  audioState.distortion = new Tone.Distortion(0.4)
  audioState.guitarChorus = new Tone.Chorus(4, 2.5, 0.3).start()
  audioState.guitarEq = new Tone.EQ3(-1, -3, 3) // Gentle mid scoop
  audioState.widener = new Tone.StereoWidener(0.5)

  audioState.guitar.chain(
    audioState.distortion,
    audioState.guitarChorus,
    audioState.guitarEq,
    audioState.widener,
    audioState.musicGain
  )
  audioState.guitar.connect(audioState.reverbSend)
  audioState.guitar.volume.value = -2
}

function setupBass() {
  // MonoSynth with fatsawtooth-based waveform for warmer, fuller tone
  audioState.bass = new Tone.PolySynth(Tone.MonoSynth, {
    oscillator: { type: 'fatsawtooth', spread: 10, count: 3 },
    envelope: { attack: 0.01, decay: 0.4, sustain: 0.3, release: 0.3 },
    filterEnvelope: {
      attack: 0.005,
      decay: 0.3,
      sustain: 0.2,
      baseFrequency: 100,
      octaves: 2.5
    }
  })

  audioState.bassEq = new Tone.EQ3(3, -1, -4)
  audioState.bassComp = new Tone.Compressor(-15, 5)
  audioState.bass.chain(
    audioState.bassComp,
    audioState.bassEq,
    audioState.musicGain
  )
  audioState.bass.volume.value = 0
}

function setupDrums() {
  // Drum bus with own reverb send
  audioState.drumBus = new Tone.Gain(1).connect(audioState.musicGain)
  audioState.drumBus.connect(audioState.reverbSend)

  audioState.drumKit = {
    kick: new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.4 }
    }).connect(audioState.drumBus),
    snare: createLayeredSnare(audioState.drumBus),
    hihat: new Tone.MetalSynth(HIHAT_CONFIG).connect(audioState.drumBus),
    crash: new Tone.MetalSynth(CRASH_CONFIG).connect(audioState.drumBus)
  }

  // Level Mixing (more balanced)
  audioState.drumKit.kick.volume.value = 2
  audioState.drumKit.snare.volume.value = 0
  audioState.drumKit.hihat.volume.value = -12
  audioState.drumKit.crash.volume.value = -8
}

function setupSFX() {
  audioState.sfxGain = new Tone.Gain(0.25).connect(audioState.masterLimiter)
  audioState.sfxSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.2 }
  }).connect(audioState.sfxGain)
}

function setupMidiChain() {
  // Used for ambient playback. Richer synths with subtle spatial processing
  // to faithfully represent the MIDI content without heavy coloration.
  audioState.midiDryBus = new Tone.Gain(1).connect(audioState.musicGain)

  // Subtle reverb for spatial depth on ambient MIDI playback
  audioState.midiReverb = new Tone.Reverb({ decay: 1.8, wet: 0.15 }).connect(
    audioState.musicGain
  )
  audioState.midiReverbSend = new Tone.Gain(0.25).connect(audioState.midiReverb)
  audioState.midiDryBus.connect(audioState.midiReverbSend)

  // Lead/Guitar: FM synthesis for richer harmonic content
  audioState.midiLead = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 2,
    modulationIndex: 2.5,
    oscillator: { type: 'sawtooth' },
    modulation: { type: 'square' },
    envelope: { attack: 0.005, decay: 0.3, sustain: 0.2, release: 0.4 },
    modulationEnvelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.1,
      release: 0.3
    }
  }).connect(audioState.midiDryBus)

  // Bass: Fatter oscillator for warmth and presence
  audioState.midiBass = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'fatsawtooth', spread: 10, count: 3 },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.25, release: 0.3 }
  }).connect(audioState.midiDryBus)
  audioState.midiBass.volume.value = -3

  audioState.midiDrumKit = {
    kick: new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.2 }
    }).connect(audioState.midiDryBus),
    snare: createLayeredSnare(audioState.midiDryBus),
    hihat: new Tone.MetalSynth(HIHAT_CONFIG).connect(audioState.midiDryBus),
    crash: new Tone.MetalSynth(CRASH_CONFIG).connect(audioState.midiDryBus)
  }

  // MIDI drum levels
  audioState.midiDrumKit.kick.volume.value = 2
  audioState.midiDrumKit.hihat.volume.value = -10
  audioState.midiDrumKit.crash.volume.value = -6
}

/**
 * Initializes the audio subsystem, including synths, effects, and master compressor.
 * @returns {Promise<void>}
 */
export async function setupAudio() {
  if (audioState.isSetup) return
  if (audioState.setupLock) {
    await audioState.setupLock
    if (!audioState.isSetup) {
      throw audioState.setupError || new Error('setupAudio failed')
    }
    return
  }

  let resolveLock
  audioState.setupLock = new Promise(r => {
    resolveLock = r
  })
  audioState.setupError = null

  try {
    const previousToneContext = Tone.getContext()

    // Configure Tone.js context for sustained playback (gigs are 30-60s)
    // "balanced" prioritizes performance over ultra-low latency, reducing pops/crackles
    const nextToneContext = new Tone.Context({
      latencyHint: 'balanced',
      lookAhead: 0.15 // Increased from default 0.1 for better scheduling during high CPU
    })
    Tone.setContext(nextToneContext)

    // Trigger Tone.start() (which calls resume()) immediately to capture the user gesture synchronously.
    // We store the promise and await it later after cleanup.
    let startPromise
    try {
      startPromise = Tone.start()
    } catch (e) {
      startPromise = Promise.reject(e)
    }

    const previousRawContext =
      previousToneContext?.rawContext ?? previousToneContext
    const nextRawContext = nextToneContext?.rawContext ?? nextToneContext
    if (
      previousRawContext &&
      previousRawContext !== nextRawContext &&
      typeof previousRawContext.close === 'function' &&
      previousRawContext.state !== 'closed'
    ) {
      try {
        await previousRawContext.close()
      } catch (error) {
        logger.warn(
          'AudioEngine',
          'Failed to close previous Tone context',
          error
        )
      }
    }

    try {
      await startPromise
    } catch (e) {
      // Browser autoplay policy might block this; it will be resumed later via ensureAudioContext
      logger.warn('AudioEngine', 'Tone.start() was blocked or failed', e)
    }

    setupMasterChain()
    setupGuitar()
    setupBass()
    setupDrums()
    setupSFX()
    setupMidiChain()

    audioState.isSetup = true
  } catch (error) {
    audioState.setupError = error
    throw error
  } finally {
    audioState.setupLock = null
    if (resolveLock) resolveLock()
  }
}

/**
 * Ensures the AudioContext is running and initialized.
 * @returns {Promise<boolean>} True if the AudioContext is running.
 */
export async function ensureAudioContext() {
  // Synchronous resume attempt to capture user gesture for Web Audio unlock (iOS/Safari).
  // Only attempt when audio is already set up to avoid resuming a stale context that
  // setupAudio() is about to replace.
  if (audioState.isSetup && Tone.context) {
    const earlyState = getPreferredAudioContextState({
      rawContextState: getRawAudioContext()?.state,
      toneContextState: Tone.context?.state
    })
    if (canResumeAudioContextState(earlyState)) {
      // On iOS Safari the 'interrupted' state requires the native AudioContext resume
      if (earlyState === 'interrupted') {
        try {
          getRawAudioContext().resume()
        } catch (_e) {
          // Best-effort; full recovery follows below
        }
      } else {
        Tone.context.resume().catch(() => {})
      }
    }
  }

  if (!audioState.isSetup) await setupAudio()

  const getAudioState = () => {
    let rawContextState = null
    let toneContextState = null

    try {
      rawContextState = getRawAudioContext()?.state
      toneContextState = Tone.context?.state
    } catch (error) {
      logger.debug('AudioEngine', 'Audio state read failed', error)
      return {
        state: getPreferredAudioContextState({
          rawContextState,
          toneContextState
        }),
        rawContextState,
        toneContextState
      }
    }

    return {
      state: getPreferredAudioContextState({
        rawContextState,
        toneContextState
      }),
      rawContextState,
      toneContextState
    }
  }

  const ensureRebuild = async reasonState => {
    if (audioState.rebuildLock) {
      await audioState.rebuildLock
      return audioState.isSetup
    }

    let resolveRebuild
    audioState.rebuildLock = new Promise(r => {
      resolveRebuild = r
    })

    try {
      logger.warn(
        'AudioEngine',
        `AudioContext state is ${reasonState}. Rebuilding audio graph.`
      )
      try {
        disposeAudio()
      } catch (error) {
        logger.debug(
          'AudioEngine',
          'Partial dispose before rebuild failed',
          error
        )
      }
      audioState.isSetup = false
      try {
        await setupAudio()
      } catch (error) {
        logger.error('AudioEngine', 'Rebuild setupAudio failed', error)
        audioState.isSetup = false
        return false
      }

      if (!audioState.isSetup) {
        logger.error(
          'AudioEngine',
          'Audio graph rebuild failed. Playback unavailable.'
        )
        return false
      }

      return true
    } finally {
      if (resolveRebuild) resolveRebuild()
      audioState.rebuildLock = null
    }
  }

  let audioStateCtx = getAudioState()
  if (isClosedAudioContextState(audioStateCtx.state)) {
    const rebuilt = await ensureRebuild(audioStateCtx.state)
    if (!rebuilt) return false
    audioStateCtx = getAudioState()
  }

  if (audioStateCtx.state === 'running') return true

  if (canResumeAudioContextState(audioStateCtx.state)) {
    try {
      await Tone.context.resume()
    } catch (error) {
      logger.warn('AudioEngine', 'Tone.context.resume() failed:', error)
    }
    audioStateCtx = getAudioState()
    if (audioStateCtx.state === 'running') return true
  }

  if (isClosedAudioContextState(audioStateCtx.state)) {
    const rebuiltAfterResume = await ensureRebuild(audioStateCtx.state)
    if (!rebuiltAfterResume) return false
    audioStateCtx = getAudioState()
  }

  return audioStateCtx.state === 'running'
}
