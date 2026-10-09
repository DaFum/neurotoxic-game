import { startMetalGenerator } from './proceduralMetal'
import { playMidiFile, playSongFromData } from './midiPlayback'
import { startGigClock, startGigPlayback } from './gigPlayback'
import { getAudioContextTimeSec, getToneStartTimeSec } from './context'
import { handleError, AudioError } from '../errorHandler'
import { hasAudioAsset } from './assets'
import { audioState } from './state'
import { logger } from '../logger'
import { generateNotesForSong } from '../rhythmUtils'
import { resolveSongPlaybackWindow } from './songUtils'
import type { ActiveSong } from './rhythmGameTypes'
import {
  GIG_LEAD_IN_MS,
  NOTE_LEAD_IN_MS,
  NOTE_TAIL_MS
} from './rhythmGameTypes'
import type { Song } from '../../types/audio'
import type { RhythmNote } from '../../types/rhythmGame'
import type { RandomFn } from '../../types/callbacks'

/**
 * Captures the generation claimed synchronously by a playback backend.
 * The coordinator checks it immediately after awaiting the pending attempt,
 * before another strategy can claim a new generation.
 */
const beginPlaybackAttempt = (start: () => Promise<boolean>) => {
  const pending = start()
  return { pending, requestId: audioState.playRequestId }
}

const playOggBuffer = async (
  currentSong: ActiveSong,
  notes: RhythmNote[],
  onSongEnded: () => Promise<void> | void
): Promise<boolean> => {
  if (!currentSong.sourceOgg && !currentSong.sourceMid) return false

  const { excerptStartMs, excerptDurationMs } = resolveSongPlaybackWindow(
    currentSong,
    { defaultDurationMs: 0 }
  )
  const oggFilename =
    currentSong.sourceOgg ||
    (typeof currentSong.sourceMid === 'string'
      ? currentSong.sourceMid.replace(/\.mid$/i, '.ogg')
      : null)

  if (typeof oggFilename !== 'string' || !hasAudioAsset(oggFilename)) {
    handleError(
      new AudioError(
        `Audio asset not found for "${currentSong.name}": looked up "${oggFilename}"`,
        { songName: currentSong.name, oggFilename }
      ),
      { silent: true, fallbackMessage: 'Missing OGG audio asset' }
    )
    return false
  }

  const lastNote = notes[notes.length - 1]
  const maxNoteTimeSoFar = lastNote?.time ?? 0
  const oggDurationMs =
    maxNoteTimeSoFar > 0
      ? maxNoteTimeSoFar + NOTE_TAIL_MS
      : excerptDurationMs > 0
        ? excerptDurationMs
        : null

  const success = await startGigPlayback({
    filename: oggFilename,
    bufferOffsetMs: excerptStartMs,
    delayMs: GIG_LEAD_IN_MS,
    durationMs: oggDurationMs,
    onEnded: onSongEnded
  })

  if (success) {
    logger.info(
      'RhythmGame',
      `Gig audio: OGG buffer playback for "${currentSong.name}"`
    )
  }
  return success
}

const playMidiSynthesis = async (
  currentSong: ActiveSong,
  notes: RhythmNote[],
  onSongEnded: () => Promise<void> | void
): Promise<boolean> => {
  if (!currentSong.sourceMid) return false

  const { excerptStartMs, excerptDurationMs } = resolveSongPlaybackWindow(
    currentSong,
    { defaultDurationMs: 0 }
  )
  const offsetSeconds = Math.max(0, excerptStartMs / 1000)
  const lastNote = notes[notes.length - 1]
  const maxNoteTimeSoFar = lastNote?.time ?? 0
  const midiDurationMs =
    maxNoteTimeSoFar > 0
      ? maxNoteTimeSoFar + NOTE_TAIL_MS
      : excerptDurationMs > 0
        ? excerptDurationMs
        : null
  const gigPlaybackSeconds =
    midiDurationMs !== null ? midiDurationMs / 1000 : null

  const rawGigStartTimeSec = getAudioContextTimeSec() + GIG_LEAD_IN_MS / 1000
  const toneGigStartTimeSec = getToneStartTimeSec(rawGigStartTimeSec)
  startGigClock({ offsetMs: 0, startTimeSec: toneGigStartTimeSec })

  const success = await playMidiFile(
    currentSong.sourceMid,
    offsetSeconds,
    false,
    0,
    {
      startTimeSec: toneGigStartTimeSec,
      stopAfterSeconds: gigPlaybackSeconds,
      useCleanPlayback: false,
      onEnded: onSongEnded
    }
  )

  if (success) {
    logger.info(
      'RhythmGame',
      `Gig audio: MIDI synthesis fallback for "${currentSong.name}"`
    )
  }
  return success
}

const playNoteDataSynthesis = async (
  currentSong: ActiveSong,
  notes: RhythmNote[],
  onSongEnded: () => Promise<void> | void
): Promise<boolean> => {
  if (notes.length === 0) return false

  // Tone schedules relative to Tone.now(), which runs `lookAhead` ahead of the
  // raw context clock; anchor both the clock and the transport to one absolute
  // time, as the MIDI path does.
  const startTimeSec = getToneStartTimeSec(
    getAudioContextTimeSec() + GIG_LEAD_IN_MS / 1000
  )
  startGigClock({ offsetMs: 0, startTimeSec })
  const success = await playSongFromData(currentSong, GIG_LEAD_IN_MS / 1000, {
    onEnded: onSongEnded,
    startTimeSec
  })

  if (success) {
    logger.info(
      'RhythmGame',
      `Gig audio: note data synthesis for "${currentSong.name}"`
    )
  }
  return success
}

const playProceduralMetal = async (
  currentSong: ActiveSong,
  onSongEnded: () => Promise<void> | void,
  rng: RandomFn
): Promise<boolean> => {
  const audioDelay = GIG_LEAD_IN_MS / 1000
  const startTimeSec = getToneStartTimeSec(
    getAudioContextTimeSec() + audioDelay
  )
  startGigClock({ offsetMs: 0, startTimeSec })
  const success = await startMetalGenerator(
    currentSong,
    audioDelay,
    { onEnded: onSongEnded, startTimeSec },
    rng
  )

  if (success) {
    logger.info(
      'RhythmGame',
      `Gig audio: procedural metal generator for "${currentSong.name}"`
    )
  }
  return success
}

/**
 * Starts gig background audio for a song, choosing the best available strategy.
 *
 * @remarks
 * Tries strategies in order — OGG/MIDI buffer, MIDI synthesis, note-data
 * synthesis — and falls back to the procedural metal generator if none start.
 * When the song has no authored notes, a note set is generated so the playfield
 * is never empty.
 *
 * @param currentSong - Song to play; its `sourceOgg`/`sourceMid` fields select the strategy.
 * @param notes - Pre-authored rhythm notes; may be empty to trigger generation.
 * @param onSongEnded - Invoked once the chosen audio source reaches its end.
 * @param rng - Deterministic random source for note generation and procedural audio.
 * @returns The notes the playfield should render — the input notes, or freshly generated ones when `notes` was empty.
 */
const playAudioForSong = async (
  currentSong: ActiveSong,
  notes: RhythmNote[],
  onSongEnded: () => Promise<void> | void,
  rng: RandomFn
): Promise<RhythmNote[]> => {
  let bgAudioStarted = false

  if (currentSong.sourceOgg || currentSong.sourceMid) {
    const attempt = beginPlaybackAttempt(() =>
      playOggBuffer(currentSong, notes, onSongEnded)
    )
    bgAudioStarted = await attempt.pending
    if (attempt.requestId !== audioState.playRequestId) return [...notes]
  }

  if (!bgAudioStarted && currentSong.sourceMid) {
    const attempt = beginPlaybackAttempt(() =>
      playMidiSynthesis(currentSong, notes, onSongEnded)
    )
    bgAudioStarted = await attempt.pending
    if (attempt.requestId !== audioState.playRequestId) return [...notes]
  }

  if (!bgAudioStarted && notes.length > 0) {
    const attempt = beginPlaybackAttempt(() =>
      playNoteDataSynthesis(currentSong, notes, onSongEnded)
    )
    bgAudioStarted = await attempt.pending
    if (attempt.requestId !== audioState.playRequestId) return [...notes]
  }

  let finalNotes = [...notes]

  if (finalNotes.length === 0 || !bgAudioStarted) {
    if (finalNotes.length === 0) {
      const songNotes = generateNotesForSong(
        currentSong as Pick<Song, 'id' | 'bpm' | 'duration' | 'difficulty'>,
        {
          leadIn: NOTE_LEAD_IN_MS,
          random: rng
        }
      )
      finalNotes = finalNotes.concat(songNotes)
    }

    if (!bgAudioStarted) {
      const attempt = beginPlaybackAttempt(() =>
        playProceduralMetal(currentSong, onSongEnded, rng)
      )
      await attempt.pending
      if (attempt.requestId !== audioState.playRequestId) return finalNotes
    }
  }

  return finalNotes
}

export { playAudioForSong }
