import * as Tone from 'tone'
import * as ToneJsMidi from '@tonejs/midi'
import { logger } from '../logger'
import { audioState } from './state'
import { MIN_NOTE_DURATION, MAX_NOTE_DURATION } from './constants'
import { ensureAudioContext } from './context'
import { stopAudio, stopAudioInternal } from './transportControl'
import { midiUrlMap } from './assets'
import { calculateTimeFromTicks, preprocessTempoMap } from '../rhythmUtils'
import { clampUnit } from '../numberUtils'
import { isFiniteNumber } from '../finiteNumber'
import type { ProcessedTempoMapEntry } from '../../types/rhythm'
import type { DrumKitSynth } from '../../types/audio'
import {
  resolveAssetUrl,
  normalizeMidiPlaybackOptions,
  prepareTransportPlayback,
  getBaseAssetPath
} from './playbackUtils'
import {
  isPercussionTrack,
  buildMidiTrackEvents,
  getNoteName
} from './midiUtils'
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

type ParsedMidiTrack = {
  notes?: unknown
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
function triggerSynthNote(
  synth: Tone.PolySynth | null | undefined,
  midiPitch: number,
  time: number,
  velocity: number,
  duration: string,
  defaultFreq: string,
  noteName: string | null
): void {
  const freq = noteName ?? getNoteName(midiPitch) ?? defaultFreq
  synth?.triggerAttackRelease(freq, duration, time, velocity)
}

function triggerInstrumentNote(
  lane: string,
  midiPitch: number,
  time: number,
  velocity: number,
  noteName: string | null = null
): void {
  if (lane === 'drums') {
    return playDrumNote(midiPitch, time, velocity)
  }
  if (lane === 'midiDrumKit') {
    return playDrumNote(
      midiPitch,
      time,
      velocity,
      audioState.midiDrumKit ?? undefined
    )
  }

  const { synth, dur, freq } = getSynthConfigForLane(lane)
  triggerSynthNote(synth, midiPitch, time, velocity, dur, freq, noteName)
}

function getSynthConfigForLane(lane: string): {
  synth: Tone.PolySynth | null | undefined
  dur: string
  freq: string
} {
  if (lane === 'bass') return { synth: audioState.bass, dur: '8n', freq: 'C3' }
  if (lane === 'midiBass')
    return { synth: audioState.midiBass, dur: '8n', freq: 'C3' }
  if (lane === 'midiLead')
    return { synth: audioState.midiLead, dur: '16n', freq: 'C4' }
  return { synth: audioState.guitar, dur: '16n', freq: 'C4' }
}

/**
 * Plays a specific note at a scheduled Tone.js time.
 * @param midiPitch - The MIDI note number.
 * @param lane - The lane ID ('guitar', 'bass', 'drums').
 * @param whenSeconds - Tone.js time in seconds.
 * @param velocity - The velocity (0-127). Defaults to `127`.
 */
export function playNoteAtTime(
  midiPitch: number,
  lane: string,
  whenSeconds: number,
  velocity = 127
): void {
  if (!audioState.isSetup) return
  const now = Number.isFinite(whenSeconds) ? whenSeconds : Tone.now()
  const vel = clampUnit(velocity / 127)
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

function isValidSongNote(
  n: SongLikeNote | undefined | null
): n is SongLikeNote & { t: number; p: number; v: number } {
  if (!n) return false
  return isFiniteNumber(n.t) && isFiniteNumber(n.p) && isFiniteNumber(n.v)
}

function calculateNoteTime(
  n: { t: number },
  bpm: number,
  tpb: number,
  useTempoMap: boolean,
  activeTempoMap: ProcessedTempoMapEntry[]
): number {
  const time = useTempoMap
    ? calculateTimeFromTicks(n.t, tpb, activeTempoMap, 's')
    : (n.t / tpb) * (60 / bpm)
  return Number.isFinite(time) ? time : -1
}

function createSongEventFromNote(
  n: SongLikeNote & { t: number; p: number; v: number },
  bpm: number,
  tpb: number,
  useTempoMap: boolean,
  activeTempoMap: ProcessedTempoMapEntry[]
): ProcessedSongEvent | null {
  const finalTime = calculateNoteTime(n, bpm, tpb, useTempoMap, activeTempoMap)
  if (finalTime < 0) return null

  const rawVelocity = Math.max(0, Math.min(127, n.v))
  const noteName = n.lane !== 'drums' ? getNoteName(n.p) : null
  const lane = typeof n.lane === 'string' ? n.lane : 'guitar'

  return {
    time: finalTime,
    note: n.p,
    noteName,
    velocity: rawVelocity / 127,
    lane
  }
}

function processSongEvents(
  song: { notes?: unknown },
  bpm: number,
  tpb: number,
  useTempoMap: boolean,
  activeTempoMap: ProcessedTempoMapEntry[]
): { events: ProcessedSongEvent[]; lastTime: number } | null {
  let lastTime = 0

  const notes = Array.isArray(song.notes) ? (song.notes as SongLikeNote[]) : []
  const events: ProcessedSongEvent[] = []
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i]
    if (isValidSongNote(n)) {
      const evt = createSongEventFromNote(
        n,
        bpm,
        tpb,
        useTempoMap,
        activeTempoMap
      )
      if (evt) {
        lastTime = Math.max(lastTime, evt.time)
        events.push(evt)
      }
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
function resolveSongNoteName(value: ProcessedSongEvent): string | null {
  if (value.noteName === null) return null
  return value.noteName ?? getNoteName(value.note)
}

function handleSongPartEvent(time: number, value: ProcessedSongEvent) {
  try {
    if (!audioState.guitar || !audioState.bass || !audioState.drumKit) return

    const noteName = resolveSongNoteName(value)
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
}

function createSongPart(events: ProcessedSongEvent[]) {
  const part = new Tone.Part(handleSongPartEvent, events).start(0)
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
 * @param song - The song object containing `notes` and `bpm`.
 * @param delay - Delay in seconds before starting. Defaults to `0`.
 */
function parseFiniteNumber(v: unknown, fallback: number): number {
  if (isFiniteNumber(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const num = Number(v)
    if (Number.isFinite(num)) return num
  }
  return fallback
}

function isTempoEvent(e: unknown): e is Record<string, unknown> {
  return typeof e === 'object' && e !== null && 'tick' in e && 'usPerBeat' in e
}

function sanitizeTempoEvents(
  rawTempo: unknown[]
): { tick: number; usPerBeat: number }[] {
  const result: { tick: number; usPerBeat: number }[] = []
  for (let i = 0; i < rawTempo.length; i++) {
    const e = rawTempo[i]
    if (isTempoEvent(e)) {
      if (typeof e.tick === 'number' && typeof e.usPerBeat === 'number') {
        result.push({ tick: e.tick, usPerBeat: e.usPerBeat })
      }
    }
  }
  return result
}

function extractTempoMap(
  sObj: Record<string, unknown>,
  tpb: number
): { useTempoMap: boolean; activeTempoMap: ProcessedTempoMapEntry[] } {
  const isArray = Array.isArray(sObj.tempoMap)
  if (!isArray || (sObj.tempoMap as unknown[]).length === 0) {
    return { useTempoMap: false, activeTempoMap: [] }
  }

  const rawTempo = sObj.tempoMap as unknown[]
  const sanitized = sanitizeTempoEvents(rawTempo)
  return {
    useTempoMap: true,
    activeTempoMap: preprocessTempoMap(sanitized, tpb)
  }
}

function getSongContext(song: unknown) {
  if (song && typeof song === 'object') {
    return song as Record<string, unknown>
  }
  return {}
}

function parseSongParameters(sObj: Record<string, unknown>) {
  const bpm = Math.max(1, parseFiniteNumber(sObj.bpm, 120))
  const tpb = Math.max(1, parseFiniteNumber(sObj.tpb, 480))
  const notes = Array.isArray(sObj.notes)
    ? (sObj.notes as SongLikeNote[])
    : undefined
  return { bpm, tpb, notes }
}

function executeSongPlayback(
  res: { events: ProcessedSongEvent[]; lastTime: number },
  bpm: number,
  delay: number,
  reqId: number,
  onEnded: ((...args: unknown[]) => void) | null | undefined
) {
  Tone.getTransport().bpm.value = bpm
  audioState.part = createSongPart(res.events)

  const validDelay = isFiniteNumber(delay) ? Math.max(0, delay) : 0
  scheduleSongPlayback(
    res.lastTime,
    validDelay,
    reqId,
    onEnded as (() => void) | null
  )
}

async function prepareSongPlayback(song: unknown, options: unknown) {
  if (!validateSongReady(song)) return null
  const prep = await prepareTransportPlayback(options)
  if (!prep.success) return null
  return prep
}

/**
 * Plays parsed song data through the Tone.js transport.
 *
 * @param song - Song-like object containing notes and timing metadata.
 * @param delay - Delay before playback starts, in seconds.
 * @param options - Candidate playback options passed through transport preparation.
 * @returns True when the song is parsed and scheduled.
 */
export async function playSongFromData(
  song: unknown,
  delay = 0,
  options: unknown = {}
): Promise<boolean> {
  const prep = await prepareSongPlayback(song, options)
  if (!prep) return false

  const sObj = getSongContext(song)
  const p = parseSongParameters(sObj)
  const t = extractTempoMap(sObj, p.tpb)

  const res = processSongEvents(
    { notes: p.notes },
    p.bpm,
    p.tpb,
    t.useTempoMap,
    t.activeTempoMap
  )
  if (!res) return false

  executeSongPlayback(
    res,
    p.bpm,
    delay,
    prep.reqId,
    prep.normalizedOptions.onEnded
  )
  return true
}

/**
 * Handles the initial setup for MIDI playback, including request ID generation.
 * @param filename - The filename of the MIDI.
 * @param offset - Start offset in seconds.
 * @param loop - Whether to loop the playback.
 * @param ownedRequestId - Internal request ownership override.
 * @returns The new request ID.
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
 * @param filename - The filename of the MIDI.
 * @returns The resolved URL or null if not found.
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
 * @param url - The URL of the MIDI file.
 * @param reqId - The request ID to validate against.
 * @param filename - The filename for logging.
 * @returns The MIDI data or null on failure.
 */
async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

function handleFetchError(err: unknown, filename: string): null {
  if (err instanceof Error && err.name === 'AbortError') {
    logger.warn('AudioEngine', `MIDI fetch timed out for "${filename}"`)
  } else {
    logger.error('AudioEngine', 'Error playing MIDI:', err)
  }
  return null
}

async function fetchMidiArrayBuffer(
  url: string,
  reqId: number,
  filename: string
): Promise<ArrayBuffer | null> {
  try {
    const response = await fetchWithTimeout(url)
    if (reqId !== audioState.playRequestId) return null
    if (!response.ok) throw new Error(`Failed to load MIDI: ${url}`)

    const arrayBuffer = await response.arrayBuffer()
    if (reqId !== audioState.playRequestId) return null

    return arrayBuffer
  } catch (err) {
    return handleFetchError(err, filename)
  }
}

/**
 * Parses the MIDI ArrayBuffer.
 * @param arrayBuffer - The MIDI data.
 * @returns The parsed MIDI object or null on failure.
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
 * @param midi - The parsed MIDI object.
 * @param useCleanPlayback - If true, bypass FX for MIDI playback.
 * @returns An array of created Tone.Part objects.
 */
type ProcessedMidiEvent = {
  time: number
  midiPitch: number
  duration?: unknown
  velocity?: unknown
  percussionTrack: boolean
  frequencyNote?: string | null
}

function getClampedDuration(dur: unknown): number {
  const base = isFiniteNumber(dur) ? dur : MIN_NOTE_DURATION
  return Math.min(MAX_NOTE_DURATION, Math.max(MIN_NOTE_DURATION, base))
}

function getClampedVelocity(vel: unknown): number {
  const base = isFiniteNumber(vel) ? vel : 1
  return clampUnit(base)
}

type SynthsContext = {
  leadSynth: Tone.PolySynth | null | undefined
  bassSynth: Tone.PolySynth | null | undefined
  drumSet: DrumKitSynth | null | undefined
}

function triggerMidiSynth(
  pitch: number,
  time: number,
  velocity: number,
  duration: number,
  freqNote: string | null | undefined,
  leadSynth: Tone.PolySynth,
  bassSynth: Tone.PolySynth
) {
  const freq = freqNote ?? getNoteName(pitch) ?? 'C4'
  const synth = pitch < 45 ? bassSynth : leadSynth
  synth.triggerAttackRelease(freq, duration, time, velocity)
}

function handleMidiEvent(
  time: number,
  value: ProcessedMidiEvent,
  synths: SynthsContext
) {
  const { leadSynth, bassSynth, drumSet } = synths
  if (!leadSynth || !bassSynth || !drumSet) return

  const duration = getClampedDuration(value.duration)
  const velocity = getClampedVelocity(value.velocity)

  if (value.percussionTrack) {
    return playDrumNote(value.midiPitch, time, velocity, drumSet)
  }

  triggerMidiSynth(
    value.midiPitch,
    time,
    velocity,
    duration,
    value.frequencyNote,
    leadSynth,
    bassSynth
  )
}

function createTrackPart(
  track: ParsedMidiTrack,
  synths: SynthsContext
): Tone.Part<unknown> | null {
  const events = buildMidiTrackEvents(
    track.notes,
    isPercussionTrack(track)
  ).map(event => ({
    ...event,
    frequencyNote: event.percussionTrack ? null : getNoteName(event.midiPitch)
  }))
  if (events.length === 0) return null

  const trackPart = new Tone.Part((time: number, value: ProcessedMidiEvent) => {
    try {
      handleMidiEvent(time, value, synths)
    } catch (err) {
      logger.error('AudioEngine', 'Error in MIDI callback', err)
    }
  }, events) as unknown as Tone.Part<unknown>

  trackPart.start(0)
  return trackPart
}

function getSynthsContext(useCleanPlayback: boolean): SynthsContext {
  return {
    leadSynth: useCleanPlayback ? audioState.midiLead : audioState.guitar,
    bassSynth: useCleanPlayback ? audioState.midiBass : audioState.bass,
    drumSet: useCleanPlayback ? audioState.midiDrumKit : audioState.drumKit
  }
}

function createMidiParts(
  midi: ParsedMidi,
  useCleanPlayback: boolean
): Tone.Part<unknown>[] {
  const synths = getSynthsContext(useCleanPlayback)
  const tracks = Array.isArray(midi?.tracks) ? midi.tracks : []

  const result: Tone.Part<unknown>[] = []
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i]
    if (!track) continue
    const part = createTrackPart(track, synths)
    if (part) result.push(part)
  }
  return result
}

/**
 * Configures the Transport and schedules playback.
 * @param midi - The parsed MIDI object.
 * @param params - Parameters for scheduling.
 */
function scheduleEndCallback(
  reqId: number,
  filename: string,
  duration: number,
  requestedOffset: number,
  onEnded: ((info: MidiPlaybackEndInfo) => void) | null
) {
  if (onEnded && duration > 0) {
    audioState.transportEndEventId = Tone.getTransport().scheduleOnce(() => {
      if (reqId === audioState.playRequestId) {
        onEnded({ filename, duration, offsetSeconds: requestedOffset })
      }
    }, duration)
  }
}

function scheduleStopCallback(
  reqId: number,
  requestedOffset: number,
  stopAfterSeconds: number | null
) {
  const finiteStopAfter = isFiniteNumber(stopAfterSeconds)
    ? stopAfterSeconds
    : null
  if (finiteStopAfter !== null && finiteStopAfter > 0) {
    const stopTime = requestedOffset + finiteStopAfter
    audioState.transportStopEventId = Tone.getTransport().scheduleOnce(() => {
      if (reqId === audioState.playRequestId) stopAudio()
    }, stopTime)
  }
}

function scheduleMidiEndEvents(
  reqId: number,
  filename: string,
  duration: number,
  requestedOffset: number,
  onEnded: ((info: MidiPlaybackEndInfo) => void) | null,
  stopAfterSeconds: number | null
): void {
  scheduleEndCallback(reqId, filename, duration, requestedOffset, onEnded)
  scheduleStopCallback(reqId, requestedOffset, stopAfterSeconds)
}

function configureTransportLoop(
  loop: boolean,
  duration: number,
  requestedOffset: number
) {
  const transport = Tone.getTransport()
  transport.loop = loop
  if (loop) {
    transport.loopEnd = duration
    transport.loopStart = requestedOffset
  }
}

function getValidOffset(offset: number, duration: number): number {
  let requestedOffset = isFiniteNumber(offset) ? Math.max(0, offset) : 0
  if (duration > 0 && requestedOffset >= duration) {
    logger.warn(
      'AudioEngine',
      `Offset ${requestedOffset}s exceeds duration ${duration}s. Resetting to 0.`
    )
    requestedOffset = 0
  }
  return requestedOffset
}

function getTransportStartTime(
  startTimeSec: number | null,
  validDelay: number
): number {
  if (isFiniteNumber(startTimeSec)) {
    return startTimeSec
  }
  const minLookahead = 0.1
  return Tone.now() + Math.max(minLookahead, validDelay)
}

function scheduleMidiTransport(
  midi: ParsedMidi,
  params: MidiTransportParams
): void {
  const firstTempo = midi.header.tempos[0]
  if (firstTempo) Tone.getTransport().bpm.value = firstTempo.bpm

  const validDelay = isFiniteNumber(params.delay)
    ? Math.max(0, params.delay)
    : 0
  const duration = isFiniteNumber(midi.duration) ? midi.duration : 0
  const requestedOffset = getValidOffset(params.offset, duration)

  logger.debug(
    'AudioEngine',
    `Starting Transport. Delay=${validDelay}, Offset=${requestedOffset}`
  )

  configureTransportLoop(params.loop, midi.duration, requestedOffset)

  if (!params.loop) {
    scheduleMidiEndEvents(
      params.reqId,
      params.filename,
      duration,
      requestedOffset,
      params.onEnded,
      params.stopAfterSeconds
    )
  }

  const transportStartTime = getTransportStartTime(
    params.startTimeSec,
    validDelay
  )
  Tone.getTransport().start(transportStartTime, requestedOffset)
}

/**
 * Plays a MIDI file from a URL.
 * @param params - Parameters for playback.
 * - `params.filename` - The filename of the MIDI (key in url map).
 * - `params.offset` - Start offset in seconds. Defaults to `0`.
 * - `params.loop` - Whether to loop the playback. Defaults to `false`.
 * - `params.delay` - Delay in seconds before starting playback. Defaults to `0`.
 * - `params.options` - Optional. Playback options.
 * - `params.options.useCleanPlayback` - If true, bypass FX for MIDI playback. Defaults to `true`.
 * - `params.options.onEnded` - Optional. Callback invoked after playback ends.
 * - `params.options.stopAfterSeconds` - Optional playback duration limit in seconds.
 * - `params.options.startTimeSec` - Optional. Absolute Tone.js time to start playback.
 * - `params.ownedRequestId` - Internal request ownership override. Defaults to `null`.
 */
function isRequestValid(reqId: number): boolean {
  return reqId === audioState.playRequestId
}

async function prepareAudioContextForMidi(reqId: number): Promise<boolean> {
  const unlocked = await ensureAudioContext()
  if (!unlocked) {
    logger.warn('AudioEngine', 'Cannot play MIDI: AudioContext is locked')
    return false
  }

  if (!isRequestValid(reqId)) {
    logger.debug(
      'AudioEngine',
      `Request cancelled during ensureAudioContext (reqId: ${reqId} vs ${audioState.playRequestId})`
    )
    return false
  }
  return true
}

async function loadAndValidateMidi(
  url: string,
  reqId: number,
  filename: string
): Promise<ParsedMidi | null> {
  const arrayBuffer = await fetchMidiArrayBuffer(url, reqId, filename)
  if (!arrayBuffer || !isRequestValid(reqId)) return null
  return parseMidiData(arrayBuffer) as ParsedMidi | null
}

async function fetchAndParseMidi(
  filename: string,
  reqId: number
): Promise<ParsedMidi | null> {
  const url = resolveMidiUrl(filename)
  if (!url) return null

  const midi = await loadAndValidateMidi(url, reqId, filename)
  return midi && isRequestValid(reqId) ? midi : null
}

function processMidiPlaybackParams(params: MidiPlaybackParams) {
  const defaults = {
    offset: 0,
    loop: false,
    delay: 0,
    options: {},
    ownedRequestId: null
  }
  return { ...defaults, ...params }
}

/**
 * Loads, parses, and schedules MIDI-file playback for the current request.
 *
 * @param rawParams - MIDI filename, timing offsets, loop flag, and playback options.
 * @returns True when MIDI playback was scheduled for the active request.
 */
export async function playMidiFileInternal(
  rawParams: MidiPlaybackParams
): Promise<boolean> {
  const params = processMidiPlaybackParams(rawParams)
  const normOptions = normalizeMidiPlaybackOptions(params.options)
  const reqId = initializePlaybackRequest(
    params.filename,
    params.offset,
    params.loop,
    params.ownedRequestId
  )

  if (!(await prepareAudioContextForMidi(reqId))) return false

  stopAudioInternal()
  Tone.getTransport().cancel()

  const midi = await fetchAndParseMidi(params.filename, reqId)
  if (!midi) return false

  audioState.midiParts = createMidiParts(midi, normOptions.useCleanPlayback)

  scheduleMidiTransport(midi, {
    reqId,
    filename: params.filename,
    offset: params.offset,
    loop: params.loop,
    delay: params.delay,
    onEnded: normOptions.onEnded,
    stopAfterSeconds: normOptions.stopAfterSeconds,
    startTimeSec: normOptions.startTimeSec
  })

  return true
}

/**
 * Plays a MIDI file from a URL.
 * @param filename - The filename of the MIDI (key in url map).
 * @param offset - Start offset in seconds. Defaults to `0`.
 * @param loop - Whether to loop the playback. Defaults to `false`.
 * @param delay - Delay in seconds before starting playback. Defaults to `0`.
 * @param options - Optional. Playback options.
 * - `options.useCleanPlayback` - If true, bypass FX for MIDI playback. Defaults to `true`.
 * - `options.onEnded` - Optional. Callback invoked after playback ends.
 * - `options.stopAfterSeconds` - Optional playback duration limit in seconds.
 * - `options.startTimeSec` - Optional. Absolute Tone.js time to start playback.
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
