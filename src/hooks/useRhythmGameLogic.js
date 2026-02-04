import { useRef, useState, useEffect, useCallback } from 'react'
import { useGameState } from '../context/GameState'
import { calculateGigPhysics, getGigModifiers } from '../utils/simulationUtils'
import { audioManager } from '../utils/AudioManager'
import {
  startMetalGenerator,
  stopAudio,
  pauseAudio,
  resumeAudio
} from '../utils/audioEngine'
import {
  buildGigStatsSnapshot,
  updateGigPerformanceStats
} from '../utils/gigStats'
import { generateNotesForSong, checkHit } from '../utils/rhythmUtils'

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
    startTime: Date.now(),
    pauseTime: null,
    speed: 500,
    modifiers: {},
    stats: { perfectHits: 0, misses: 0, maxCombo: 0, peakHype: 0 },
    // Mirror React State for Renderer
    combo: 0,
    health: 100,
    score: 0,
    isToxicMode: false,
    isGameOver: false,
    overload: 0,
    totalDuration: 0,
    toxicTimeTotal: 0,
    toxicModeEndTime: 0
  })

  const hasInitializedRef = useRef(false)

  /**
   * Initializes gig physics and note data once per gig.
   * @returns {void}
   */
  const initializeGigState = useCallback(() => {
    if (hasInitializedRef.current) {
      return
    }
    hasInitializedRef.current = true

    // Mute ambient radio to prevent audio overlap
    audioManager.stopMusic()

    try {
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
      const activeSetlist =
        setlist.length > 0
          ? setlist
          : [{ id: 'jam', name: 'Jam', bpm: 120, duration: 60, difficulty: 2 }]

      // Only generate notes for the active song (first in list for now, unless we implement full setlist sequencing)
      // The audio engine plays the first song. Notes should match.
      // If the intention is to play ONLY one song per gig scene invocation:
      const songsToPlay = [activeSetlist[0]]

      songsToPlay.forEach(song => {
        const songNotes = generateNotesForSong(song, {
          leadIn: currentTimeOffset,
          random: Math.random
        })
        notes = notes.concat(songNotes)
        // Add exact song duration to offset, no extra padding between songs if strictness is required
        // But usually a small gap is nice. The user said "nur die Sekunden dauert wie angegeben".
        // If setlist has multiple songs, the total duration is sum.
        // Let's stick to sum of durations.
        currentTimeOffset += song.duration * 1000
      })
      gameStateRef.current.notes = notes
      // The total duration of the gig is the end of the last song.
      // Adjust start time offset (2000ms lead-in) + sum of durations.
      gameStateRef.current.totalDuration = currentTimeOffset

      // Switch to Metal Generator
      const currentSong = activeSetlist[0]
      // Keep audio & visuals aligned; default to 0 when no audio is started (e.g., jam)
      let audioDelay = 0

      if (currentSong.id !== 'jam') {
        // Use 2.0s delay (Tone.js/audio in seconds) to match the 2000ms visual note lead-in used above
        audioDelay = 2.0
        startMetalGenerator(currentSong, audioDelay)
      }

      gameStateRef.current.startTime = Date.now()
      gameStateRef.current.running = true
      console.log('[RhythmGame] Initialized.', {
        startTime: gameStateRef.current.startTime,
        totalDuration: gameStateRef.current.totalDuration,
        audioDelay
      })
    } catch (error) {
      console.error(
        '[useRhythmGameLogic] Failed to initialize gig state.',
        error
      )
      addToast('Gig initialization failed!', 'error')
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
    gameStateRef.current.toxicModeEndTime = Date.now() + 10000
    addToast('TOXIC OVERLOAD!', 'success')
  }, [addToast])

  /**
   * Applies a miss penalty and updates state/refs.
   * @param {number} count - Number of misses to process (default 1)
   * @returns {void}
   */
  const handleMiss = useCallback(
    (count = 1) => {
      if (count <= 0) return

      setCombo(0)
      gameStateRef.current.combo = 0
      setOverload(o => {
        const next = Math.max(0, o - 5 * count)
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
      audioManager.playSFX('miss')

      const decayPerMiss = hasUpgrade('bass_sansamp') ? 3 : 5
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
              addToast('Returning to Map...', 'info')
              changeScene('OVERWORLD')
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
      // Use system time (Date.now) for hit detection to maintain sync with the AudioContext/Tone.js clock,
      // which runs independently of the visual frame loop (ticker).
      const now = Date.now()
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

        audioManager.playSFX('hit')

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
            const next = o + 1
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
        handleMiss()
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

      if (!state.running || activeEvent || isGameOver) {
        if (!state.pauseTime) {
          state.pauseTime = Date.now()
          // Only pause if not game over (Game Over stops audio explicitly)
          if (!isGameOver) {
            pauseAudio()
          }
        }
        return
      }

      if (state.pauseTime) {
        const durationPaused = Date.now() - state.pauseTime
        state.startTime += durationPaused
        state.pauseTime = null
        resumeAudio()
      }

      const now = Date.now()
      const elapsed = now - state.startTime
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
        console.log('[RhythmGame] Gig Ended naturally.', {
          elapsed,
          totalDuration: state.totalDuration,
          startTime: state.startTime,
          now
        })
        state.running = false
        setLastGigStats(
          buildGigStatsSnapshot(state.score, state.stats, state.toxicTimeTotal)
        )
        changeScene('POSTGIG')
        return
      }

      let missCount = 0
      state.notes.forEach(note => {
        if (note.visible && !note.hit) {
          if (elapsed > note.time + NOTE_MISS_WINDOW_MS) {
            note.visible = false
            missCount++
          }
        }
      })

      if (missCount > 0) {
        handleMiss(missCount)
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
  const registerInput = (laneIndex, isDown) => {
    // Ignore input if game is not running or is paused
    if (!gameStateRef.current.running || activeEvent) return

    if (gameStateRef.current.lanes[laneIndex]) {
      gameStateRef.current.lanes[laneIndex].active = isDown
      if (isDown) handleHit(laneIndex)
    }
  }

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
