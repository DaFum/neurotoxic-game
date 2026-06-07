import fs from 'fs'
const utilsFile = 'src/utils/audio/rhythmGameAudioUtils.ts'
if (fs.existsSync(utilsFile)) {
  const file = fs.readFileSync(utilsFile, 'utf-8')
  const lines = file.split('\n')

  const typesAndConstants = []
  const gigPhysicsLines = []
  const setlistResolutionLines = []
  const playbackStrategiesLines = []
  const songSequencerLines = []

  for (let i = 24; i < 78; i++) {
    typesAndConstants.push(lines[i])
  }

  for (let i = 79; i < 176; i++) {
    gigPhysicsLines.push(lines[i])
  }

  for (let i = 177; i < 246; i++) {
    setlistResolutionLines.push(lines[i])
  }

  for (let i = 247; i < 442; i++) {
    playbackStrategiesLines.push(lines[i])
  }

  for (let i = 443; i < lines.length; i++) {
    songSequencerLines.push(lines[i])
  }

  fs.writeFileSync(
    'src/utils/audio/rhythmGameTypes.ts',
    `import type { Song, Note } from '../../types/audio'



export const GIG_LEAD_IN_MS = 2000
export const NOTE_LEAD_IN_MS = 100

/**
 * Extra note lifetime after the scheduled song window, in milliseconds.
 */
export const NOTE_TAIL_MS = 1000

export interface MutableRef<T> {
  current: T
}

export type ActiveSong = Partial<Song> & {
  id: string
  name: string
  bpm: number
  duration: number
  difficulty: number
  notes?: Note[]
  sourceMid?: string
  sourceOgg?: string | null
}

export const hasNotesField = (
  v: unknown
): v is {
  notes: Note[]
  id?: string
  name?: string
  bpm?: number
  duration?: number
  difficulty?: number
  sourceMid?: string
  sourceOgg?: string | null
} => {
  return (
    typeof v === 'object' &&
    v !== null &&
    Array.isArray((v as { notes?: unknown }).notes)
  )
}
`
  )

  fs.writeFileSync(
    'src/utils/audio/gigPhysics.ts',
    `import { logger } from '../logger'
import { SONGS_DB, SONGS_BY_ID } from '../../data/songs'
import { calculateGigPhysics, getGigModifiers } from '../simulationUtils'
import type { Song } from '../../types/audio'
import type { BandState, GameMap, GigModifiers } from '../../types'
import type { RhythmModifiers } from '../../types/rhythmGame'

` + gigPhysicsLines.join('\n')
  )

  fs.writeFileSync(
    'src/utils/audio/setlistResolution.ts',
    `import { SONGS_BY_ID } from '../../data/songs'
import type { Note } from '../../types/audio'
import type { RhythmSetlistEntry } from '../../types/rhythmGame'
import type { ActiveSong } from './rhythmGameTypes'
import { hasNotesField } from './rhythmGameTypes'

` + setlistResolutionLines.join('\n')
  )

  fs.writeFileSync(
    'src/utils/audio/playbackStrategies.ts',
    `import { startMetalGenerator } from './proceduralMetal'
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

` +
      playbackStrategiesLines.join('\n').slice(0, -56) +
      `
export { playAudioForSong }
`
  )

  fs.writeFileSync(
    'src/utils/audio/songSequencer.ts',
    `import { getGigTimeMs } from './gigPlayback'
import { handleError } from '../errorHandler'
import { logger } from '../logger'
import { parseSongNotes } from '../rhythmUtils'
import { resolveSongPlaybackWindow } from './songUtils'
import { getSafeRandom } from '../crypto'
import type {
  RhythmGameRefState,
  RhythmNote
} from '../../types/rhythmGame'
import type {
  ToastCallback,
  TranslationCallback
} from '../../types/callbacks'
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
    logger.error('RhythmGame', 'playSongSequence: gameStateRef.current is null or undefined')
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
      \`playSongSequence: missing song at index \${index}\`
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

    logger.info('RhythmGame', \`Song "\${currentSong.name}" ended.\`)
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

  const finalNotes = await playAudioForSong(
    currentSong,
    notes,
    onSongEnded,
    rng
  )

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
    gameStateRef.current.totalDuration = Math.max(noteDuration, audioDuration)
  }

  gameStateRef.current.songTransitioning = false

  if (activeSetlist.length > 1) {
    const text = t
      ? t('ui:nowPlaying', {
          name: currentSong.name,
          defaultValue: \`Now Playing: {{name}}\`
        })
      : \`Now Playing: \${currentSong.name}\`
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
`
  )

  const engineFile = 'src/utils/audio/audioEngine.ts'
  let code = fs.readFileSync(engineFile, 'utf-8')
  code = code.replace(
    `export {
  setupGigPhysics,
  resolveActiveSetlist,
  playSongSequence,
  resetGigStateTracking
} from './rhythmGameAudioUtils'`,
    `export { setupGigPhysics } from './gigPhysics'
export { resolveActiveSetlist } from './setlistResolution'
export { playSongSequence, resetGigStateTracking } from './songSequencer'
export { NOTE_TAIL_MS } from './rhythmGameTypes'`
  )
  fs.writeFileSync(engineFile, code)

  let utilsTest = fs.readFileSync(
    'tests/node/rhythmGameAudioUtils.test.js',
    'utf-8'
  )
  utilsTest = utilsTest.replace(
    "from '../../src/utils/audio/rhythmGameAudioUtils'",
    "from '../../src/utils/audio/audioEngine'"
  )
  fs.writeFileSync('tests/node/rhythmGameAudioUtils.test.js', utilsTest)

  let songsTest = fs.readFileSync('tests/node/songs-real.test.js', 'utf-8')
  songsTest = songsTest.replace(
    "from '../../src/utils/audio/rhythmGameAudioUtils'",
    "from '../../src/utils/audio/audioEngine'"
  )
  fs.writeFileSync('tests/node/songs-real.test.js', songsTest)

  fs.unlinkSync(utilsFile)
}
