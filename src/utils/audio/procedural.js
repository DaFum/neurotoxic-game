import * as Tone from 'tone'
import * as ToneJsMidi from '@tonejs/midi'
import { logger } from '../logger.js'
import { audioState } from './state.js'
import { MIN_NOTE_DURATION, MAX_NOTE_DURATION } from './constants.js'
import { ensureAudioContext } from './setup.js'
import { stopAudio, stopAudioInternal } from './playback.js'
import { midiUrlMap, oggCandidates, loadAudioBuffer } from './assets.js'
import { createAndConnectBufferSource } from './sharedBufferUtils.js'
import { calculateTimeFromTicks, preprocessTempoMap } from '../rhythmUtils.js'
import { selectRandomItem } from './selectionUtils.js'
import {
  resolveAssetUrl,
  normalizeMidiPlaybackOptions
} from './playbackUtils.js'
import {
  isPercussionTrack,
  isValidMidiNote,
  normalizeMidiPitch,
  getNoteName
} from './midiUtils.js'
import { SONGS_DB } from '../../data/songs.js'

const MidiParser = ToneJsMidi?.Midi ?? ToneJsMidi?.default?.Midi ?? null

// ⚡ BOLT OPTIMIZATION: Static mapping for O(1) drum lookup
const DRUM_MAPPING = {
  // Kick
  35: { part: 'kick', note: 'C1', duration: '8n' },
  36: { part: 'kick', note: 'C1', duration: '8n' },
  // Snare (LayeredSnare takes duration, time, velocity)
  37: { part: 'snare', duration: '32n', velScale: 0.4 },
  38: { part: 'snare', duration: '16n' },
  40: { part: 'snare', duration: '16n' },
  // HiHat (MetalSynth takes frequency, duration, time, velocity)
  42: { part: 'hihat', freq: 8000, duration: '32n', velScale: 0.7 },
  44: { part: 'hihat', freq: 8000, duration: '32n', velScale: 0.7 },
  46: { part: 'hihat', freq: 6000, duration: '16n', velScale: 0.8 },
  // Crash
  49: { part: 'crash', freq: 4000, duration: '4n', velScale: 0.7 },
  57: { part: 'crash', freq: 4000, duration: '4n', velScale: 0.7 },
  // Ride (mapped to HiHat)
  51: { part: 'hihat', freq: 5000, duration: '8n', velScale: 0.5 },
  59: { part: 'hihat', freq: 5000, duration: '8n', velScale: 0.5 },
  // Toms (mapped to Kick)
  41: { part: 'kick', note: 'G1', duration: '8n', velScale: 0.8 },
  43: { part: 'kick', note: 'G1', duration: '8n', velScale: 0.8 },
  45: { part: 'kick', note: 'D2', duration: '8n', velScale: 0.7 },
  47: { part: 'kick', note: 'D2', duration: '8n', velScale: 0.7 },
  48: { part: 'kick', note: 'A2', duration: '8n', velScale: 0.6 },
  50: { part: 'kick', note: 'A2', duration: '8n', velScale: 0.6 }
}

/**
 * Triggers a specific drum sound based on MIDI pitch.
 * @param {number} midiPitch - The MIDI note number.
 * @param {number} time - The time to trigger the note.
 * @param {number} velocity - The velocity of the note (0-1).
 */
function playDrumNote(midiPitch, time, velocity, kit = audioState.drumKit) {
  if (!kit) return
  try {
    const map = DRUM_MAPPING[midiPitch]
    if (map) {
      const vel = velocity * (map.velScale ?? 1)
      if (map.part === 'kick') {
        kit.kick.triggerAttackRelease(map.note, map.duration, time, vel)
      } else if (map.part === 'snare') {
        kit.snare.triggerAttackRelease(map.duration, time, vel)
      } else if (map.part === 'hihat') {
        kit.hihat.triggerAttackRelease(map.freq, map.duration, time, vel)
      } else if (map.part === 'crash') {
        kit.crash.triggerAttackRelease(map.freq, map.duration, time, vel)
      }
    } else {
      // Default to closed HiHat for unknown percussion
      kit.hihat.triggerAttackRelease(8000, '32n', time, velocity * 0.4)
    }
  } catch (e) {
    logger.warn('AudioEngine', `Drum trigger failed for pitch ${midiPitch}`, e)
  }
}

/**
 * Plays a specific note at a scheduled Tone.js time.
 * @param {number} midiPitch - The MIDI note number.
 * @param {string} lane - The lane ID ('guitar', 'bass', 'drums').
 * @param {number} whenSeconds - Tone.js time in seconds.
 * @param {number} [velocity=127] - The velocity (0-127).
 */
export function playNoteAtTime(midiPitch, lane, whenSeconds, velocity = 127) {
  if (!audioState.isSetup) return
  const now = Number.isFinite(whenSeconds) ? whenSeconds : Tone.now()
  const vel = Math.max(0, Math.min(1, velocity / 127))

  // Use the lane to determine instrument, fallback to pitch heuristics if needed
  if (lane === 'drums') {
    playDrumNote(midiPitch, now, vel)
  } else if (lane === 'bass') {
    if (audioState.bass) {
      // ⚡ BOLT OPTIMIZATION: Use pre-computed note string
      audioState.bass.triggerAttackRelease(
        getNoteName(midiPitch),
        '8n',
        now,
        vel
      )
    }
  } else if (audioState.guitar) {
    // Guitar (or default)
    // ⚡ BOLT OPTIMIZATION: Use pre-computed note string
    audioState.guitar.triggerAttackRelease(
      getNoteName(midiPitch),
      '16n',
      now,
      vel
    )
  }
}

/**
 * Plays a song using predefined note data.
 * @param {object} song - The song object containing `notes` and `bpm`.
 * @param {number} [delay=0] - Delay in seconds before starting.
 */
export async function playSongFromData(song, delay = 0, options = {}) {
  const { onEnded } = normalizeMidiPlaybackOptions(options)
  const reqId = ++audioState.playRequestId
  const unlocked = await ensureAudioContext()
  if (!unlocked) return false
  if (reqId !== audioState.playRequestId) return false

  stopAudioInternal()
  Tone.getTransport().cancel()
  Tone.getTransport().position = 0

  const bpm = Math.max(1, song.bpm || 120) // Ensure BPM is positive
  const tpb = Math.max(1, song.tpb || 480) // Ensure TPB is positive
  Tone.getTransport().bpm.value = bpm

  // Validate notes
  if (!Array.isArray(song.notes)) {
    logger.error('AudioEngine', 'playSongFromData: song.notes is not an array')
    return false
  }

  // Validate Audio Components
  if (!audioState.guitar || !audioState.bass || !audioState.drumKit) {
    logger.error(
      'AudioEngine',
      'playSongFromData: Audio components not initialized.'
    )
    return false
  }

  // Fallback if tempoMap is missing/empty
  const useTempoMap = Array.isArray(song.tempoMap) && song.tempoMap.length > 0
  const activeTempoMap = useTempoMap
    ? preprocessTempoMap(song.tempoMap, tpb)
    : []
  const validDelay = Number.isFinite(delay) ? Math.max(0, delay) : 0

  // ⚡ BOLT OPTIMIZATION: Single-pass O(N) loop replaces 4 array passes (filter->map->filter->reduce)
  // Minimizes garbage collection spikes and main-thread blocking during song initialization.
  const events = []
  let lastTime = 0

  for (let i = 0; i < song.notes.length; i++) {
    const n = song.notes[i]

    // Validate note data
    if (
      typeof n.t !== 'number' ||
      !isFinite(n.t) ||
      typeof n.p !== 'number' ||
      !isFinite(n.p) ||
      typeof n.v !== 'number' ||
      !isFinite(n.v)
    ) {
      continue
    }

    const time = useTempoMap
      ? calculateTimeFromTicks(n.t, tpb, activeTempoMap, 's')
      : (n.t / tpb) * (60 / bpm)

    // Delay is applied once when Transport starts; keep note times relative.
    const finalTime = Number.isFinite(time) ? time : -1

    // Filter out notes with invalid or negative times to prevent clustering/errors
    if (finalTime >= 0) {
      const rawVelocity = Math.max(0, Math.min(127, n.v))

      // Track the maximum time in this pass to avoid a subsequent .reduce()
      if (finalTime > lastTime) {
        lastTime = finalTime
      }

      // ⚡ BOLT OPTIMIZATION: Pre-compute note names to avoid audio-thread allocation
      const noteName =
        n.lane !== 'drums' ? getNoteName(n.p) : null

      events.push({
        time: finalTime,
        note: n.p,
        noteName, // Store pre-computed string
        velocity: rawVelocity / 127,
        lane: n.lane
      })
    }
  }

  if (events.length === 0) {
    logger.warn(
      'AudioEngine',
      'playSongFromData: No valid notes found to schedule'
    )
    return false
  }

  audioState.part = new Tone.Part((time, value) => {
    if (!audioState.guitar || !audioState.bass || !audioState.drumKit) return

    // Use pre-computed noteName or fallback if missing (though it should be present)
    const noteName =
      value.noteName ?? getNoteName(value.note)

    if (value.lane === 'guitar') {
      audioState.guitar.triggerAttackRelease(
        noteName,
        '16n',
        time,
        value.velocity
      )
    } else if (value.lane === 'bass') {
      audioState.bass.triggerAttackRelease(noteName, '8n', time, value.velocity)
    } else if (value.lane === 'drums') {
      playDrumNote(value.note, time, value.velocity)
    }
  }, events).start(0)

  // Schedule Transport.start in advance to prevent pops/crackles
  // Add minimum 100ms lookahead for reliable scheduling
  const minLookahead = 0.1
  const startTime = Tone.now() + Math.max(minLookahead, validDelay)

  if (onEnded) {
    // ⚡ BOLT OPTIMIZATION: Use pre-calculated lastTime instead of a fourth reduce pass
    const duration = lastTime + Tone.Time('4n').toSeconds()

    Tone.getTransport().scheduleOnce(() => {
      if (reqId !== audioState.playRequestId) return
      onEnded()
    }, duration)
  }

  Tone.getTransport().start(startTime)
  return true
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
    audioState.drumKit.kick.triggerAttackRelease('C1', '16n', time)
    if (random() > 0.5) {
      audioState.drumKit.snare.triggerAttackRelease('16n', time)
    }
    audioState.drumKit.hihat.triggerAttackRelease(8000, '32n', time, 0.5)
  } else {
    if (note === 'E2' || random() < diff * 0.1) {
      audioState.drumKit.kick.triggerAttackRelease('C1', '8n', time)
    }
    if (random() > 0.9) {
      audioState.drumKit.snare.triggerAttackRelease('16n', time)
    }
    // Hihat on the beat — the 0.1 lower bound is intentional for musical density
    const beatPhase = time % 0.25
    if (beatPhase < 0.1 || beatPhase > 0.24) {
      audioState.drumKit.hihat.triggerAttackRelease(8000, '32n', time)
    }
  }
}

// The actual generation logic (Legacy / Fallback)
/**
 * Starts the procedural metal music generator for a specific song configuration.
 * @param {object} song - The song object containing metadata like BPM and difficulty.
 * @param {number} [delay=0] - Delay in seconds before the audio starts.
 * @param {Function} [random=Math.random] - RNG function for deterministic generation.
 * @returns {Promise<boolean>}
 */
export async function startMetalGenerator(
  song,
  delay = 0,
  options = {},
  random = Math.random
) {
  const { onEnded } = normalizeMidiPlaybackOptions(options)
  const reqId = ++audioState.playRequestId
  const unlocked = await ensureAudioContext()
  if (!unlocked) return false
  if (reqId !== audioState.playRequestId) return false

  stopAudioInternal()
  Tone.getTransport().cancel()
  Tone.getTransport().position = 0

  // Guard BPM against zero/negative/falsy values
  // Use ?? for difficulty to correctly handle 0 as a valid difficulty
  const rawBpm = song.bpm || 80 + (song.difficulty ?? 2) * 30
  const bpm = Math.max(1, rawBpm)

  Tone.getTransport().bpm.value = bpm

  const pattern = generateRiffPattern(song.difficulty || 2, random)

  audioState.loop = new Tone.Sequence(
    (time, note) => {
      if (!audioState.guitar || !audioState.drumKit) return

      if (note) audioState.guitar.triggerAttackRelease(note, '16n', time)

      playDrumsLegacy(time, song.difficulty || 2, note, random)
    },
    pattern,
    '16n'
  )

  audioState.loop.start(0)

  // Explicit race condition check with cleanup for robustness
  if (reqId !== audioState.playRequestId) {
    if (audioState.loop) {
      audioState.loop.dispose()
      audioState.loop = null
    }
    return false
  }

  // Schedule Transport.start in advance to prevent pops/crackles
  // Using "+0.1" schedules 100ms ahead for reliable scheduling
  const startDelay = Math.max(0.1, delay)

  const duration =
    song.duration ||
    (song.excerptDurationMs ? song.excerptDurationMs / 1000 : 0)

  if (duration > 0 && onEnded) {
    Tone.getTransport().scheduleOnce(() => {
      if (reqId !== audioState.playRequestId) return
      onEnded()
    }, duration)
  }

  Tone.getTransport().start(`+${startDelay}`)
  return true
}

/**
 * Handles the initial setup for MIDI playback, including request ID generation.
 * @param {string} filename - The filename of the MIDI.
 * @param {number} offset - Start offset in seconds.
 * @param {boolean} loop - Whether to loop the playback.
 * @param {number|null} ownedRequestId - Internal request ownership override.
 * @returns {number} The new request ID.
 */
function initializePlaybackRequest(filename, offset, loop, ownedRequestId) {
  logger.debug(
    'AudioEngine',
    `Request playMidiFile: ${filename}, offset=${offset}, loop=${loop}`
  )
  const reqId =
    Number.isInteger(ownedRequestId) && ownedRequestId > 0
      ? ownedRequestId
      : ++audioState.playRequestId
  logger.debug('AudioEngine', `New playRequestId: ${reqId}`)
  return reqId
}

/**
 * Resolves the URL for a MIDI file.
 * @param {string} filename - The filename of the MIDI.
 * @returns {string|null} The resolved URL or null if not found.
 */
function resolveMidiUrl(filename) {
  const baseUrl = import.meta.env.BASE_URL || './'
  const publicBasePath = `${baseUrl}assets`
  const { url, source } = resolveAssetUrl(filename, midiUrlMap, publicBasePath)
  logger.debug(
    'AudioEngine',
    `Resolved MIDI URL for ${filename}: ${url} (source=${source ?? 'none'})`
  )

  if (!url) {
    logger.error('AudioEngine', `MIDI file not found in assets: ${filename}`)
    return null
  }
  return url
}

/**
 * Fetches the MIDI file as an ArrayBuffer.
 * @param {string} url - The URL of the MIDI file.
 * @param {number} reqId - The request ID to validate against.
 * @param {string} filename - The filename for logging.
 * @returns {Promise<ArrayBuffer|null>} The MIDI data or null on failure.
 */
async function fetchMidiArrayBuffer(url, reqId, filename) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      10000 // 10s timeout for MIDI fetch
    )
    let arrayBuffer = null
    try {
      const response = await fetch(url, { signal: controller.signal })
      if (reqId !== audioState.playRequestId) return null
      if (!response.ok) throw new Error(`Failed to load MIDI: ${url}`)
      arrayBuffer = await response.arrayBuffer()
    } finally {
      clearTimeout(timeoutId)
    }
    return arrayBuffer
  } catch (err) {
    if (err.name === 'AbortError') {
      logger.warn('AudioEngine', `MIDI fetch timed out for "${filename}"`)
    } else {
      logger.error('AudioEngine', 'Error playing MIDI:', err)
    }
    return null
  }
}

/**
 * Parses the MIDI ArrayBuffer.
 * @param {ArrayBuffer} arrayBuffer - The MIDI data.
 * @returns {object|null} The parsed MIDI object or null on failure.
 */
function parseMidiData(arrayBuffer) {
  if (!MidiParser) {
    logger.error(
      'AudioEngine',
      'MidiParser failed to load from @tonejs/midi. This disables all MIDI playback. Try: npm install @tonejs/midi --force and restart the dev server. If the issue persists, check bundler ESM/CJS interop configuration.'
    )
    return null
  }
  const midi = new MidiParser(arrayBuffer)
  logger.debug('AudioEngine', `MIDI loaded. Duration: ${midi.duration}s`)

  if (midi.duration <= 0) {
    logger.warn(
      'AudioEngine',
      `MIDI duration is ${midi.duration}s. Skipping playback.`
    )
    return null
  }
  return midi
}

/**
 * Creates Tone.Parts for each track in the MIDI file.
 * @param {object} midi - The parsed MIDI object.
 * @param {boolean} useCleanPlayback - If true, bypass FX for MIDI playback.
 * @returns {Array} An array of created Tone.Part objects.
 */
function createMidiParts(midi, useCleanPlayback) {
  const leadSynth = useCleanPlayback ? audioState.midiLead : audioState.guitar
  const bassSynth = useCleanPlayback ? audioState.midiBass : audioState.bass
  const drumSet = useCleanPlayback
    ? audioState.midiDrumKit
    : audioState.drumKit

  const nextMidiParts = []
  midi.tracks.forEach(track => {
    const notes = Array.isArray(track?.notes) ? track.notes : []
    const percussionTrack = isPercussionTrack(track)

    // ⚡ BOLT OPTIMIZATION: Single-pass iteration to filter, normalize, and pre-compute note names
    // Replaces previous buildMidiTrackEvents + map approach to reduce allocation and GC pressure.
    const eventsWithFrequencies = []

    for (const note of notes) {
      if (!Number.isFinite(note?.time) || note.time < 0) continue
      const midiPitch = normalizeMidiPitch(note)
      if (midiPitch == null) continue

      const evt = {
        time: note.time,
        midiPitch,
        duration: note.duration,
        velocity: note.velocity,
        percussionTrack
      }

      // Pre-compute note name using cached lookup table
      if (!percussionTrack) {
        evt.frequencyNote = getNoteName(midiPitch)
      }

      eventsWithFrequencies.push(evt)
    }

    if (eventsWithFrequencies.length === 0) return

    const trackPart = new Tone.Part((time, value) => {
      if (!leadSynth || !bassSynth || !drumSet) return

      // Since we filtered in the loop, we know midiPitch is valid (0-127).
      // We skip redundant isValidMidiNote/normalizeMidiPitch checks here for performance.
      const midiPitch = value.midiPitch

      try {
        // Clamp duration to prevent "duration must be greater than 0" error
        // and cap at MAX_NOTE_DURATION to prevent resource exhaustion
        const duration = Math.min(
          MAX_NOTE_DURATION,
          Math.max(
            MIN_NOTE_DURATION,
            Number.isFinite(value?.duration)
              ? value.duration
              : MIN_NOTE_DURATION
          )
        )

        // Clamp velocity
        const velocity = Math.max(
          0,
          Math.min(1, Number.isFinite(value?.velocity) ? value.velocity : 1)
        )

        if (value?.percussionTrack) {
          playDrumNote(midiPitch, time, velocity, drumSet)
          return
        }

        // Use pre-computed frequency note string from cache
        const freq = value.frequencyNote ?? getNoteName(midiPitch)

        if (midiPitch < 45) {
          bassSynth.triggerAttackRelease(freq, duration, time, velocity)
        } else {
          leadSynth.triggerAttackRelease(freq, duration, time, velocity)
        }
      } catch (e) {
        // Prevent single note errors from crashing the loop
        logger.warn('AudioEngine', 'Note scheduling error:', e)
      }
    }, eventsWithFrequencies)

    trackPart.start(0)
    nextMidiParts.push(trackPart)
  })
  return nextMidiParts
}

/**
 * Configures the Transport and schedules playback.
 * @param {object} midi - The parsed MIDI object.
 * @param {object} params - Parameters for scheduling.
 */
function scheduleMidiTransport(midi, params) {
  const {
    reqId,
    filename,
    offset,
    loop,
    delay,
    onEnded,
    stopAfterSeconds,
    startTimeSec
  } = params

  if (midi.header.tempos.length > 0) {
    Tone.getTransport().bpm.value = midi.header.tempos[0].bpm
  }

  const validDelay = Number.isFinite(delay) ? Math.max(0, delay) : 0
  let requestedOffset = Number.isFinite(offset) ? Math.max(0, offset) : 0
  const duration = Number.isFinite(midi.duration) ? midi.duration : 0

  // Reset offset when it is at or beyond duration to ensure sound plays.
  if (duration > 0 && requestedOffset >= duration) {
    logger.warn(
      'AudioEngine',
      `Offset ${requestedOffset}s exceeds duration ${duration}s. Resetting to 0.`
    )
    requestedOffset = 0
  }

  logger.debug(
    'AudioEngine',
    `Starting Transport. Delay=${validDelay}, Offset=${requestedOffset}`
  )

  if (loop) {
    Tone.getTransport().loop = true
    Tone.getTransport().loopEnd = midi.duration
    // Loop from excerpt start, so intros don't restart on every loop
    Tone.getTransport().loopStart = requestedOffset
  } else {
    Tone.getTransport().loop = false
  }

  if (!loop && onEnded && duration > 0) {
    audioState.transportEndEventId = Tone.getTransport().scheduleOnce(() => {
      if (reqId !== audioState.playRequestId) return
      onEnded({
        filename,
        duration,
        offsetSeconds: requestedOffset
      })
    }, duration)
  }

  if (!loop && Number.isFinite(stopAfterSeconds) && stopAfterSeconds > 0) {
    const stopTime = requestedOffset + stopAfterSeconds
    audioState.transportStopEventId = Tone.getTransport().scheduleOnce(() => {
      if (reqId !== audioState.playRequestId) return
      stopAudio()
    }, stopTime)
  }

  // Schedule Transport.start in advance to prevent pops/crackles
  // Add minimum 100ms lookahead for reliable scheduling
  const minLookahead = 0.1
  const transportStartTime = Number.isFinite(startTimeSec)
    ? startTimeSec
    : Tone.now() + Math.max(minLookahead, validDelay)

  Tone.getTransport().start(transportStartTime, requestedOffset)
}

/**
 * Plays a MIDI file from a URL.
 * @param {string} filename - The filename of the MIDI (key in url map).
 * @param {number} [offset=0] - Start offset in seconds.
 * @param {boolean} [loop=false] - Whether to loop the playback.
 * @param {number} [delay=0] - Delay in seconds before starting playback.
 * @param {object} [options] - Playback options.
 * @param {boolean} [options.useCleanPlayback=true] - If true, bypass FX for MIDI playback.
 * @param {Function} [options.onEnded] - Callback invoked after playback ends.
 * @param {number} [options.stopAfterSeconds] - Optional playback duration limit in seconds.
 * @param {number} [options.startTimeSec] - Absolute Tone.js time to start playback.
 * @param {number|null} [ownedRequestId=null] - Internal request ownership override.
 */
async function playMidiFileInternal(
  filename,
  offset = 0,
  loop = false,
  delay = 0,
  options = {},
  ownedRequestId = null
) {
  const { onEnded, useCleanPlayback, stopAfterSeconds, startTimeSec } =
    normalizeMidiPlaybackOptions(options)

  const reqId = initializePlaybackRequest(filename, offset, loop, ownedRequestId)

  const unlocked = await ensureAudioContext()
  if (!unlocked) {
    logger.warn('AudioEngine', 'Cannot play MIDI: AudioContext is locked')
    return false
  }

  if (reqId !== audioState.playRequestId) {
    logger.debug(
      'AudioEngine',
      `Request cancelled during ensureAudioContext (reqId: ${reqId} vs ${audioState.playRequestId})`
    )
    return false
  }

  stopAudioInternal()
  Tone.getTransport().cancel()

  const url = resolveMidiUrl(filename)
  if (!url) return false

  const arrayBuffer = await fetchMidiArrayBuffer(url, reqId, filename)
  if (!arrayBuffer) return false
  if (reqId !== audioState.playRequestId) return false

  const midi = parseMidiData(arrayBuffer)
  if (!midi) return false
  if (reqId !== audioState.playRequestId) return false

  const parts = createMidiParts(midi, useCleanPlayback)
  audioState.midiParts = parts

  scheduleMidiTransport(midi, {
    reqId,
    filename,
    offset,
    loop,
    delay,
    onEnded,
    stopAfterSeconds,
    startTimeSec
  })

  return true
}

/**
 * Plays a MIDI file from a URL.
 * @param {string} filename - The filename of the MIDI (key in url map).
 * @param {number} [offset=0] - Start offset in seconds.
 * @param {boolean} [loop=false] - Whether to loop the playback.
 * @param {number} [delay=0] - Delay in seconds before starting playback.
 * @param {object} [options] - Playback options.
 * @param {boolean} [options.useCleanPlayback=true] - If true, bypass FX for MIDI playback.
 * @param {Function} [options.onEnded] - Callback invoked after playback ends.
 * @param {number} [options.stopAfterSeconds] - Optional playback duration limit in seconds.
 * @param {number} [options.startTimeSec] - Absolute Tone.js time to start playback.
 */
export async function playMidiFile(
  filename,
  offset = 0,
  loop = false,
  delay = 0,
  options = {}
) {
  return playMidiFileInternal(filename, offset, loop, delay, options)
}

/**
 * Plays a random MIDI file from the available set for ambient music.
 * @param {Array} [songs] - Song metadata array for excerpt offset lookup.
 * @param {Function} [rng] - Random number generator function.
 * @returns {Promise<boolean>} Whether playback started successfully.
 */
export async function playRandomAmbientMidi(
  songs = SONGS_DB,
  rng = Math.random
) {
  logger.debug('AudioEngine', 'playRandomAmbientMidi called')
  // Requirement: Stop transport before starting ambient
  stopAudio()
  const reqId = audioState.playRequestId

  const midiFiles = Object.keys(midiUrlMap)
  if (midiFiles.length === 0) {
    logger.warn('AudioEngine', 'No MIDI files found in midiUrlMap')
    return false
  }

  // Requirement: pick a random MIDI from the assets folder
  const filename = selectRandomItem(midiFiles, rng)
  if (!filename) {
    logger.warn('AudioEngine', 'Random MIDI selection returned null')
    return false
  }

  // If the MIDI is known in SONGS_DB, we might use metadata, but for Ambient we always start from 0
  const meta = songs.find(s => s.sourceMid === filename)
  // Requirement: Ambient always plays from the beginning (0s)
  const offsetSeconds = 0

  logger.debug(
    'AudioEngine',
    `Playing ambient: ${meta?.name ?? filename} (offset ${offsetSeconds}s)`
  )
  return playMidiFileInternal(
    filename,
    offsetSeconds,
    false,
    0,
    {
      useCleanPlayback: true,
      onEnded: () => {
        if (reqId !== audioState.playRequestId) {
          logger.debug(
            'AudioEngine',
            `Ambient MIDI chain cancelled (reqId ${reqId} vs current ${audioState.playRequestId}).`
          )
          return
        }
        logger.debug(
          'AudioEngine',
          'Ambient MIDI track ended, chaining next track.'
        )
        playRandomAmbientMidi(songs, rng).catch(error => {
          logger.error(
            'AudioEngine',
            'Failed to start next ambient MIDI track',
            error
          )
        })
      }
    },
    reqId
  )
}

/**
 * Plays a random OGG file from the bundled assets for ambient music.
 * Uses raw AudioBufferSourceNode connected to the musicGain bus for
 * lower CPU usage and better quality than MIDI synthesis.
 * @param {Function} [rng] - Random number generator function.
 * @param {object} [options] - Playback options.
 * @param {boolean} [options.skipStop=false] - Skip internal stopAudio() when caller already stopped audio.
 * @returns {Promise<boolean>} Whether playback started successfully.
 */
export async function playRandomAmbientOgg(
  rng = Math.random,
  { skipStop = false } = {}
) {
  logger.debug('AudioEngine', 'playRandomAmbientOgg called')
  // Skip stopAudio() when caller has already stopped audio to avoid double-stop
  // and unnecessary playRequestId increments (e.g., AudioManager.startAmbient calls stopMusic first)
  if (!skipStop) {
    stopAudio()
  }

  if (oggCandidates.length === 0) {
    logger.warn('AudioEngine', 'No OGG files available for ambient playback')
    return false
  }

  const filename = selectRandomItem(oggCandidates, rng)
  if (!filename) {
    logger.warn('AudioEngine', 'Random OGG selection returned null')
    return false
  }

  const reqId = ++audioState.playRequestId
  const unlocked = await ensureAudioContext()
  if (!unlocked) return false
  if (reqId !== audioState.playRequestId) return false

  const buffer = await loadAudioBuffer(filename)
  if (!buffer) return false
  if (reqId !== audioState.playRequestId) return false

  const source = createAndConnectBufferSource(buffer)
  if (!source) return false

  audioState.ambientSource = source
  const chainReqId = audioState.playRequestId

  source.onended = () => {
    if (audioState.ambientSource !== source) {
      logger.debug(
        'AudioEngine',
        'Ambient OGG onended: source mismatch, skipping chain.'
      )
      return
    }
    if (chainReqId !== audioState.playRequestId) {
      logger.debug(
        'AudioEngine',
        `Ambient OGG chain cancelled (reqId ${chainReqId} vs current ${audioState.playRequestId}).`
      )
      return
    }
    audioState.ambientSource = null
    logger.debug('AudioEngine', 'Ambient OGG track ended, chaining next track.')
    playRandomAmbientOgg(rng).catch(error => {
      logger.error(
        'AudioEngine',
        'Failed to chain next ambient OGG track',
        error
      )
    })
  }

  source.start()
  logger.debug(
    'AudioEngine',
    `Ambient OGG started: ${filename} (${buffer.duration.toFixed(1)}s)`
  )
  return true
}
