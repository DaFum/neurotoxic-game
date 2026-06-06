import { startMetalGenerator } from './proceduralMetal'
import { playMidiFile, playSongFromData } from './midiPlayback'
import { startGigClock, startGigPlayback } from './gigPlayback'
import { getAudioContextTimeSec, getToneStartTimeSec } from './context'
import { handleError, AudioError } from '../errorHandler'
import { hasAudioAsset } from './assets'
import { logger } from '../logger'
import { generateNotesForSong } from '../rhythmUtils'
import { resolveSongPlaybackWindow } from './songUtils'
import type { ActiveSong } from './rhythmGameTypes'
import { GIG_LEAD_IN_MS, NOTE_LEAD_IN_MS, NOTE_TAIL_MS } from './rhythmGameTypes'
import type { Song } from '../../types/audio'
import type { RhythmNote } from '../../types/rhythmGame'
import type { RandomFn } from '../../types/callbacks'

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

  startGigClock({ delayMs: GIG_LEAD_IN_MS, offsetMs: 0 })
  const success = await playSongFromData(currentSong, GIG_LEAD_IN_MS / 1000, {
    onEnded: onSongEnded
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
  startGigClock({ delayMs: GIG_LEAD_IN_MS, offsetMs: 0 })
  const success = await startMetalGenerator(
    currentSong,
    audioDelay,
    { onEnded: onSongEnded },
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

const playAudioForSong = async (
  currentSong: ActiveSong,
  notes: RhythmNote[],
  onSongEnded: () => Promise<void> | void,
  rng: RandomFn
): Promise<RhythmNote[]> => {
  let bgAudioStarted = false

  if (currentSong.sourceOgg || currentSong.sourceMid) {
    bgAudioStarted = await playOggBuffer(currentSong, notes, onSongEnded)
  }

  if (!bgAudioStarted && currentSong.sourceMid) {
    bgAudioStarted = await playMidiSynthesis(currentSong, notes, onSongEnded)
  }

  if (!bgAudioStarted && notes.length > 0) {
    bgAudioStarted = await playNoteDataSynthesis(
      currentSong,
      notes,
      onSongEnded
    )
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
      await playProceduralMetal(currentSong, onSongEnded, rng)
    }
  }

  return finalNotes
}

export { playAudioForSong }
