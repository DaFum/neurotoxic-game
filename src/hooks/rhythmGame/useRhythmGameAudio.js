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
  getToneStartTimeSec
} from '../../utils/audioEngine'
import { handleError, AudioError } from '../../utils/errorHandler'
import { logger } from '../../utils/logger'
import { SONGS_DB } from '../../data/songs'
import {
  calculateGigPhysics,
  getGigModifiers
} from '../../utils/simulationUtils'
import { generateNotesForSong, parseSongNotes } from '../../utils/rhythmUtils'

const GIG_LEAD_IN_MS = 2000
const NOTE_LEAD_IN_MS = 100

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
  const { band, gameMap, player, setlist, gigModifiers } = contextState
  const { addToast } = contextActions

  const hasInitializedRef = useRef(false)
  const isInitializingRef = useRef(false)

  /**
   * Initializes gig physics and note data once per gig.
   */
  const initializeGigState = useCallback(async () => {
    // Prevent double initialization
    if (hasInitializedRef.current || isInitializingRef.current) {
      return
    }
    isInitializingRef.current = true

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

      const activeModifiers = getGigModifiers(band, gigModifiers)
      const physics = calculateGigPhysics(band, { bpm: 120 })
      const currentNode = gameMap?.nodes?.[player.currentNodeId]

      if (!currentNode) {
        logger.error(
          'RhythmGame',
          `No map node found for ${player.currentNodeId}`
        )
        hasInitializedRef.current = false
        isInitializingRef.current = false
        return
      }

      const layer = currentNode.layer || 0
      const speedMult = 1.0 + layer * 0.05

      const mergedModifiers = activeModifiers
      gameStateRef.current.modifiers = mergedModifiers
      gameStateRef.current.speed = 500 * speedMult * physics.speedModifier

      // Apply Modifiers
      if (mergedModifiers.drumSpeedMult > 1.0)
        gameStateRef.current.speed *= mergedModifiers.drumSpeedMult

      // PreGig Modifiers
      let hitWindowBonus = mergedModifiers.hitWindowBonus || 0
      if (mergedModifiers.soundcheck) hitWindowBonus += 30

      if (mergedModifiers.catering) {
        gameStateRef.current.speed = 500 * speedMult
      }

      gameStateRef.current.lanes[0].hitWindow =
        physics.hitWindows.guitar + hitWindowBonus
      gameStateRef.current.lanes[1].hitWindow =
        physics.hitWindows.drums + hitWindowBonus
      gameStateRef.current.lanes[2].hitWindow =
        physics.hitWindows.bass + hitWindowBonus

      // Prepare resolved setlist
      const activeSetlist = (
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

      // Function to play a specific song by index
      const playSongAtIndex = async index => {
        if (index >= activeSetlist.length) {
          gameStateRef.current.audioPlaybackEnded = true
          gameStateRef.current.songTransitioning = false
          return
        }

        const currentSong = activeSetlist[index]
        let notes = []
        let audioDelay = 0
        let bgAudioStarted = false
        const rng = Math.random
        gameStateRef.current.rng = rng

        // Reset flags for new song
        gameStateRef.current.audioPlaybackEnded = false
        // Reset hasSubmittedResults to ensure finalizeGig can run again if it was somehow triggered prematurely (though transitioning flag protects this)
        gameStateRef.current.hasSubmittedResults = false

        // Mark as transitioning to prevent premature finalization
        gameStateRef.current.songTransitioning = true

        // Clear old notes immediately to prevent spurious miss processing
        // during async transition when the gig clock may be invalid
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

        // Setup onEnded callback for chaining
        const onSongEnded = () => {
          // Guard against continuing if the game has been stopped (e.g. Quit)
          if (!gameStateRef.current.running || gameStateRef.current.hasSubmittedResults) {
            logger.info('RhythmGame', 'Gig stopped or submitted, ignoring onSongEnded chaining.')
            return
          }

          logger.info('RhythmGame', `Song "${currentSong.name}" ended.`)
          // Synchronously set transitioning flag to prevent race condition
          gameStateRef.current.songTransitioning = true
          playSongAtIndex(index + 1).catch(err => {
             handleError(err, {
              addToast,
              fallbackMessage: 'Failed to start next song!'
            })
            // If next song fails, ensure we end the gig
            gameStateRef.current.audioPlaybackEnded = true
            gameStateRef.current.songTransitioning = false
          })
        }

        // Start Audio
        if (currentSong.sourceOgg || currentSong.sourceMid) {
          const excerptStart = currentSong.excerptStartMs || 0
          const oggFilename =
            currentSong.sourceOgg ||
            currentSong.sourceMid.replace(/\.mid$/i, '.ogg')
          const gigDurationMs = currentSong.excerptDurationMs || 30000
          const assetFound = hasAudioAsset(oggFilename)

          if (!assetFound) {
            handleError(
              new AudioError(
                `Audio asset not found for "${currentSong.name}": looked up "${oggFilename}"`,
                { songName: currentSong.name, oggFilename }
              ),
              { silent: true, fallbackMessage: 'Missing OGG audio asset' }
            )
          }

          if (assetFound) {
            const success = await startGigPlayback({
              filename: oggFilename,
              bufferOffsetMs: excerptStart,
              delayMs: GIG_LEAD_IN_MS,
              durationMs: gigDurationMs,
              onEnded: onSongEnded
            })
            if (success) {
              bgAudioStarted = true
              logger.info(
                'RhythmGame',
                `Gig audio: OGG buffer playback for "${currentSong.name}"`
              )
            }
          }
        }

        if (!bgAudioStarted && currentSong.sourceMid) {
          const excerptStart = currentSong.excerptStartMs || 0
          const offsetSeconds = Math.max(0, excerptStart / 1000)
          const gigPlaybackSeconds =
            (currentSong.excerptDurationMs || 30000) / 1000
          const rawGigStartTimeSec =
            getAudioContextTimeSec() + GIG_LEAD_IN_MS / 1000
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
            bgAudioStarted = true
            logger.info(
              'RhythmGame',
              `Gig audio: MIDI synthesis fallback for "${currentSong.name}"`
            )
          }
        }

        if (!bgAudioStarted && notes.length > 0) {
          startGigClock({ delayMs: GIG_LEAD_IN_MS, offsetMs: 0 })
          const success = await playSongFromData(
            currentSong,
            GIG_LEAD_IN_MS / 1000,
            {
              onEnded: onSongEnded
            }
          )
          if (success) {
            bgAudioStarted = true
            logger.info(
              'RhythmGame',
              `Gig audio: note data synthesis for "${currentSong.name}"`
            )
          }
        }

        // Fallback: Procedural Generation
        if (notes.length === 0 || !bgAudioStarted) {
          if (notes.length === 0) {
            const songNotes = generateNotesForSong(currentSong, {
              leadIn: NOTE_LEAD_IN_MS,
              random: rng
            })
            notes = notes.concat(songNotes)
          }

          if (!bgAudioStarted) {
            audioDelay = GIG_LEAD_IN_MS / 1000
            startGigClock({ delayMs: GIG_LEAD_IN_MS, offsetMs: 0 })
            await startMetalGenerator(
              currentSong,
              audioDelay,
              {
                onEnded: onSongEnded
              },
              rng
            )
            logger.info(
              'RhythmGame',
              `Gig audio: procedural metal generator for "${currentSong.name}"`
            )
          }
        }

        // Update Game State
        gameStateRef.current.notes = notes
        gameStateRef.current.nextMissCheckIndex = 0

        const maxNoteTime = notes.reduce((max, n) => Math.max(max, n.time), 0)
        const buffer = 4000
        const noteDuration = maxNoteTime + buffer
        const audioDuration = Number.isFinite(currentSong.excerptDurationMs)
          ? currentSong.excerptDurationMs
          : 0
        gameStateRef.current.totalDuration = Math.max(noteDuration, audioDuration)
        gameStateRef.current.running = true

        // Clear transitioning flag now that state is consistent
        gameStateRef.current.songTransitioning = false

        // Show Toast for song start
        if (activeSetlist.length > 1) {
          addToast(`Now Playing: ${currentSong.name}`, 'info')
        }
      }

      // Start the first song
      await playSongAtIndex(0)

    } catch (error) {
      handleError(error, {
        addToast,
        fallbackMessage: 'Gig initialization failed!'
      })
      gameStateRef.current.running = false
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
    setIsAudioReady
  ])

  useEffect(() => {
    initializeGigState()

    return () => {
      hasInitializedRef.current = false
      isInitializingRef.current = false
      stopAudio()
    }
  }, [initializeGigState])

  return {
    initializeGigState,
    retryAudioInitialization: initializeGigState
  }
}
