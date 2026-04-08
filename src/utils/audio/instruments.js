import * as Tone from 'tone'
import { audioState } from './state.js'
import { HIHAT_CONFIG, CRASH_CONFIG } from './constants.js'

/**
 * Creates a layered snare instrument (noise crack + membrane body) connected to the given bus.
 * @param {object} bus - Tone.js audio node to connect the snare to.
 * @returns {object} Proxy object with triggerAttackRelease, volume, and dispose methods.
 */
export function createLayeredSnare(bus) {
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

export function setupMasterChain() {
  // Nodes
  // Limiter prevents clipping, Compressor glues the mix
  audioState.masterLimiter = new Tone.Limiter(-3).toDestination()
  audioState.masterComp = new Tone.Compressor(-18, 4)
  audioState.musicGain = new Tone.Gain(1)

  // Global reverb for natural space
  audioState.reverb = new Tone.Reverb({ decay: 1.8, wet: 0.15 })
  audioState.reverbSend = new Tone.Gain(0.3)

  // Signal Routing
  audioState.musicGain.chain(audioState.masterComp, audioState.masterLimiter)
  audioState.reverbSend.chain(audioState.reverb, audioState.musicGain)
}

export function setupGuitar() {
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

export function setupBass() {
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

export function buildDrumKit(bus, kickOverrides = {}) {
  const safeKickOverrides = kickOverrides && typeof kickOverrides === 'object' ? kickOverrides : {}
  return {
    kick: new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.4 },
      ...safeKickOverrides
    }).connect(bus),
    snare: createLayeredSnare(bus),
    hihat: new Tone.MetalSynth(HIHAT_CONFIG).connect(bus),
    crash: new Tone.MetalSynth(CRASH_CONFIG).connect(bus)
  }
}

export function setupDrums() {
  // Drum bus with own reverb send
  audioState.drumBus = new Tone.Gain(1).connect(audioState.musicGain)
  audioState.drumBus.connect(audioState.reverbSend)

  audioState.drumKit = buildDrumKit(audioState.drumBus)

  // Level Mixing (more balanced)
  audioState.drumKit.kick.volume.value = 2
  audioState.drumKit.snare.volume.value = 0
  audioState.drumKit.hihat.volume.value = -12
  audioState.drumKit.crash.volume.value = -8
}

export function setupSFX() {
  audioState.sfxGain = new Tone.Gain(0.25).connect(audioState.masterLimiter)
  audioState.sfxSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.2 }
  }).connect(audioState.sfxGain)
}

export function setupMidiChain() {
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

  audioState.midiDrumKit = buildDrumKit(audioState.midiDryBus, {
    envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.2 }
  })

  // MIDI drum levels
  audioState.midiDrumKit.kick.volume.value = 2
  audioState.midiDrumKit.hihat.volume.value = -10
  audioState.midiDrumKit.crash.volume.value = -6
}
