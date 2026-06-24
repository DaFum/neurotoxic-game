import { getGigTimeMs } from './gigPlayback'
import { handleError } from '../errorHandler'
import { logger } from '../logger'
import { parseSongNotes } from '../rhythmUtils'
import { resolveSongPlaybackWindow } from './songUtils'
import { getSafeRandom } from '../crypto'
import type { RhythmGameRefState, RhythmNote } from '../../types/rhythmGame'
import type { ToastCallback, TranslationCallback } from '../../types/callbacks'
import type { ActiveSong, MutableRef } from './rhythmGameTypes'
import type { Song } from '../../types/audio'
import { NOTE_LEAD_IN_MS } from './rhythmGameTypes'
import { playAudioForSong } from './playbackStrategies'

const handleSongEnded = (
  gameStateRef: MutableRef<RhythmGameRefState>,
  currentSong: ActiveSong,
  index: number
): void => {
  const currentState = gameStateRef.current
  if (!currentState) return

  const currentScore = currentState.score || 0
  const scoreDelta = Math.max(
    0,
    currentScore - (currentState.currentSongStartScore || 0)
  )

  const currentPerfects = currentState.stats?.perfectHits || 0
  const currentMisses = currentState.stats?.misses || 0
  const perfectsDelta = Math.max(
    0,
    currentPerfects - (currentState.currentSongStartPerfectHits || 0)
  )
  const missesDelta = Math.max(
    0,
    currentMisses - (currentState.currentSongStartMisses || 0)
  )

  const totalDelta = perfectsDelta + missesDelta
  let songAccuracy = 100
  if (totalDelta > 0) {
    songAccuracy = Math.max(
      0,
      Math.min(100, Math.round((perfectsDelta / totalDelta) * 100))
    )
  }

  currentState.songStats.push({
    songId: currentSong.id,
    score: scoreDelta,
    accuracy: songAccuracy,
    index
  })

  currentState.currentSongStartScore = currentScore
  currentState.currentSongStartPerfectHits = currentPerfects
  currentState.currentSongStartMisses = currentMisses
}

/**
 * Plays one song from the active setlist and schedules continuation to the next entry.
 *
 * @param index - Zero-based setlist index to play.
 * @param activeSetlist - Resolved playable songs.
 * @param gameStateRef - Mutable rhythm-game state shared with the render loop.
 * @param addToast - Callback for now-playing notifications.
 * @param t - Optional translation callback for user-facing messages.
 */
export const playSongSequence = async (
  index: number,
  activeSetlist: ActiveSong[],
  gameStateRef: MutableRef<RhythmGameRefState>,
  addToast: ToastCallback,
  t: TranslationCallback | undefined
): Promise<void> => {
  if (!gameStateRef.current) {
    logger.error(
      'RhythmGame',
      'playSongSequence: gameStateRef.current is null or undefined'
    )
    return
  }

  if (
    gameStateRef.current.hasSubmittedResults ||
    gameStateRef.current.isGameOver
  ) {
    logger.info(
      'RhythmGame',
      'Gig stopped or submitted, aborting playSongSequence.'
    )
    return
  }

  if (index >= activeSetlist.length) {
    gameStateRef.current.setlistCompleted = true
    gameStateRef.current.songTransitioning = false
    const nowMs = getGigTimeMs()
    if (Number.isFinite(nowMs) && nowMs > 0) {
      gameStateRef.current.totalDuration = nowMs
    }
    return
  }

  const currentSong = activeSetlist[index]
  if (!currentSong) {
    logger.error(
      'RhythmGame',
      `playSongSequence: missing song at index ${index}`
    )
    if (gameStateRef.current) {
      gameStateRef.current.setlistCompleted = true
      gameStateRef.current.songTransitioning = false
    }
    return
  }
  let notes: RhythmNote[] = []
  const rng = getSafeRandom
  gameStateRef.current.rng = rng

  gameStateRef.current.setlistCompleted = false
  gameStateRef.current.songTransitioning = true
  gameStateRef.current.notes = []
  gameStateRef.current.nextMissCheckIndex = 0

  if (Array.isArray(currentSong.notes) && currentSong.notes.length > 0) {
    const parsedNotes = parseSongNotes(currentSong as Song, NOTE_LEAD_IN_MS, {
      onWarn: msg => logger.warn('RhythmGame', msg)
    }) as RhythmNote[]
    if (parsedNotes.length > 0) {
      notes = notes.concat(parsedNotes)
    }
  }

  const onSongEnded = () => {
    if (gameStateRef.current.lastEndedSongIndex === index) {
      return Promise.resolve()
    }
    gameStateRef.current.lastEndedSongIndex = index

    if (
      gameStateRef.current.isGameOver ||
      gameStateRef.current.hasSubmittedResults
    ) {
      logger.info(
        'RhythmGame',
        'Gig stopped or submitted, ignoring onSongEnded chaining.'
      )
      return Promise.resolve()
    }

    handleSongEnded(gameStateRef, currentSong, index)

    logger.info('RhythmGame', `Song "${currentSong.name}" ended.`)
    gameStateRef.current.songTransitioning = true
    return playSongSequence(
      index + 1,
      activeSetlist,
      gameStateRef,
      addToast,
      t
    ).catch(err => {
      handleError(err, {
        addToast,
        fallbackMessage: 'Failed to start next song!'
      })
      gameStateRef.current.setlistCompleted = true
      gameStateRef.current.songTransitioning = false
    })
  }

  const currentElapsedMs = index > 0 ? getGigTimeMs() : 0
  const safeElapsedMs =
    Number.isFinite(currentElapsedMs) && currentElapsedMs > 0
      ? currentElapsedMs
      : 0

  const rawFinalNotes = await playAudioForSong(
    currentSong,
    notes,
    onSongEnded,
    rng
  )

  const finalNotes =
    safeElapsedMs > 0
      ? rawFinalNotes.map(n => ({
          ...n,
          time: n.time + safeElapsedMs
        }))
      : rawFinalNotes

  gameStateRef.current.notes = finalNotes
  gameStateRef.current.nextMissCheckIndex = 0
  gameStateRef.current.notesVersion = gameStateRef.current.notesVersion + 1

  const lastFinal = finalNotes[finalNotes.length - 1]
  const maxNoteTime = lastFinal?.time ?? 0
  const buffer = 4000
  const noteDuration = maxNoteTime + buffer

  if (
    (currentSong.notes && currentSong.notes.length > 0) ||
    currentSong.id === 'tutorial_01'
  ) {
    gameStateRef.current.totalDuration = noteDuration
  } else {
    const audioDuration = resolveSongPlaybackWindow(currentSong, {
      defaultDurationMs: 0
    }).excerptDurationMs
    const absoluteAudioDuration = safeElapsedMs + audioDuration
    gameStateRef.current.totalDuration = Math.max(
      noteDuration,
      absoluteAudioDuration
    )
  }

  gameStateRef.current.songTransitioning = false

  if (activeSetlist.length > 1) {
    const text = t
      ? t('ui:nowPlaying', {
          name: currentSong.name,
          defaultValue: `Now Playing: {{name}}`
        })
      : `Now Playing: ${currentSong.name}`
    addToast(text, 'info')
  }
}

/**
 * Resets per-gig sequencing flags and score tracking on the rhythm-game state ref.
 *
 * @param gameStateRef - Mutable rhythm-game state to reset.
 */
export const resetGigStateTracking = (
  gameStateRef: MutableRef<RhythmGameRefState>
): void => {
  if (gameStateRef.current) {
    gameStateRef.current.lastEndedSongIndex = -1
    gameStateRef.current.songStats = []
    gameStateRef.current.currentSongStartScore = 0
    gameStateRef.current.currentSongStartPerfectHits = 0
    gameStateRef.current.currentSongStartMisses = 0
    gameStateRef.current.songTransitioning = false
    gameStateRef.current.setlistCompleted = false
    gameStateRef.current.isGameOver = false
    gameStateRef.current.hasSubmittedResults = false
  }
}
