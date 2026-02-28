import * as Tone from 'tone'
import * as ToneJsMidi from '@tonejs/midi'
import { logger } from '../logger.js'
import { audioState } from './state.js'
import { MIN_NOTE_DURATION, MAX_NOTE_DURATION } from './constants.js'
import { ensureAudioContext } from './setup.js'
import { stopAudio, stopAudioInternal } from './playback.js'
import { midiUrlMap } from './assets.js'
import { calculateTimeFromTicks, preprocessTempoMap } from '../rhythmUtils.js'
import {
  resolveAssetUrl,
  normalizeMidiPlaybackOptions,
  prepareTransportPlayback
} from './playbackUtils.js'
import {
  isPercussionTrack,
  normalizeMidiPitch,
  getNoteName
} from './midiUtils.js'
import { playDrumNote } from './drumMappings.js'

const MidiParser = ToneJsMidi?.Midi ?? ToneJsMidi?.default?.Midi ?? null

/**
 * Internal helper to trigger instrument notes.
 */
function triggerInstrumentNote(
  lane,
  midiPitch,
  time,
  velocity,
  noteName = null
) {
  if (lane === 'drums') {
    playDrumNote(midiPitch, time, velocity)
  } else if (lane === 'bass') {
    if (audioState.bass) {
      audioState.bass.triggerAttackRelease(
        noteName ?? getNoteName(midiPitch),
        '8n',
        time,
        velocity
      )
    }
  } else if (audioState.guitar) {
    audioState.guitar.triggerAttackRelease(
      noteName ?? getNoteName(midiPitch),
      '16n',
      time,
      velocity
    )
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
  triggerInstrumentNote(lane, midiPitch, now, vel)
}

/**
 * Plays a song using predefined note data.
 * @param {object} song - The song object containing `notes` and `bpm`.
 * @param {number} [delay=0] - Delay in seconds before starting.
 */
export async function playSongFromData(song, delay = 0, options = {}) {
  const { success, reqId, normalizedOptions } =
    await prepareTransportPlayback(options)
  if (!success) return false
  const { onEnded } = normalizedOptions

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
      const noteName = n.lane !== 'drums' ? getNoteName(n.p) : null

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
    // ⚡ BOLT SAFETY: Wrap in try-catch to prevent scheduler interruptions
    try {
      if (!audioState.guitar || !audioState.bass || !audioState.drumKit) return

      // Use pre-computed noteName or fallback if missing (though it should be present)
      // ⚡ BOLT OPTIMIZATION: Avoid calling getNoteName if noteName is explicitly null (drums)
      const noteName =
        value.noteName === null
          ? null
          : (value.noteName ?? getNoteName(value.note))

      triggerInstrumentNote(
        value.lane,
        value.note,
        time,
        value.velocity,
        noteName
      )
    } catch (err) {
      // Log concisely and return early to keep the scheduler alive
      logger.error('AudioEngine', 'Error in Song callback', err)
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
  const rawBaseUrl =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env?.BASE_URL
      ? import.meta.env?.BASE_URL
      : './'
  const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl : `${rawBaseUrl}/`
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
  const drumSet = useCleanPlayback ? audioState.midiDrumKit : audioState.drumKit

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
      // ⚡ BOLT SAFETY: Wrap in try-catch to prevent scheduler interruptions
      try {
        if (!leadSynth || !bassSynth || !drumSet) return

        // Since we filtered in the loop, we know midiPitch is valid (0-127).
        // We skip redundant isValidMidiNote/normalizeMidiPitch checks here for performance.
        const midiPitch = value.midiPitch

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
      } catch (err) {
        // Log concisely and return early to keep the scheduler alive
        logger.error('AudioEngine', 'Error in MIDI callback', err)
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
export async function playMidiFileInternal(
  filename,
  offset = 0,
  loop = false,
  delay = 0,
  options = {},
  ownedRequestId = null
) {
  const { onEnded, useCleanPlayback, stopAfterSeconds, startTimeSec } =
    normalizeMidiPlaybackOptions(options)

  const reqId = initializePlaybackRequest(
    filename,
    offset,
    loop,
    ownedRequestId
  )

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
