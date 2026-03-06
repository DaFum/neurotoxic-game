import { useCallback, useRef, useEffect } from 'react'
import { audioManager } from '../../utils/AudioManager'
import {
  startMetalGenerator,
  playMidiFile,
  playSongFromData,
  hasAudioAsset,
  startGigClock,
  startGigPlayback,
  stopAudio,
  getAudioContextTimeSec,
  getToneStartTimeSec,
  getGigTimeMs
} from '../../utils/audioEngine'
import { handleError, AudioError } from '../../utils/errorHandler'
import { logger } from '../../utils/logger'
import { SONGS_DB } from '../../data/songs.js'
import {
  calculateGigPhysics,
  getGigModifiers
} from '../../utils/simulationUtils'
import { generateNotesForSong, parseSongNotes } from '../../utils/rhythmUtils'
import { resolveSongPlaybackWindow } from '../../utils/audio/songUtils'

const GIG_LEAD_IN_MS = 2000
const NOTE_LEAD_IN_MS = 100
// Extra time after the last note's target time before cutting audio playback.
// Gives the final bar time to be hit or fall past the miss window.
const NOTE_TAIL_MS = 1000

// Helper 1: Gig Physics and Modifiers Setup
const setupGigPhysics = (
  band,
  gigModifiers,
  currentGigId,
  gameMap,
  playerNodeId,
  setlistFirstId
) => {
  const activeModifiers = getGigModifiers(band, gigModifiers)

  const songId = currentGigId || setlistFirstId || 'neurotoxic_1'
  const DEFAULT_SONG = { id: 'default', bpm: 120 }
  const activeSong =
    SONGS_DB.find(s => s.id === songId) || SONGS_DB[0] || DEFAULT_SONG
  const physics = calculateGigPhysics(band, activeSong)

  const currentNode = gameMap?.nodes?.[playerNodeId]
  if (!currentNode) {
    logger.error('RhythmGame', `No map node found for ${playerNodeId}`)
    return null
  }

  const layer = currentNode.layer || 0
  const speedMult = 1.0 + layer * 0.05

  // Merge band-state modifiers (harmony/member effects) with physics multipliers
  const mergedModifiers = {
    ...activeModifiers,
    drumMultiplier: physics.multipliers.drums,
    guitarScoreMult:
      physics.multipliers.guitar * (activeModifiers.guitarScoreMult ?? 1.0),
    bassScoreMult:
      physics.multipliers.bass * (activeModifiers.bassScoreMult ?? 1.0),
    hasPerfektionist: physics.hasPerfektionist
  }

  let speed = 500 * speedMult * physics.speedModifier
  if (mergedModifiers.drumSpeedMult > 1.0)
    speed *= mergedModifiers.drumSpeedMult
  if (mergedModifiers.catering) speed = 500 * speedMult

  let hitWindowBonus = mergedModifiers.hitWindowBonus || 0
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

// Helper 2: Setlist Resolution
const resolveActiveSetlist = setlist => {
  return (
    setlist.length > 0
      ? setlist
      : [{ id: 'jam', name: 'Jam', bpm: 120, duration: 60, difficulty: 2 }]
  ).map(songRef => {
    if (typeof songRef === 'string') {
      return (
        SONGS_DB.find(dbSong => dbSong.id === songRef) || {
          id: songRef,
          name: songRef,
          bpm: 120,
          duration: 60,
          difficulty: 2
        }
      )
    }
    if (!songRef.notes && songRef.id && songRef.id !== 'jam') {
      return SONGS_DB.find(dbSong => dbSong.id === songRef.id) || songRef
    }
    return songRef
  })
}

// Helper 3: Playback methods
const playOggBuffer = async (currentSong, notes, onSongEnded) => {
  if (!currentSong.sourceOgg && !currentSong.sourceMid) return false

  const { excerptStartMs, excerptDurationMs } = resolveSongPlaybackWindow(
    currentSong,
    { defaultDurationMs: 0 }
  )
  const oggFilename =
    currentSong.sourceOgg || currentSong.sourceMid.replace(/\.mid$/i, '.ogg')
  const assetFound = hasAudioAsset(oggFilename)

  if (!assetFound) {
    handleError(
      new AudioError(
        `Audio asset not found for "${currentSong.name}": looked up "${oggFilename}"`,
        { songName: currentSong.name, oggFilename }
      ),
      { silent: true, fallbackMessage: 'Missing OGG audio asset' }
    )
    return false
  }

  const maxNoteTimeSoFar = notes.length > 0 ? notes[notes.length - 1].time : 0
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

const playMidiSynthesis = async (currentSong, notes, onSongEnded) => {
  if (!currentSong.sourceMid) return false

  const { excerptStartMs, excerptDurationMs } = resolveSongPlaybackWindow(
    currentSong,
    { defaultDurationMs: 0 }
  )
  const offsetSeconds = Math.max(0, excerptStartMs / 1000)
  const maxNoteTimeSoFar = notes.length > 0 ? notes[notes.length - 1].time : 0
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

const playNoteDataSynthesis = async (currentSong, notes, onSongEnded) => {
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

const playProceduralMetal = async (currentSong, onSongEnded, rng) => {
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

// Helper 4: Song Playback Logic
const playAudioForSong = async (currentSong, notes, onSongEnded, rng) => {
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

  // Fallback: Procedural Generation
  if (finalNotes.length === 0 || !bgAudioStarted) {
    if (finalNotes.length === 0) {
      const songNotes = generateNotesForSong(currentSong, {
        leadIn: NOTE_LEAD_IN_MS,
        random: rng
      })
      finalNotes = finalNotes.concat(songNotes)
    }

    if (!bgAudioStarted) {
      await playProceduralMetal(currentSong, onSongEnded, rng)
    }
  }

  return finalNotes
}

// Helper 4: onSongEnded stats handler
const handleSongEnded = (gameStateRef, currentSong, index) => {
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
 * Manages audio initialization, playback, and setup for the gig.
 *
 * @param {Object} params - Hook parameters.
 * @param {Object} params.gameStateRef - Game state reference.
 * @param {Object} params.setters - Setters (setIsAudioReady).
 * @param {Object} params.contextState - Context state (band, gameMap, player, setlist, gigModifiers, addToast).
 * @returns {Object} Audio actions (initializeGigState, retryAudioInitialization).
 */
export const useRhythmGameAudio = ({
  gameStateRef,
  setters,
  contextState,
  contextActions
}) => {
  const { setIsAudioReady } = setters
  const { band, gameMap, player, setlist, gigModifiers, currentGig } =
    contextState
  const { addToast } = contextActions

  const hasInitializedRef = useRef(false)
  const isInitializingRef = useRef(false)
  const abortControllerRef = useRef(null)

  /**
   * Initializes gig physics and note data once per gig.
   */
  const initializeGigState = useCallback(async () => {
    // Prevent double initialization
    if (hasInitializedRef.current || isInitializingRef.current) {
      return
    }
    isInitializingRef.current = true
    const controller = new AbortController()
    abortControllerRef.current = controller
    const { signal } = controller
    const isAborted = () =>
      signal.aborted || abortControllerRef.current !== controller

    // Mute ambient radio to prevent audio overlap
    audioManager.stopMusic()

    // Harmony Guard
    if (band.harmony <= 0) {
      logger.warn('RhythmGame', 'Band harmony too low to start gig.')
      setIsAudioReady(false)
      isInitializingRef.current = false
      return
    }

    try {
      const audioUnlocked = await audioManager.ensureAudioContext()

      if (isAborted()) {
        isInitializingRef.current = false
        return
      }

      if (!audioUnlocked) {
        logger.warn(
          'RhythmGame',
          'Audio Context blocked. Waiting for user gesture.'
        )
        setIsAudioReady(false)
        isInitializingRef.current = false
        return
      }
      setIsAudioReady(true)
      hasInitializedRef.current = true
      isInitializingRef.current = false

      // Reset cross-song tracking state for a new gig
      if (gameStateRef.current) {
        gameStateRef.current.lastEndedSongIndex = -1
        gameStateRef.current.songStats = []
        gameStateRef.current.currentSongStartScore = 0
        gameStateRef.current.currentSongStartPerfectHits = 0
        gameStateRef.current.currentSongStartMisses = 0
      }

      const setlistFirstId =
        typeof setlist?.[0] === 'string' ? setlist[0] : setlist?.[0]?.id

      const physicsSetup = setupGigPhysics(
        band,
        gigModifiers,
        currentGig?.songId,
        gameMap,
        player.currentNodeId,
        setlistFirstId
      )
      if (!physicsSetup) {
        hasInitializedRef.current = false
        isInitializingRef.current = false
        return
      }

      gameStateRef.current.modifiers = physicsSetup.mergedModifiers
      gameStateRef.current.speed = physicsSetup.speed
      gameStateRef.current.lanes[0].hitWindow = physicsSetup.hitWindows[0]
      gameStateRef.current.lanes[1].hitWindow = physicsSetup.hitWindows[1]
      gameStateRef.current.lanes[2].hitWindow = physicsSetup.hitWindows[2]

      const activeSetlist = resolveActiveSetlist(setlist)

      // Function to play a specific song by index
      const playSongAtIndex = async index => {
        if (
          gameStateRef.current.hasSubmittedResults ||
          gameStateRef.current.isGameOver
        ) {
          logger.info(
            'RhythmGame',
            'Gig stopped or submitted, aborting playSongAtIndex.'
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
        let notes = []
        const rng = Math.random
        gameStateRef.current.rng = rng

        gameStateRef.current.setlistCompleted = false
        gameStateRef.current.songTransitioning = true
        gameStateRef.current.notes = []
        gameStateRef.current.nextMissCheckIndex = 0

        // Parse Notes
        if (Array.isArray(currentSong.notes) && currentSong.notes.length > 0) {
          const parsedNotes = parseSongNotes(currentSong, NOTE_LEAD_IN_MS, {
            onWarn: msg => logger.warn('RhythmGame', msg)
          })
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
          return playSongAtIndex(index + 1).catch(err => {
            handleError(err, {
              addToast,
              fallbackMessage: 'Failed to start next song!'
            })
            gameStateRef.current.setlistCompleted = true
            gameStateRef.current.songTransitioning = false
          })
        }

        const finalNotes = await playAudioForSong(currentSong, notes, onSongEnded, rng)

        // Update Game State
        gameStateRef.current.notes = finalNotes
        gameStateRef.current.nextMissCheckIndex = 0
        gameStateRef.current.notesVersion =
          gameStateRef.current.notesVersion + 1

        const maxNoteTime = finalNotes.length > 0 ? finalNotes[finalNotes.length - 1].time : 0
        const buffer = 4000
        const noteDuration = maxNoteTime + buffer
        const audioDuration = resolveSongPlaybackWindow(currentSong, {
          defaultDurationMs: 0
        }).excerptDurationMs
        gameStateRef.current.totalDuration =
          maxNoteTime > 0 ? noteDuration : Math.max(noteDuration, audioDuration)

        gameStateRef.current.songTransitioning = false

        if (activeSetlist.length > 1) {
          addToast(`Now Playing: ${currentSong.name}`, 'info')
        }
      }

      if (isAborted()) {
        setIsAudioReady(false)
        isInitializingRef.current = false
        return
      }

      if (!isAborted()) {
        await playSongAtIndex(0)
      }
    } catch (error) {
      if (isAborted()) {
        isInitializingRef.current = false
        return
      }

      handleError(error, {
        addToast,
        fallbackMessage: 'Gig initialization failed!'
      })
      setIsAudioReady(false)
      isInitializingRef.current = false
    }
  }, [
    band,
    gameMap?.nodes,
    player.currentNodeId,
    setlist,
    gigModifiers,
    addToast,
    gameStateRef,
    setIsAudioReady,
    currentGig?.songId
  ])

  useEffect(() => {
    initializeGigState()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      hasInitializedRef.current = false
      isInitializingRef.current = false
      stopAudio()
    }
  }, [initializeGigState])

  return {
    retryAudioInitialization: () => initializeGigState()
  }
}
