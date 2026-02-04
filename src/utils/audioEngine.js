/**
 * Audio Engine Utility
 * This module manages the AudioContext and Tone.js logic.
 * Note: This file contains side-effects (Tone.start, AudioContext creation) and is an exception to the strict Pure Function rule for utilities.
 */

import * as Tone from 'tone'

let guitar, bass, drumKit, loop, part
let isSetup = false

// Initialisierung der Synths und Effekte
/**
 * Initializes the audio subsystem, including synths, effects, and master compressor.
 * @returns {Promise<void>}
 */
export async function setupAudio() {
  if (isSetup) return
  await Tone.start()

  // Master Chain
  const masterComp = new Tone.Compressor(-30, 3).toDestination()

  // --- Gitarre ---
  guitar = new Tone.PolySynth(Tone.MonoSynth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.1 },
    filterEnvelope: {
      attack: 0.001,
      decay: 0.1,
      sustain: 0,
      baseFrequency: 150,
      octaves: 4
    }
  })

  const distortion = new Tone.Distortion(0.8)
  const widener = new Tone.StereoWidener(0.7)
  const eq = new Tone.EQ3(-2, -5, 2) // Mid Scoop

  guitar.chain(distortion, eq, widener, masterComp)

  // --- Bass ---
  bass = new Tone.PolySynth(Tone.MonoSynth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2 },
    filterEnvelope: {
      attack: 0.001,
      decay: 0.2,
      sustain: 0.1,
      baseFrequency: 80,
      octaves: 2
    }
  })

  const bassEq = new Tone.EQ3(2, 0, -2)
  const bassComp = new Tone.Compressor(-20, 4)
  bass.chain(bassComp, bassEq, masterComp)

  // --- Drums ---
  drumKit = {
    kick: new Tone.MembraneSynth().connect(masterComp),
    snare: new Tone.NoiseSynth({
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
      noise: { type: 'pink' }
    }).connect(masterComp),
    hihat: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).connect(masterComp),
    crash: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 1.0, release: 0.01 },
      harmonicity: 3.1,
      modulationIndex: 16,
      resonance: 2000,
      octaves: 2.5
    }).connect(masterComp)
  }

  // Level Mixing
  drumKit.kick.volume.value = 0
  drumKit.snare.volume.value = -5
  drumKit.hihat.volume.value = -15
  drumKit.crash.volume.value = -10

  isSetup = true
}

// Helper to resume context from UI
/**
 * Ensures the AudioContext is running and initialized.
 * @returns {Promise<void>}
 */
export async function ensureAudioContext() {
  if (!isSetup) await setupAudio()
  if (Tone.context.state !== 'running') {
    await Tone.context.resume()
  }
}

/**
 * Plays a song using predefined note data.
 * @param {object} song - The song object containing `notes` and `bpm`.
 * @param {number} [delay=0] - Delay in seconds before starting.
 */
export async function playSongFromData(song, delay = 0) {
  await ensureAudioContext()
  stopAudio()
  Tone.Transport.cancel()
  Tone.Transport.position = 0

  const bpm = Math.max(1, song.bpm || 120) // Ensure BPM is positive
  const tpb = Math.max(1, song.tpb || 480) // Ensure TPB is positive
  Tone.Transport.bpm.value = bpm

  // Validate notes
  if (!Array.isArray(song.notes)) {
    console.error('playSongFromData: song.notes is not an array')
    return
  }

  const events = song.notes
    .filter(n => {
      // Validate note data
      return (
        typeof n.t === 'number' &&
        isFinite(n.t) &&
        typeof n.p === 'number' &&
        isFinite(n.p) &&
        typeof n.v === 'number' &&
        isFinite(n.v)
      )
    })
    .map(n => {
      const beatDuration = 60 / bpm
      const time = (n.t / tpb) * beatDuration

      // Clamp velocity 0-127 and normalize
      const rawVelocity = Math.max(0, Math.min(127, n.v))

      return {
        time: time + (Number.isFinite(delay) ? delay : 0),
        note: n.p,
        velocity: rawVelocity / 127,
        lane: n.lane
      }
    })

  if (events.length === 0) {
    console.warn('playSongFromData: No valid notes found to schedule')
    return
  }

  part = new Tone.Part((time, value) => {
    if (!guitar || !bass || !drumKit) return

    const noteName = Tone.Frequency(value.note, 'midi').toNote()

    if (value.lane === 'guitar') {
      guitar.triggerAttackRelease(noteName, '16n', time, value.velocity)
    } else if (value.lane === 'bass') {
      bass.triggerAttackRelease(noteName, '8n', time, value.velocity)
    } else if (value.lane === 'drums') {
      playDrumNote(value.note, time, value.velocity)
    }
  }, events).start(0)

  Tone.Transport.start()
}

/**
 * Triggers a specific drum sound based on MIDI pitch.
 * @param {number} midiPitch - The MIDI note number.
 * @param {number} time - The time to trigger the note.
 * @param {number} velocity - The velocity of the note (0-1).
 */
function playDrumNote(midiPitch, time, velocity) {
  // Basic GM Mapping
  if (midiPitch === 35 || midiPitch === 36) {
    drumKit.kick.triggerAttackRelease('C1', '16n', time, velocity)
  } else if (midiPitch === 38 || midiPitch === 40) {
    drumKit.snare.triggerAttackRelease('16n', time, velocity)
  } else if (midiPitch === 42 || midiPitch === 44 || midiPitch === 46) {
    drumKit.hihat.triggerAttackRelease('8000', '32n', time, velocity * 0.8)
  } else if (midiPitch === 49 || midiPitch === 57) {
    drumKit.crash.triggerAttackRelease('C2', '8n', time, velocity)
  } else {
    drumKit.hihat.triggerAttackRelease('8000', '32n', time, velocity * 0.5)
  }
}

// Die eigentliche Generierungs-Logik (Legacy / Fallback)
/**
 * Starts the procedural metal music generator for a specific song configuration.
 * @param {object} song - The song object containing metadata like BPM and difficulty.
 * @param {number} [delay=0] - Delay in seconds before the audio starts.
 * @param {Function} [random=Math.random] - RNG function for deterministic generation.
 * @returns {Promise<void>}
 */
export async function startMetalGenerator(
  song,
  delay = 0,
  random = Math.random
) {
  await ensureAudioContext()

  stopAudio()
  Tone.Transport.cancel()
  Tone.Transport.position = 0

  const bpm = song.bpm || 80 + song.difficulty * 30
  Tone.Transport.bpm.value = bpm

  const pattern = generateRiffPattern(song.difficulty || 2, random)

  loop = new Tone.Sequence(
    (time, note) => {
      if (!guitar || !drumKit) return

      if (note) guitar.triggerAttackRelease(note, '16n', time)

      playDrumsLegacy(time, song.difficulty || 2, note, random)
    },
    pattern,
    '16n'
  )

  loop.start(0)
  Tone.Transport.start(Tone.now() + Math.max(0, delay))
}

/**
 * Stops the audio transport and disposes of the current loop.
 */
export function stopAudio() {
  Tone.Transport.stop()
  if (loop) {
    loop.dispose()
    loop = null
  }
  if (part) {
    part.dispose()
    part = null
  }
}

/**
 * Pauses the audio transport.
 */
export function pauseAudio() {
  if (Tone.Transport.state === 'started') {
    Tone.Transport.pause()
  }
}

/**
 * Resumes the audio transport.
 */
export function resumeAudio() {
  if (Tone.Transport.state === 'paused') {
    Tone.Transport.start()
  }
}

/**
 * Generates a procedural riff pattern.
 * @param {number} diff - Difficulty level.
 * @param {Function} random - Random number generator function.
 * @returns {Array} Array of note strings or nulls.
 */
function generateRiffPattern(diff, random) {
  const steps = 16
  const pattern = []
  const density = 0.3 + diff * 0.1

  for (let i = 0; i < steps; i++) {
    if (random() < density) {
      if (diff <= 2) pattern.push(random() > 0.8 ? 'E3' : 'E2')
      else if (diff <= 4)
        pattern.push(random() > 0.7 ? (random() > 0.5 ? 'F2' : 'G2') : 'E2')
      else {
        const notes = ['E2', 'A#2', 'F2', 'C3', 'D#3']
        pattern.push(notes[Math.floor(random() * notes.length)])
      }
    } else {
      pattern.push(null)
    }
  }
  return pattern
}

/**
 * Plays procedural drums based on legacy logic.
 * @param {number} time - Audio time.
 * @param {number} diff - Difficulty.
 * @param {string|null} note - The guitar note played on this step.
 * @param {Function} random - Random number generator.
 */
function playDrumsLegacy(time, diff, note, random) {
  if (diff === 5) {
    drumKit.kick.triggerAttackRelease('C1', '16n', time)
    if (random() > 0.5) drumKit.snare.triggerAttackRelease('16n', time)
    drumKit.hihat.triggerAttackRelease('8000', '32n', time, 0.5)
  } else {
    if (note === 'E2' || random() < diff * 0.1) {
      drumKit.kick.triggerAttackRelease('C1', '8n', time)
    }
    if (random() > 0.9) {
      drumKit.snare.triggerAttackRelease('16n', time)
    }
    if (time % 0.25 < 0.1)
      drumKit.hihat.triggerAttackRelease('8000', '32n', time)
  }
}
