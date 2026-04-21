import {
  startMetalGenerator,
  playMidiFile,
  playSongFromData,
  hasAudioAsset,
  startGigClock,
  startGigPlayback,
  getAudioContextTimeSec,
  getToneStartTimeSec,
  getGigTimeMs
} from './audioEngine'
import { handleError, AudioError } from './errorHandler'
import { logger } from './logger'
import { SONGS_DB, SONGS_BY_ID } from '../data/songs'
import { calculateGigPhysics, getGigModifiers } from './simulationUtils'
import { generateNotesForSong, parseSongNotes } from './rhythmUtils'
import { resolveSongPlaybackWindow } from './audio/songUtils'
import { getSafeRandom } from './crypto'
import type { Song, Note } from '../types/audio'
import type { BandState, GameMap, GigModifiers } from '../types/game'
import type {
  RhythmGameRefState,
  RhythmNote,
  RhythmSetlistEntry,
  RhythmModifiers
} from '../types/rhythmGame'
import type { ToastCallback, TranslationCallback } from '../types/callbacks'

const GIG_LEAD_IN_MS = 2000
const NOTE_LEAD_IN_MS = 100
const NOTE_TAIL_MS = 1000

type RandomFn = () => number

interface MutableRef<T> {
  current: T
}

type ActiveSong = Partial<Song> & {
  id: string
  name: string
  bpm: number
  duration: number
  difficulty: number
  notes?: Note[]
  sourceMid?: string
  sourceOgg?: string | null
}

const hasNotesField = (
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

export const setupGigPhysics = (
  band: BandState,
  gigModifiers: Partial<GigModifiers>,
  currentGigId: string | undefined,
  gameMap: GameMap,
  playerNodeId: string,
  setlistFirstId: string | undefined
): {
  mergedModifiers: RhythmModifiers
  speed: number
  hitWindows: number[]
} | null => {
  const activeModifiers = getGigModifiers(band, gigModifiers) as RhythmModifiers

  const songId = currentGigId || setlistFirstId || 'neurotoxic_1'
  const DEFAULT_SONG = { id: 'default', bpm: 120 }
  const activeSong = SONGS_BY_ID.get(songId) || SONGS_DB[0] || DEFAULT_SONG
  const physics = calculateGigPhysics(band, activeSong)

  const currentNode = gameMap.nodes[playerNodeId]
  if (!currentNode) {
    logger.error('RhythmGame', `No map node found for ${playerNodeId}`)
    return null
  }

  const layer = currentNode.layer || 0
  const speedMult = 1.0 + layer * 0.05

  const mergedModifiers: RhythmModifiers = {
    ...(activeModifiers as RhythmModifiers),
    drumMultiplier: physics.multipliers.drums,
    guitarScoreMult:
      physics.multipliers.guitar *
      ((activeModifiers as RhythmModifiers).guitarScoreMult ?? 1.0),
    bassScoreMult:
      physics.multipliers.bass *
      ((activeModifiers as RhythmModifiers).bassScoreMult ?? 1.0),
    hasPerfektionist: physics.hasPerfektionist
  }

  let speed = 500 * speedMult * physics.speedModifier
  const drumSpeedMult = mergedModifiers.drumSpeedMult ?? 1
  if (drumSpeedMult > 1.0) speed *= drumSpeedMult
  if (mergedModifiers.catering) speed = 500 * speedMult

  let hitWindowBonus = mergedModifiers.hitWindowBonus ?? 0
  if (mergedModifiers.soundcheck) hitWindowBonus += 30

  return {
    mergedModifiers,
    speed,
    hitWindows: [
      physics.hitWindows.guitar + hitWindowBonus,
      physics.hitWindows.drums + hitWindowBonus,
      physics.hitWindows.bass + hitWindowBonus
    ]
  }
}

export const resolveActiveSetlist = (
  setlist: RhythmSetlistEntry[]
): ActiveSong[] => {
  return (
    setlist.length > 0
      ? setlist
      : [{ id: 'jam', name: 'Jam', bpm: 120, duration: 60, difficulty: 2 }]
  ).map(songRef => {
    if (typeof songRef === 'string') {
      return (
        SONGS_BY_ID.get(songRef) || {
          id: songRef,
          name: songRef,
          bpm: 120,
          duration: 60,
          difficulty: 2
        }
      )
    }
    if (hasNotesField(songRef) && songRef.notes.length > 0) {
      return {
        ...songRef,
        id: songRef.id ?? 'jam',
        name: songRef.name ?? songRef.id ?? 'Jam',
        bpm: songRef.bpm ?? 120,
        duration: songRef.duration ?? 60,
        difficulty: songRef.difficulty ?? 2,
        notes: songRef.notes
      }
    }

    if (songRef.id && songRef.id !== 'jam') {
      const resolvedSong = SONGS_BY_ID.get(songRef.id)
      return {
        ...resolvedSong,
        ...songRef,
        id: songRef.id ?? resolvedSong?.id ?? 'jam',
        name: songRef.name ?? resolvedSong?.name ?? songRef.id ?? 'Jam',
        bpm: songRef.bpm ?? resolvedSong?.bpm ?? 120,
        duration: songRef.duration ?? resolvedSong?.duration ?? 60,
        difficulty: songRef.difficulty ?? resolvedSong?.difficulty ?? 2,
        notes: hasNotesField(songRef) ? songRef.notes : resolvedSong?.notes
      }
    }
    return {
      ...songRef,
      id: songRef.id ?? 'jam',
      name: songRef.name ?? songRef.id ?? 'Jam',
      bpm: songRef.bpm ?? 120,
      duration: songRef.duration ?? 60,
      difficulty: songRef.difficulty ?? 2,
      notes: hasNotesField(songRef) ? songRef.notes : undefined
    }
  })
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
  let bgAudioStarted = await playOggBuffer(currentSong, notes, onSongEnded)

  if (!bgAudioStarted) {
    bgAudioStarted = await playMidiSynthesis(currentSong, notes, onSongEnded)
  }

  if (!bgAudioStarted) {
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

export const playSongSequence = async (
  index: number,
  activeSetlist: ActiveSong[],
  gameStateRef: MutableRef<RhythmGameRefState>,
  addToast: ToastCallback,
  t: TranslationCallback | undefined
): Promise<void> => {
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
          defaultValue: `Now Playing: {{name}}`
        })
      : `Now Playing: ${currentSong.name}`
    addToast(text, 'info')
  }
}

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
  }
}
