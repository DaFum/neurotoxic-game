import { useRef, useState, useEffect, useCallback } from 'react'
import { useGameState } from '../context/GameState'
import { calculateGigPhysics, getGigModifiers } from '../utils/simulationUtils'
import { audioManager } from '../utils/AudioManager'
import {
  startMetalGenerator,
  playMidiFile,
  playSongFromData,
  playNote,
  stopAudio,
  pauseAudio,
  resumeAudio,
  getAudioTimeMs
} from '../utils/audioEngine'
import {
  buildGigStatsSnapshot,
  updateGigPerformanceStats
} from '../utils/gigStats'
import {
  generateNotesForSong,
  parseSongNotes,
  checkHit
} from '../utils/rhythmUtils'
import { updateProjectiles, trySpawnProjectile } from '../utils/hecklerLogic'
import { handleError } from '../utils/errorHandler'
import { SONGS_DB } from '../data/songs'

/**
 * Provides rhythm game state, actions, and update loop for the gig scene.
 * @returns {{gameStateRef: object, stats: object, actions: object, update: Function}} Rhythm game API.
 */
export const useRhythmGameLogic = () => {
  const {
    setlist,
    band,
    activeEvent,
    hasUpgrade,
    setLastGigStats,
    addToast,
    gameMap,
    player,
    changeScene,
    gigModifiers
  } = useGameState()

  const NOTE_MISS_WINDOW_MS = 300

  // React State for UI
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [health, setHealth] = useState(100)
  const [progress, setProgress] = useState(0)
  const [overload, setOverload] = useState(0)
  const [isToxicMode, setIsToxicMode] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const gameOverTimerRef = useRef(null)

  // High-Frequency Game State (Ref)
  const gameStateRef = useRef({
    running: false,
    notes: [],
    nextMissCheckIndex: 0, // Optimization: only check notes that haven't passed yet
    lanes: [
      {
        id: 'guitar',
        key: 'ArrowLeft',
        x: 0,
        color: 0xff0041,
        active: false,
        hitWindow: 150
      },
      {
        id: 'drums',
        key: 'ArrowDown',
        x: 120,
        color: 0x00ff41,
        active: false,
        hitWindow: 150
      },
      {
        id: 'bass',
        key: 'ArrowRight',
        x: 240,
        color: 0x0041ff,
        active: false,
        hitWindow: 150
      }
    ],
    startTime: 0,
    elapsed: 0,
    pauseTime: null,
    speed: 500,
    modifiers: {},
    stats: { perfectHits: 0, misses: 0, maxCombo: 0, peakHype: 0 },
    projectiles: [],
    // Mirror React State for Renderer
    combo: 0,
    health: 100,
    score: 0,
    isToxicMode: false,
    isGameOver: false,
    overload: 0,
    totalDuration: 0,
    toxicTimeTotal: 0,
    toxicModeEndTime: 0,
    rng: Math.random // Store RNG for consistency
  })

  const hasInitializedRef = useRef(false)

  /**
   * Initializes gig physics and note data once per gig.
   * @returns {void}
   */
  const initializeGigState = useCallback(async () => {
    // Prevent double initialization, even in Strict Mode or re-mounts if ref persists
    if (hasInitializedRef.current) {
      return
    }
    hasInitializedRef.current = true

    // Mute ambient radio to prevent audio overlap
    audioManager.stopMusic()

    try {
      // Ensure AudioContext is running before any getAudioTimeMs() calls,
      // even if no playMidiFile/startMetalGenerator path executes later.
      // Use audioManager to also set initialized flag for SFX playback.
      await audioManager.ensureAudioContext()

      const activeModifiers = getGigModifiers(band, gigModifiers)
      const physics = calculateGigPhysics(band, { bpm: 120 })
      const currentNode = gameMap?.nodes?.[player.currentNodeId]

      if (!currentNode) {
        console.error(
          'useRhythmGameLogic: no node found for',
          player.currentNodeId
        )
        hasInitializedRef.current = false
        return
      }

      const layer = currentNode.layer || 0
      const speedMult = 1.0 + layer * 0.05

      // Use band-aware modifiers computed by getGigModifiers (already merged with gigModifiers)
      const mergedModifiers = activeModifiers
      gameStateRef.current.modifiers = mergedModifiers
      gameStateRef.current.speed = 500 * speedMult * physics.speedModifier

      // Apply Modifiers
      if (mergedModifiers.drumSpeedMult > 1.0)
        gameStateRef.current.speed *= mergedModifiers.drumSpeedMult

      // PreGig Modifiers
      let hitWindowBonus = mergedModifiers.hitWindowBonus || 0
      if (mergedModifiers.soundcheck) hitWindowBonus += 30 // Soundcheck bonus

      if (mergedModifiers.catering) {
        // Energy boost: easier physics? Or just stamina?
        // Already handled in physics via band stats if we mutated band, but here we can apply direct overrides
        // For now, let's say it counteracts speed drag
        gameStateRef.current.speed = 500 * speedMult // Reset drag
      }

      gameStateRef.current.lanes[0].hitWindow =
        physics.hitWindows.guitar + hitWindowBonus
      gameStateRef.current.lanes[1].hitWindow =
        physics.hitWindows.drums + hitWindowBonus
      gameStateRef.current.lanes[2].hitWindow =
        physics.hitWindows.bass + hitWindowBonus

      let notes = []
      let currentTimeOffset = 2000

      // Resolve full song data from IDs or Objects if necessary
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

      // Only generate notes for the active song (first in list for now, unless we implement full setlist sequencing)
      // The audio engine plays the first song. Notes should match.
      // If the intention is to play ONLY one song per gig scene invocation:
      const songsToPlay = [activeSetlist[0]]
      const currentSong = songsToPlay[0]
      let audioDelay = 0

      // Explicitly non-deterministic unless seed provided (future proofing)
      // Store in ref for consistency in update loop
      const rng = Math.random
      gameStateRef.current.rng = rng

      // Use predefined notes if available and valid
      let parsedNotes = []
      let bgAudioStarted = false
      if (Array.isArray(currentSong.notes) && currentSong.notes.length > 0) {
        parsedNotes = parseSongNotes(currentSong, currentTimeOffset, {
          onWarn: msg => console.warn(msg)
        })

        if (parsedNotes.length > 0) {
          notes = notes.concat(parsedNotes)
        }
      }

      // Requirement: for GIG background music, always play the song MIDI when available
      // (even if parsing yields 0 notes, we still don't want a silent gig)
      // This guarantees the background MIDI runs from the specified offset.
      if (currentSong.sourceMid) {
        const excerptStart = currentSong.excerptStartMs || 0
        const offsetSeconds = Math.max(0, excerptStart / 1000)
        // Use the excerpt duration (default 30s) directly as playback length.
        // The offset tells the MIDI player where to START; stopAfterSeconds
        // controls how long to play FROM that point.
        const gigPlaybackSeconds = (currentSong.excerptDurationMs || 30000) / 1000
        const success = await playMidiFile(
          currentSong.sourceMid,
          offsetSeconds,
          false,
          currentTimeOffset / 1000,
          {
            stopAfterSeconds: gigPlaybackSeconds,
            useCleanPlayback: true
          }
        )
        if (success) bgAudioStarted = true
      }

      // Fallback: If MIDI failed (or didn't exist), try to synthesize from note data
      if (!bgAudioStarted && parsedNotes.length > 0) {
        // No MIDI file available (or it failed), synthesize from note data
        const success = await playSongFromData(
          currentSong,
          currentTimeOffset / 1000
        )
        if (success) bgAudioStarted = true
      }

      // If parsing failed or no notes (empty/invalid), OR audio failed to start, fall back to procedural generation
      // This handles empty-note songs and failed audio gracefully without silent failure.
      if (notes.length === 0 || !bgAudioStarted) {
        // Only generate notes if we don't have any yet
        if (notes.length === 0) {
          // Fallback procedural generation
          songsToPlay.forEach(song => {
            const songNotes = generateNotesForSong(song, {
              leadIn: currentTimeOffset,
              random: rng
            })
            notes = notes.concat(songNotes)
            currentTimeOffset += song.duration * 1000
          })
        }

        // Always start procedural generator if no background audio is running
        // This ensures sound even if we have notes but the MIDI/audio failed
        if (!bgAudioStarted) {
          audioDelay = 2.0
          await startMetalGenerator(currentSong, audioDelay, rng)
        }
      }

      gameStateRef.current.notes = notes
      gameStateRef.current.nextMissCheckIndex = 0 // Reset pointer

      // Calculate max note time to ensure duration covers everything
      const maxNoteTime = notes.reduce((max, n) => Math.max(max, n.time), 0)
      // Add buffer for decay/end (e.g. 4 seconds)
      const buffer = 4000

      if (parsedNotes.length > 0) {
        gameStateRef.current.totalDuration = maxNoteTime + buffer
      } else {
        gameStateRef.current.totalDuration = Math.max(
          currentTimeOffset,
          maxNoteTime + buffer
        )
      }

      gameStateRef.current.startTime = getAudioTimeMs()
      gameStateRef.current.running = true
      // console.log('[RhythmGame] Initialized.', { ... })
    } catch (error) {
      handleError(error, {
        addToast,
        fallbackMessage: 'Gig initialization failed!'
      })
      gameStateRef.current.running = false
    }
  }, [
    band,
    gameMap?.nodes,
    player.currentNodeId,
    setlist,
    gigModifiers,
    addToast
  ])

  useEffect(() => {
    initializeGigState()

    return () => {
      hasInitializedRef.current = false // Reset initialization flag on unmount
      if (gameOverTimerRef.current) {
        clearTimeout(gameOverTimerRef.current)
        gameOverTimerRef.current = null
      }
      stopAudio()
    }
  }, [initializeGigState])

  /**
   * Triggers toxic mode and schedules its end.
   * @returns {void}
   */
  const activateToxicMode = useCallback(() => {
    setIsToxicMode(true)
    gameStateRef.current.isToxicMode = true
    gameStateRef.current.toxicModeEndTime = getAudioTimeMs() + 10000
    addToast('TOXIC OVERLOAD!', 'success')
  }, [addToast])

  /**
   * Applies a miss penalty and updates state/refs.
   * @param {number} count - Number of misses to process (default 1)
   * @param {boolean} isEmptyHit - Whether this was an empty hit (hitting without a note).
   * @returns {void}
   */
  const handleMiss = useCallback(
    (count = 1, isEmptyHit = false) => {
      if (count <= 0) return

      setCombo(0)
      gameStateRef.current.combo = 0
      setOverload(o => {
        const penalty = isEmptyHit ? 2 : 5
        const next = Math.max(0, o - penalty * count)
        gameStateRef.current.overload = next
        const updatedStats = updateGigPerformanceStats(
          {
            ...gameStateRef.current.stats,
            misses: gameStateRef.current.stats.misses + count
          },
          { combo: gameStateRef.current.combo, overload: next }
        )
        gameStateRef.current.stats = updatedStats
        return next
      })

      // Only play miss SFX if it's a real miss, empty hits might be spam, so maybe quieter or different?
      // For now, keep SFX but maybe we can throttle it if needed.
      audioManager.playSFX('miss')

      let decayPerMiss = hasUpgrade('bass_sansamp') ? 1 : 2
      if (isEmptyHit) {
        decayPerMiss = 1 // Lower penalty for empty hits
      }

      setHealth(h => {
        const next = Math.max(0, h - decayPerMiss * count)
        if (next <= 0 && !gameStateRef.current.isGameOver) {
          setIsGameOver(true)
          gameStateRef.current.isGameOver = true
          stopAudio() // Immediate stop to prevent stuttering/desync
          addToast('BAND COLLAPSED', 'error')

          // Schedule exit from Gig if failed (Softlock fix)
          if (!gameOverTimerRef.current) {
            gameOverTimerRef.current = setTimeout(() => {
              addToast('Gig Failed! Reviewing impact...', 'info')
              setLastGigStats(
                buildGigStatsSnapshot(
                  gameStateRef.current.score,
                  gameStateRef.current.stats,
                  gameStateRef.current.toxicTimeTotal
                )
              )
              changeScene('POSTGIG')
            }, 4000)
          }
        }
        gameStateRef.current.health = next
        return next
      })
    },
    [addToast, changeScene, hasUpgrade, setLastGigStats]
  )

  /**
   * Attempts to register a hit for the active lane.
   * @param {number} laneIndex - Index of the lane to check.
   * @returns {boolean} True when the hit registers.
   */
  const handleHit = useCallback(
    laneIndex => {
      const state = gameStateRef.current
      // Use Tone.js AudioContext clock for hit detection to stay in sync with
      // audio playback and the visual frame loop.
      const now = getAudioTimeMs()
      const elapsed = now - state.startTime
      const toxicModeActive = state.isToxicMode

      let hitWindow = state.lanes[laneIndex].hitWindow
      if (state.modifiers.hitWindowBonus)
        hitWindow += state.modifiers.hitWindowBonus
      if (laneIndex === 0 && hasUpgrade('guitar_custom')) hitWindow += 50

      const note = checkHit(state.notes, laneIndex, elapsed, hitWindow)

      if (note) {
        note.hit = true
        note.visible = false // consumed

        // Play the specific note pitch
        if (note.originalNote && Number.isFinite(note.originalNote.p)) {
          const velocity = Number.isFinite(note.originalNote.v)
            ? note.originalNote.v
            : 127
          playNote(note.originalNote.p, state.lanes[laneIndex].id, velocity)
        } else {
          audioManager.playSFX('hit') // Fallback
        }

        let points = 100
        if (laneIndex === 1 && hasUpgrade('drum_trigger')) points = 120
        if (laneIndex === 0) points *= state.modifiers.guitarScoreMult || 1.0

        // Guestlist Effect: +20% score
        if (state.modifiers.guestlist) points *= 1.2

        const comboForScore = state.combo
        let finalScore = points + comboForScore * 10
        if (toxicModeActive) finalScore *= 4

        setScore(s => {
          const next = s + finalScore
          gameStateRef.current.score = next
          return next
        })
        setCombo(c => {
          const next = c + 1
          gameStateRef.current.combo = next
          gameStateRef.current.stats = updateGigPerformanceStats(
            gameStateRef.current.stats,
            { combo: next, overload: gameStateRef.current.overload }
          )
          return next
        })
        setHealth(h => {
          const next = Math.min(100, h + (toxicModeActive ? 4 : 2))
          gameStateRef.current.health = next
          return next
        })
        gameStateRef.current.stats.perfectHits++

        if (!toxicModeActive) {
          setOverload(o => {
            const gain = 4 // Increased gain to make Toxic Mode reachable
            const next = o + gain
            const peakCandidate = Math.min(next, 100)
            gameStateRef.current.stats = updateGigPerformanceStats(
              gameStateRef.current.stats,
              { combo: gameStateRef.current.combo, overload: peakCandidate }
            )
            if (next >= 100) {
              activateToxicMode()
              gameStateRef.current.overload = 0
              return 0
            }
            gameStateRef.current.overload = next
            return next
          })
        }
        return true
      } else {
        handleMiss(1, true) // Pass true for isEmptyHit
        return false
      }
    },
    [activateToxicMode, handleMiss, hasUpgrade]
  )

  /**
   * Advances the gig logic by one frame.
   * @param {number} deltaMS - Milliseconds elapsed since last frame.
   * @returns {void}
   */
  const update = useCallback(
    deltaMS => {
      const state = gameStateRef.current
      if (state.paused) return

      // Heckler Logic: Spawn projectiles randomly
      if (state.running && !activeEvent && !isGameOver) {
        const newProjectile = trySpawnProjectile(
          { health: state.health },
          state.rng, // Use consistent RNG
          window.innerWidth
        )
        if (newProjectile) {
          state.projectiles.push(newProjectile)
        }
      }

      // Update Projectiles
      if (state.projectiles.length > 0) {
        state.projectiles = updateProjectiles(
          state.projectiles,
          deltaMS,
          window.innerHeight
        )
      }

      if (!state.running || activeEvent || isGameOver) {
        if (!state.pauseTime) {
          state.pauseTime = getAudioTimeMs()
          // Only pause if not game over (Game Over stops audio explicitly)
          if (!isGameOver) {
            pauseAudio()
          }
        }
        return
      }

      if (state.pauseTime) {
        const durationPaused = getAudioTimeMs() - state.pauseTime
        state.startTime += durationPaused
        state.pauseTime = null
        resumeAudio()
      }

      const now = getAudioTimeMs()
      const elapsed = now - state.startTime
      state.elapsed = elapsed
      const duration = state.totalDuration
      setProgress(duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0)

      if (isToxicMode) {
        if (now > state.toxicModeEndTime) {
          setIsToxicMode(false)
          state.isToxicMode = false
        } else {
          state.toxicTimeTotal += deltaMS
        }
      }

      if (elapsed > state.totalDuration) {
        // console.log('[RhythmGame] Gig Ended naturally.')
        state.running = false
        setLastGigStats(
          buildGigStatsSnapshot(state.score, state.stats, state.toxicTimeTotal)
        )
        // Requirement: stop background music at end of minigame
        stopAudio()
        changeScene('POSTGIG')
        return
      }

      let missCount = 0
      const notes = state.notes
      let i = state.nextMissCheckIndex

      // Optimization: Only check notes starting from the last unchecked index
      while (i < notes.length) {
        const note = notes[i]

        // If note has already been handled (hit or invisible), skip it but advance index if it's the current pointer
        if (!note.visible || note.hit) {
          if (i === state.nextMissCheckIndex) {
            state.nextMissCheckIndex++
          }
          i++
          continue
        }

        // If note is far in the future, we can stop checking
        if (note.time > elapsed + NOTE_MISS_WINDOW_MS) {
          break
        }

        // If note is past the window and wasn't hit
        if (elapsed > note.time + NOTE_MISS_WINDOW_MS) {
          note.visible = false
          missCount++
          // Since we missed this note, we can advance the pointer
          if (i === state.nextMissCheckIndex) {
            state.nextMissCheckIndex++
          }
        }

        i++
      }

      if (missCount > 0) {
        handleMiss(missCount, false) // False for isEmptyHit (these are real missed notes)
      }
    },
    [
      activeEvent,
      changeScene,
      handleMiss,
      isGameOver,
      isToxicMode,
      setLastGigStats
    ]
  )

  // Input Handlers
  /**
   * Registers player input for a lane.
   * @param {number} laneIndex - Lane index.
   * @param {boolean} isDown - Whether the input is pressed.
   * @returns {void}
   */
  const registerInput = useCallback(
    (laneIndex, isDown) => {
      // Ignore input if game is not running or is paused
      if (!gameStateRef.current.running || activeEvent) return

      if (gameStateRef.current.lanes[laneIndex]) {
        gameStateRef.current.lanes[laneIndex].active = isDown
        if (isDown) handleHit(laneIndex)
      }
    },
    [activeEvent, handleHit]
  )

  return {
    gameStateRef,
    stats: {
      score,
      combo,
      health,
      progress,
      overload,
      isToxicMode,
      isGameOver
    },
    actions: { registerInput, activateToxicMode },
    update // Expose update to be driven by Ticker
  }
}
