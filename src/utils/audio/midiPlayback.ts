import * as Tone from 'tone'
import * as ToneJsMidi from '@tonejs/midi'
import { logger } from '../logger'
import { audioState } from './state'
import { MIN_NOTE_DURATION, MAX_NOTE_DURATION } from './constants'
import { ensureAudioContext } from './context'
import { stopAudio, stopAudioInternal } from './playback'
import { midiUrlMap } from './assets'
import { calculateTimeFromTicks, preprocessTempoMap } from '../rhythmUtils'
import type { ProcessedTempoMapEntry } from '../../types/rhythm'
import {
  resolveAssetUrl,
  normalizeMidiPlaybackOptions,
  prepareTransportPlayback,
  getBaseAssetPath
} from './playbackUtils'
import { isPercussionTrack, normalizeMidiPitch, getNoteName } from './midiUtils'
import { playDrumNote } from './drumMappings'

type MaybeMidiModule = {
  Midi?: new (buf: ArrayBuffer) => unknown
  default?: { Midi?: new (buf: ArrayBuffer) => unknown }
}
const MidiParser =
  (ToneJsMidi as unknown as MaybeMidiModule).Midi ??
  (ToneJsMidi as unknown as MaybeMidiModule).default?.Midi ??
  null

// Local lightweight types for MIDI/song note shapes used in scheduling
type SongLikeNote = {
  t?: number
  p?: number
  v?: number
  lane?: string
  [key: string]: unknown
}

type ProcessedSongEvent = {
  time: number
  note: number
  noteName: string | null
  velocity: number
  lane: string
}

type ParsedMidiNote = {
  time: number
  duration?: number | string | null
  velocity?: number | null
  midi?: number
  name?: string
}

type ParsedMidiTrack = {
  notes?: ParsedMidiNote[]
  channel?: number
  instrument?: { family?: string; name?: string; percussion?: boolean }
  [key: string]: unknown
}

type ParsedMidi = {
  duration: number
  header: {
    tempos: Array<{ bpm: number }>
  }
  tracks: ParsedMidiTrack[]
}

type MidiPlaybackEndInfo = {
  filename: string
  duration: number
  offsetSeconds: number
}

type MidiPlaybackParams = {
  filename: string
  offset?: number
  loop?: boolean
  delay?: number
  options?: unknown
  ownedRequestId?: number | null
}

type MidiTransportParams = {
  reqId: number
  filename: string
  offset: number
  loop: boolean
  delay: number
  onEnded: ((info: MidiPlaybackEndInfo) => void) | null
  stopAfterSeconds: number | null
  startTimeSec: number | null
}

/**
 * Internal helper to trigger instrument notes.
 */
function triggerInstrumentNote(
  lane: string,
  midiPitch: number,
  time: number,
  velocity: number,
  noteName: string | null = null
): void {
  if (lane === 'drums') {
    playDrumNote(midiPitch, time, velocity)
  } else if (lane === 'bass') {
    if (audioState.bass) {
      const freq = noteName ?? getNoteName(midiPitch) ?? 'C3'
      audioState.bass.triggerAttackRelease(freq, '8n', time, velocity)
    }
  } else if (audioState.guitar) {
    const freq = noteName ?? getNoteName(midiPitch) ?? 'C4'
    audioState.guitar.triggerAttackRelease(freq, '16n', time, velocity)
  }
}

/**
 * Plays a specific note at a scheduled Tone.js time.
 * @param {number} midiPitch - The MIDI note number.
 * @param {string} lane - The lane ID ('guitar', 'bass', 'drums').
 * @param {number} whenSeconds - Tone.js time in seconds.
 * @param {number} [velocity=127] - The velocity (0-127).
 */
export function playNoteAtTime(
  midiPitch: number,
  lane: string,
  whenSeconds: number,
  velocity = 127
): void {
  if (!audioState.isSetup) return
  const now = Number.isFinite(whenSeconds) ? whenSeconds : Tone.now()
  const vel = Math.max(0, Math.min(1, velocity / 127))
  triggerInstrumentNote(lane, midiPitch, now, vel)
}

/**
 * Validates the song data and audio components readiness.
 */
function validateSongReady(song: unknown): boolean {
  const s = song as { notes?: unknown }
  if (!Array.isArray(s.notes)) {
    logger.error('AudioEngine', 'playSongFromData: song.notes is not an array')
    return false
  }

  if (!audioState.guitar || !audioState.bass || !audioState.drumKit) {
    logger.error(
      'AudioEngine',
      'playSongFromData: Audio components not initialized.'
    )
    return false
  }

  return true
}

/**
 * Processes song notes into schedulable events.
 */
function processSongEvents(
  song: { notes?: unknown },
  bpm: number,
  tpb: number,
  useTempoMap: boolean,
  activeTempoMap: ProcessedTempoMapEntry[]
): { events: ProcessedSongEvent[]; lastTime: number } | null {
  const events: ProcessedSongEvent[] = []
  let lastTime = 0

  const notes = Array.isArray(song.notes) ? (song.notes as SongLikeNote[]) : []

  for (let i = 0; i < notes.length; i++) {
    const n = notes[i]
    if (!n) continue

    if (
      typeof n.t !== 'number' ||
      !Number.isFinite(n.t) ||
      typeof n.p !== 'number' ||
      !Number.isFinite(n.p) ||
      typeof n.v !== 'number' ||
      !Number.isFinite(n.v)
    ) {
      continue
    }

    const time = useTempoMap
      ? calculateTimeFromTicks(n.t, tpb, activeTempoMap, 's')
      : (n.t / tpb) * (60 / bpm)

    const finalTime = Number.isFinite(time) ? time : -1

    if (finalTime >= 0) {
      const rawVelocity = Math.max(0, Math.min(127, n.v))

      if (finalTime > lastTime) {
        lastTime = finalTime
      }

      const noteName = n.lane !== 'drums' ? getNoteName(n.p) : null
      const lane = typeof n.lane === 'string' ? n.lane : 'guitar'

      events.push({
        time: finalTime,
        note: n.p,
        noteName,
        velocity: rawVelocity / 127,
        lane
      })
    }
  }

  if (events.length === 0) {
    logger.warn(
      'AudioEngine',
      'playSongFromData: No valid notes found to schedule'
    )
    return null
  }

  return { events, lastTime }
}

/**
 * Creates the Tone.Part for the song events.
 */
function createSongPart(events: ProcessedSongEvent[]) {
  const part = new Tone.Part((time: number, value: ProcessedSongEvent) => {
    try {
      if (!audioState.guitar || !audioState.bass || !audioState.drumKit) return

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
      logger.error('AudioEngine', 'Error in Song callback', err)
    }
  }, events).start(0)
  return part as unknown as Tone.Part<unknown>
}

/**
 * Schedules the song playback on the Transport.
 */
function scheduleSongPlayback(
  lastTime: number,
  delay: number,
  reqId: number,
  onEnded?: (() => void) | null
): void {
  const minLookahead = 0.1
  const startTime = Tone.now() + Math.max(minLookahead, delay)

  if (onEnded) {
    const duration = lastTime + Tone.Time('4n').toSeconds()

    Tone.getTransport().scheduleOnce(() => {
      if (reqId !== audioState.playRequestId) return
      onEnded()
    }, duration)
  }

  Tone.getTransport().start(startTime)
}

/**
 * Plays a song using predefined note data.
 * @param {object} song - The song object containing `notes` and `bpm`.
 * @param {number} [delay=0] - Delay in seconds before starting.
 */
export async function playSongFromData(
  song: unknown,
  delay = 0,
  options: unknown = {}
): Promise<boolean> {
  const { success, reqId, normalizedOptions } =
    await prepareTransportPlayback(options)
  if (!success) return false
  const { onEnded } = normalizedOptions

  // Narrow the incoming `song` shape safely from `unknown`.
  const sObj =
    song && typeof song === 'object' ? (song as Record<string, unknown>) : {}
  const toFiniteNumber = (v: unknown, fallback: number): number => {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)))
      return Number(v)
    return fallback
  }

  const bpm = Math.max(1, toFiniteNumber(sObj.bpm, 120))
  const tpb = Math.max(1, toFiniteNumber(sObj.tpb, 480))

  if (!validateSongReady(song)) return false

  const useTempoMap =
    Array.isArray(sObj.tempoMap) && (sObj.tempoMap as unknown[]).length > 0
  let activeTempoMap: ProcessedTempoMapEntry[] = []
  if (useTempoMap && Array.isArray(sObj.tempoMap)) {
    const rawTempo = sObj.tempoMap as unknown[]
    const sanitized: { tick: number; usPerBeat: number }[] = []
    for (let i = 0; i < rawTempo.length; i++) {
      const e = rawTempo[i]
      if (
        typeof e === 'object' &&
        e !== null &&
        'tick' in e &&
        'usPerBeat' in e
      ) {
        const obj = e as Record<string, unknown>
        const tickVal = obj['tick']
        const usPerBeatVal = obj['usPerBeat']
        if (typeof tickVal === 'number' && typeof usPerBeatVal === 'number') {
          sanitized.push({ tick: tickVal, usPerBeat: usPerBeatVal })
        }
      }
    }
    activeTempoMap = preprocessTempoMap(sanitized, tpb)
  }

  const validDelay = Number.isFinite(delay) ? Math.max(0, delay) : 0

  const processingResult = processSongEvents(
    {
      notes: Array.isArray(sObj.notes)
        ? (sObj.notes as SongLikeNote[])
        : undefined
    },
    bpm,
    tpb,
    useTempoMap,
    activeTempoMap
  )
  if (!processingResult) return false

  Tone.getTransport().bpm.value = bpm
  const { events, lastTime } = processingResult

  audioState.part = createSongPart(events)

  scheduleSongPlayback(lastTime, validDelay, reqId, onEnded)
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
function initializePlaybackRequest(
  filename: string,
  offset: number,
  loop: boolean,
  ownedRequestId: number | null
): number {
  logger.debug(
    'AudioEngine',
    `Request playMidiFile: ${filename}, offset=${offset}, loop=${loop}`
  )
  const reqId =
    typeof ownedRequestId === 'number' &&
    Number.isInteger(ownedRequestId) &&
    ownedRequestId > 0
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
function resolveMidiUrl(filename: string): string | null {
  const { publicBasePath } = getBaseAssetPath()
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
async function fetchMidiArrayBuffer(
  url: string,
  reqId: number,
  filename: string
): Promise<ArrayBuffer | null> {
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
    if (reqId !== audioState.playRequestId) return null
    return arrayBuffer
  } catch (err) {
    if (err instanceof Error && (err as Error).name === 'AbortError') {
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
function parseMidiData(arrayBuffer: ArrayBuffer): unknown | null {
  if (!MidiParser) {
    logger.error(
      'AudioEngine',
      'MidiParser failed to load from @tonejs/midi. This disables all MIDI playback. Try: npm install @tonejs/midi --force and restart the dev server. If the issue persists, check bundler ESM/CJS interop configuration.'
    )
    return null
  }

  const Ctor = MidiParser as unknown as { new (buf: ArrayBuffer): unknown }
  const midiObj = new Ctor(arrayBuffer)
  const midiRec = midiObj as Record<string, unknown>
  const duration = typeof midiRec.duration === 'number' ? midiRec.duration : 0
  logger.debug('AudioEngine', `MIDI loaded. Duration: ${duration}s`)

  if (duration <= 0) {
    logger.warn(
      'AudioEngine',
      `MIDI duration is ${duration}s. Skipping playback.`
    )
    return null
  }
  return midiObj
}

/**
 * Creates Tone.Parts for each track in the MIDI file.
 * @param {object} midi - The parsed MIDI object.
 * @param {boolean} useCleanPlayback - If true, bypass FX for MIDI playback.
 * @returns {Array} An array of created Tone.Part objects.
 */
function createMidiParts(
  midi: ParsedMidi,
  useCleanPlayback: boolean
): Tone.Part<unknown>[] {
  const leadSynth = useCleanPlayback ? audioState.midiLead : audioState.guitar
  const bassSynth = useCleanPlayback ? audioState.midiBass : audioState.bass
  const drumSet = useCleanPlayback ? audioState.midiDrumKit : audioState.drumKit

  type MidiEvent = {
    time: number
    midiPitch: number
    duration?: number | string | null
    velocity?: number | null
    percussionTrack: boolean
    frequencyNote?: string | null
  }

  const nextMidiParts: Tone.Part<unknown>[] = []
  const tracks = Array.isArray(midi?.tracks) ? midi.tracks : []
  for (const track of tracks) {
    const notes = Array.isArray(track.notes) ? track.notes : []
    const percussionTrack = isPercussionTrack(track)

    const eventsWithFrequencies: MidiEvent[] = []

    for (const note of notes) {
      if (!Number.isFinite(note.time) || note.time < 0) continue
      const midiPitch = normalizeMidiPitch(note)
      if (midiPitch == null) continue

      const evt: MidiEvent = {
        time: note.time,
        midiPitch,
        duration: note.duration,
        velocity: note.velocity,
        percussionTrack
      }

      if (!percussionTrack) {
        evt.frequencyNote = getNoteName(midiPitch)
      }

      eventsWithFrequencies.push(evt)
    }

    if (eventsWithFrequencies.length === 0) continue

    const trackPart = new Tone.Part((time: number, value: MidiEvent) => {
      try {
        if (!leadSynth || !bassSynth || !drumSet) return

        const midiPitch = value.midiPitch

        const duration = Math.min(
          MAX_NOTE_DURATION,
          Math.max(
            MIN_NOTE_DURATION,
            Number.isFinite(value.duration as number)
              ? (value.duration as number)
              : MIN_NOTE_DURATION
          )
        )

        const velocity = Math.max(
          0,
          Math.min(
            1,
            Number.isFinite(value.velocity as number)
              ? (value.velocity as number)
              : 1
          )
        )

        if (value.percussionTrack) {
          playDrumNote(midiPitch, time, velocity, drumSet)
          return
        }

        const freq = value.frequencyNote ?? getNoteName(midiPitch) ?? 'C4'

        if (midiPitch < 45) {
          bassSynth.triggerAttackRelease(freq, duration, time, velocity)
        } else {
          leadSynth.triggerAttackRelease(freq, duration, time, velocity)
        }
      } catch (err) {
        logger.error('AudioEngine', 'Error in MIDI callback', err)
      }
    }, eventsWithFrequencies) as unknown as Tone.Part<unknown>

    trackPart.start(0)
    nextMidiParts.push(trackPart)
  }
  return nextMidiParts
}

/**
 * Configures the Transport and schedules playback.
 * @param {object} midi - The parsed MIDI object.
 * @param {object} params - Parameters for scheduling.
 */
function scheduleMidiTransport(
  midi: ParsedMidi,
  params: MidiTransportParams
): void {
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

  const firstTempo = midi.header.tempos[0]
  if (firstTempo) {
    Tone.getTransport().bpm.value = firstTempo.bpm
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

  const finiteStopAfterSeconds =
    typeof stopAfterSeconds === 'number' && Number.isFinite(stopAfterSeconds)
      ? stopAfterSeconds
      : null
  if (!loop && finiteStopAfterSeconds != null && finiteStopAfterSeconds > 0) {
    const stopTime = requestedOffset + finiteStopAfterSeconds
    audioState.transportStopEventId = Tone.getTransport().scheduleOnce(() => {
      if (reqId !== audioState.playRequestId) return
      stopAudio()
    }, stopTime)
  }

  // Schedule Transport.start in advance to prevent pops/crackles
  // Add minimum 100ms lookahead for reliable scheduling
  const minLookahead = 0.1
  const transportStartTime =
    typeof startTimeSec === 'number' && Number.isFinite(startTimeSec)
      ? startTimeSec
      : Tone.now() + Math.max(minLookahead, validDelay)

  Tone.getTransport().start(transportStartTime, requestedOffset)
}

/**
 * Plays a MIDI file from a URL.
 * @param {object} params - Parameters for playback.
 * @param {string} params.filename - The filename of the MIDI (key in url map).
 * @param {number} [params.offset=0] - Start offset in seconds.
 * @param {boolean} [params.loop=false] - Whether to loop the playback.
 * @param {number} [params.delay=0] - Delay in seconds before starting playback.
 * @param {object} [params.options] - Playback options.
 * @param {boolean} [params.options.useCleanPlayback=true] - If true, bypass FX for MIDI playback.
 * @param {Function} [params.options.onEnded] - Callback invoked after playback ends.
 * @param {number} [params.options.stopAfterSeconds] - Optional playback duration limit in seconds.
 * @param {number} [params.options.startTimeSec] - Absolute Tone.js time to start playback.
 * @param {number|null} [params.ownedRequestId=null] - Internal request ownership override.
 */
export async function playMidiFileInternal(
  params: MidiPlaybackParams
): Promise<boolean> {
  const {
    filename,
    offset = 0,
    loop = false,
    delay = 0,
    options = {},
    ownedRequestId = null
  } = params

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

  const midi = parseMidiData(arrayBuffer) as ParsedMidi | null
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
  filename: string,
  offset = 0,
  loop = false,
  delay = 0,
  options: unknown = {}
): Promise<boolean> {
  return playMidiFileInternal({ filename, offset, loop, delay, options })
}
