/**
 * Audio Engine Utility
 * This module manages the AudioContext and Tone.js logic for both Rhythm Game music and UI SFX.
 * Note: This file contains side-effects (Tone.start, AudioContext creation) as per architectural design exceptions.
 */

import * as Tone from 'tone'
import { Midi } from '@tonejs/midi'
import { calculateTimeFromTicks } from './rhythmUtils'
import { SONGS_DB } from '../data/songs'

// Import all MIDI files as URLs
const midiGlob = import.meta.glob('../assets/*.mid', {
  query: '?url',
  import: 'default',
  eager: true
})

const MIN_NOTE_DURATION = 0.05

// Create a map of filename -> URL
// Key format in glob is "../assets/filename.mid"
// We want to match "filename.mid"
const midiUrlMap = Object.fromEntries(
  Object.entries(midiGlob).map(([path, url]) => {
    const filename = path.split('/').pop()
    return [filename, url]
  })
)

let guitar, bass, drumKit, loop, part
let sfxSynth, sfxGain
let isSetup = false
let playRequestId = 0

/**
 * Initializes the audio subsystem, including synths, effects, and master compressor.
 * @returns {Promise<void>}
 */
export async function setupAudio() {
  if (isSetup) return

  try {
    await Tone.start()
  } catch (e) {
    // Browser autoplay policy might block this; it will be resumed later via ensureAudioContext
    console.warn('[audioEngine] Tone.start() was blocked or failed:', e)
  }

  // Master Chain
  const masterComp = new Tone.Compressor(-30, 3).toDestination()

  // --- Guitar ---
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
  drumKit.kick.volume.value = 5
  drumKit.snare.volume.value = 2
  drumKit.hihat.volume.value = -10
  drumKit.crash.volume.value = -5

  // Instrument Volumes
  guitar.volume.value = 4
  bass.volume.value = 6

  // --- SFX Synth (Unified) ---
  sfxGain = new Tone.Gain(0.2).connect(masterComp)
  sfxSynth = new Tone.PolySynth(Tone.Synth).connect(sfxGain)

  isSetup = true
}

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
 * Plays a sound effect by type.
 * @param {string} type - The type of SFX ('hit', 'miss', 'menu', 'travel', 'cash').
 */
export function playSFX(type) {
  if (!isSetup || !sfxSynth) return

  const now = Tone.now()
  switch (type) {
    case 'hit':
      // High pitch success ping
      sfxSynth.triggerAttackRelease('A5', '16n', now)
      break
    case 'miss':
      // Low discordant buzz
      sfxSynth.triggerAttackRelease('D2', '8n', now)
      break
    case 'menu':
      // Gentle blip
      sfxSynth.triggerAttackRelease('C5', '32n', now, 0.3)
      break
    case 'travel':
      // Engine-like rumble using drum kick if available, or low synth
      if (drumKit && drumKit.kick) {
        drumKit.kick.triggerAttackRelease('C1', '8n', now, 0.5)
      } else {
        sfxSynth.triggerAttackRelease('G1', '8n', now, 0.5)
      }
      break
    case 'cash':
      // Bright chime/coin sound
      sfxSynth.triggerAttackRelease('B5', '16n', now, 0.4)
      sfxSynth.triggerAttackRelease('E6', '16n', now + 0.05, 0.4)
      break
    default:
      console.warn(`[audioEngine] Unknown SFX type: ${type}`)
      break
  }
}

/**
 * Sets the SFX volume.
 * @param {number} vol - Volume between 0 and 1.
 */
export function setSFXVolume(vol) {
  if (sfxGain) {
    // Convert 0-1 linear to decibels (approximate or use ramp)
    // Tone.Gain accepts linear values if units are default, but volume is typically db.
    // However, Tone.Gain.gain is linear amplitude.
    sfxGain.gain.rampTo(Math.max(0, Math.min(1, vol)), 0.1)
  }
}

/**
 * Plays a song using predefined note data.
 * @param {object} song - The song object containing `notes` and `bpm`.
 * @param {number} [delay=0] - Delay in seconds before starting.
 */
export async function playSongFromData(song, delay = 0) {
  const reqId = ++playRequestId
  await ensureAudioContext()
  if (reqId !== playRequestId) return

  stopAudioInternal()
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

  // Validate Audio Components
  if (!guitar || !bass || !drumKit) {
    console.error('playSongFromData: Audio components not initialized.')
    return
  }

  // Fallback if tempoMap is missing/empty
  const useTempoMap = Array.isArray(song.tempoMap) && song.tempoMap.length > 0

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
      let time = 0
      if (useTempoMap) {
        time = calculateTimeFromTicks(n.t, tpb, song.tempoMap, 's')
      } else {
        // Fallback: ticks -> seconds using constant BPM
        time = (n.t / tpb) * (60 / bpm)
      }

      // Clamp velocity 0-127 and normalize
      const rawVelocity = Math.max(0, Math.min(127, n.v))

      // Ensure time and delay are valid numbers
      const validDelay = Number.isFinite(delay) ? Math.max(0, delay) : 0
      const finalTime = Number.isFinite(time) ? time + validDelay : -1

      // Invalid times are caught by the filter below
      return {
        time: finalTime,
        note: n.p,
        velocity: rawVelocity / 127,
        lane: n.lane
      }
    })
    // Filter out notes with invalid or negative times to prevent clustering/errors
    .filter(e => Number.isFinite(e.time) && e.time >= 0)

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
  if (!drumKit) return
  // Basic GM Mapping
  switch (midiPitch) {
    case 35:
    case 36:
      drumKit.kick.triggerAttackRelease('C1', '16n', time, velocity)
      break
    case 38:
    case 40:
      drumKit.snare.triggerAttackRelease('16n', time, velocity)
      break
    case 42:
    case 44:
    case 46:
      drumKit.hihat.triggerAttackRelease(8000, '32n', time, velocity * 0.8)
      break
    case 49:
    case 57:
      drumKit.crash.triggerAttackRelease('C2', '8n', time, velocity)
      break
    case 51: // Ride Cymbal
    case 59:
      drumKit.hihat.triggerAttackRelease(6000, '16n', time, velocity * 0.6)
      break
    case 41: // Low Tom
    case 43:
      drumKit.kick.triggerAttackRelease('G1', '8n', time, velocity * 0.7)
      break
    case 45: // Mid Tom
    case 47:
      drumKit.kick.triggerAttackRelease('C2', '8n', time, velocity * 0.7)
      break
    default:
      // Default to HiHat for unknown percussion elements to keep rhythm
      drumKit.hihat.triggerAttackRelease(8000, '32n', time, velocity * 0.5)
  }
}

// The actual generation logic (Legacy / Fallback)
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
  const reqId = ++playRequestId
  await ensureAudioContext()
  if (reqId !== playRequestId) return

  stopAudioInternal()
  Tone.Transport.cancel()
  Tone.Transport.position = 0

  // Guard BPM against zero/negative/falsy values
  const rawBpm = song.bpm || 80 + (song.difficulty || 2) * 30
  const bpm = Math.max(1, rawBpm)

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

  // Explicit race condition check with cleanup for robustness
  if (reqId !== playRequestId) {
    if (loop) {
      loop.dispose()
      loop = null
    }
    return
  }

  Tone.Transport.start(Tone.now() + Math.max(0, delay))
}

/**
 * Stops the audio transport and disposes of the current loop.
 * Also invalidates any pending playback requests.
 */
export function stopAudio() {
  playRequestId++
  stopAudioInternal()
}

/**
 * Internal function to stop audio without invalidating pending requests.
 * Used by playback functions to clear previous state.
 */
function stopAudioInternal() {
  Tone.Transport.stop()
  if (loop) {
    loop.dispose()
    loop = null
  }
  if (part) {
    part.dispose()
    part = null
  }
  Tone.Transport.cancel()
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
 * Disposes of audio engine resources.
 */
export function disposeAudio() {
  playRequestId++
  stopAudioInternal()
  if (guitar) guitar.dispose()
  if (bass) bass.dispose()
  if (drumKit) {
    drumKit.kick.dispose()
    drumKit.snare.dispose()
    drumKit.hihat.dispose()
    drumKit.crash.dispose()
  }
  if (sfxSynth) sfxSynth.dispose()
  if (sfxGain) sfxGain.dispose()

  guitar = null
  bass = null
  drumKit = null
  sfxSynth = null
  sfxGain = null
  isSetup = false
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
    drumKit.hihat.triggerAttackRelease(8000, '32n', time, 0.5)
  } else {
    if (note === 'E2' || random() < diff * 0.1) {
      drumKit.kick.triggerAttackRelease('C1', '8n', time)
    }
    if (random() > 0.9) {
      drumKit.snare.triggerAttackRelease('16n', time)
    }
    // Fix floating point tolerance issues
    const beatPhase = time % 0.25
    if (beatPhase < 0.1 || beatPhase > 0.24) {
      drumKit.hihat.triggerAttackRelease(8000, '32n', time)
    }
  }
}

// --- New MIDI Logic ---

/**
 * Plays a MIDI file from a URL.
 * @param {string} filename - The filename of the MIDI (key in url map).
 * @param {number} [offset=0] - Start offset in seconds.
 * @param {boolean} [loop=false] - Whether to loop the playback.
 * @param {number} [delay=0] - Delay in seconds before starting playback.
 */
export async function playMidiFile(
  filename,
  offset = 0,
  loop = false,
  delay = 0
) {
  const reqId = ++playRequestId
  await ensureAudioContext()
  if (reqId !== playRequestId) return

  stopAudioInternal()
  Tone.Transport.cancel()

  const url = midiUrlMap[filename]
  if (!url) {
    console.error(`[audioEngine] MIDI file not found in assets: ${filename}`)
    return
  }

  try {
    const response = await fetch(url)
    if (reqId !== playRequestId) return
    if (!response.ok) throw new Error(`Failed to load MIDI: ${url}`)
    const arrayBuffer = await response.arrayBuffer()
    if (reqId !== playRequestId) return

    const midi = new Midi(arrayBuffer)
    if (reqId !== playRequestId) return // Optimization: fail fast before expensive scheduling

    if (midi.header.tempos.length > 0) {
      Tone.Transport.bpm.value = midi.header.tempos[0].bpm
    }

    midi.tracks.forEach(track => {
      track.notes.forEach(note => {
        // Filter out invalid times
        if (!Number.isFinite(note.time) || note.time < 0) return

        // Schedule notes
        Tone.Transport.schedule(time => {
          if (!guitar || !bass || !drumKit) return

          try {
            // Clamp duration to prevent "duration must be greater than 0" error
            const duration = Math.max(
              MIN_NOTE_DURATION,
              Number.isFinite(note.duration) ? note.duration : MIN_NOTE_DURATION
            )

            // Clamp velocity
            const velocity = Math.max(
              0,
              Math.min(1, Number.isFinite(note.velocity) ? note.velocity : 1)
            )

            // Basic Mapping
            // Percussion (Channel 10, index 9)
            if (track.instrument.percussion || track.channel === 9) {
              playDrumNote(note.midi, time, velocity)
            } else {
              // Instrument separation by pitch heuristic
              if (note.midi < 45) {
                // Bass range
                bass.triggerAttackRelease(
                  Tone.Frequency(note.midi, 'midi'),
                  duration,
                  time,
                  velocity
                )
              } else {
                // Guitar/Lead range
                guitar.triggerAttackRelease(
                  Tone.Frequency(note.midi, 'midi'),
                  duration,
                  time,
                  velocity
                )
              }
            }
          } catch (e) {
            // Prevent single note errors from crashing the loop
            console.warn('[audioEngine] Note scheduling error:', e)
          }
        }, note.time)
      })
    })

    if (loop) {
      Tone.Transport.loop = true
      Tone.Transport.loopEnd = midi.duration
      Tone.Transport.loopStart = 0
    } else {
      Tone.Transport.loop = false
    }

    const validDelay = Number.isFinite(delay) ? Math.max(0, delay) : 0
    const validOffset = Number.isFinite(offset) ? Math.max(0, offset) : 0

    Tone.Transport.start(Tone.now() + validDelay, validOffset)
  } catch (err) {
    console.error('[audioEngine] Error playing MIDI:', err)
  }
}

/**
 * Plays a random MIDI file from the available set for ambient music.
 * @param {Array} [songs] - List of song objects to choose from.
 * @param {Function} [rng] - Random number generator function.
 * @returns {Promise<void>}
 */
export async function playRandomAmbientMidi(
  songs = SONGS_DB,
  rng = Math.random
) {
  if (songs.length === 0) return

  // Filter only songs that have a sourceMid
  const validSongs = songs.filter(s => s.sourceMid)
  if (validSongs.length === 0) return

  const randomSong = validSongs[Math.floor(rng() * validSongs.length)]
  console.log(`[audioEngine] Playing ambient: ${randomSong.name}`)
  return playMidiFile(randomSong.sourceMid, 0, true)
}

/**
 * Returns the current audio clock time in milliseconds.
 * Uses the Tone.js AudioContext clock so visual elapsed time stays
 * tightly coupled to the audio transport, preventing drift that occurs
 * when mixing Date.now() with Tone scheduling.
 * @returns {number} Current audio time in ms.
 */
export function getAudioTimeMs() {
  return Tone.now() * 1000
}

/**
 * Plays a specific note immediately (Hit Sound).
 * @param {number} midiPitch - The MIDI note number.
 * @param {string} lane - The lane ID ('guitar', 'bass', 'drums').
 * @param {number} [velocity=127] - The velocity (0-127).
 */
export function playNote(midiPitch, lane, velocity = 127) {
  if (!isSetup) return
  const now = Tone.now()
  const vel = Math.max(0, Math.min(1, velocity / 127))

  // Use the lane to determine instrument, fallback to pitch heuristics if needed
  if (lane === 'drums') {
    playDrumNote(midiPitch, now, vel)
  } else if (lane === 'bass') {
    if (bass)
      bass.triggerAttackRelease(
        Tone.Frequency(midiPitch, 'midi'),
        '8n',
        now,
        vel
      )
  } else {
    // Guitar (or default)
    if (guitar)
      guitar.triggerAttackRelease(
        Tone.Frequency(midiPitch, 'midi'),
        '16n',
        now,
        vel
      )
  }
}
