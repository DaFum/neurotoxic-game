import { useRef, useCallback, useEffect, useState } from 'react'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { audioService } from '../../utils/audio/audioEngine'
import { stepTourbusObstacles } from './tourbusLogicUtils'
import {
  TOURBUS_LANE_COUNT,
  TOURBUS_BASE_SPEED,
  TOURBUS_MAX_SPEED,
  TOURBUS_SPAWN_RATE_MS,
  TOURBUS_TARGET_DISTANCE
} from './minigameConstants'
import { getSafeRandom } from '../../utils/crypto'
import { finiteNumberOr } from '../../utils/gameState'

import type { TourbusObstacle, TourbusObstacleType } from '../../types/tourbus'
import type { AudioSfxType } from '../../utils/audio/AudioManager'

type TourbusLogicState = {
  busLane: number
  obstacles: TourbusObstacle[]
  nextObstacleId: number
  distance: number
  speed: number
  lastSpawnTime: number
  isGameOver: boolean
  damage: number
  itemsCollected: TourbusObstacleType[]
}

type UiState = {
  distance: number
  damage: number
  isGameOver: boolean
}

/**
 * Updates game speed based on distance and returns the current spawn rate.
 */
const updateGameSpeed = (game: TourbusLogicState): number => {
  const progress = Math.min(1, game.distance / (TOURBUS_TARGET_DISTANCE * 0.8))
  game.speed =
    TOURBUS_BASE_SPEED + (TOURBUS_MAX_SPEED - TOURBUS_BASE_SPEED) * progress

  return Math.max(
    600,
    (TOURBUS_BASE_SPEED * TOURBUS_SPAWN_RATE_MS) / game.speed
  )
}

/**
 * Spawns new obstacles based on elapsed time and current spawn rate.
 */
// ⚡ BOLT OPTIMIZATION: Replaced getSafeUUID() with a monotonic integer ID counter.
// Why: spawnObstacles runs inside the 60 FPS update tick during Tourbus minigame gameplay.
// Calling getSafeUUID() allocated a 36-character string and accessed Web Crypto entropy on every obstacle spawn.
// Impact: Eliminates Web Crypto entropy queries, string allocations, and GC pressure per obstacle spawn, enabling fast numeric Map/Set lookups in TourbusObstacleManager.
const spawnObstacles = (
  game: TourbusLogicState,
  currentSpawnRate: number,
  deltaMS: number
) => {
  game.lastSpawnTime += deltaMS
  while (game.lastSpawnTime >= currentSpawnRate) {
    const safeRandomLane = getSafeRandom()
    const safeRandomType = getSafeRandom()

    const lane = Math.floor(safeRandomLane * TOURBUS_LANE_COUNT)
    let type: TourbusObstacleType = 'OBSTACLE'
    if (safeRandomType > 0.9) {
      type = 'VOID_HAZARD' // 10% chance
    } else if (safeRandomType > 0.7) {
      type = 'FUEL' // 20% chance
    }
    game.obstacles.push({
      id: ++game.nextObstacleId,
      lane,
      y: -10, // Start above screen (0 to 100 is visible area)
      type,
      collided: false
    })
    game.lastSpawnTime -= currentSpawnRate
  }
}

/** Sound played when the bus collides with each obstacle type. */
const COLLISION_SFX: Record<TourbusObstacleType, AudioSfxType> = {
  OBSTACLE: 'crash',
  FUEL: 'pickup',
  VOID_HAZARD: 'void_hit'
}

/**
 * Moves obstacles and handles collisions with the bus.
 */
const processObstacles = (
  game: TourbusLogicState,
  deltaMS: number,
  upgrades: string[]
) => {
  const collisions = stepTourbusObstacles(game, game.speed * deltaMS, upgrades)
  for (const type of collisions) {
    audioService.playSFX(COLLISION_SFX[type])
  }
}

/**
 * Synchronizes the mutable game state with the UI state if necessary.
 */
const syncUiState = (
  game: TourbusLogicState,
  setUiState: (value: UiState | ((prevState: UiState) => UiState)) => void
) => {
  setUiState(prev => {
    const distDiff = Math.abs(prev.distance - game.distance)

    if (
      distDiff > 50 ||
      prev.damage !== game.damage ||
      prev.isGameOver !== game.isGameOver
    ) {
      return {
        distance: Math.floor(game.distance),
        damage: game.damage,
        isGameOver: game.isGameOver
      }
    }
    return prev
  })
}

/**
 * Owns tourbus minigame state, controls, obstacle updates, and completion dispatch.
 *
 * @returns Mutable stage state, UI state, controls, update callback, and forced-finish callback.
 */
export const useTourbusLogic = () => {
  const player = useGameSelector(state => state.player)
  const { completeTravelMinigame } = useGameActions()

  // Game Loop State (Mutable, no re-renders)
  const gameStateRef = useRef<TourbusLogicState>({
    busLane: 1, // 0, 1, 2
    obstacles: [], // { id, lane, y (0-100), type }
    nextObstacleId: 0,
    distance: 0,
    speed: TOURBUS_BASE_SPEED,
    lastSpawnTime: 0,
    isGameOver: false,
    damage: 0,
    itemsCollected: []
  })

  // UI State (Triggers re-renders)
  const [uiState, setUiState] = useState<UiState>({
    distance: 0,
    damage: 0,
    isGameOver: false
  })

  const statsRef = useRef({
    score: 0,
    combo: 0,
    health: 100,
    isToxicMode: false,
    isGameOver: false,
    isAudioReady: true
  })
  const finishCalledRef = useRef(false)

  const moveLeft = useCallback(() => {
    if (gameStateRef.current.isGameOver) return
    gameStateRef.current.busLane = Math.max(0, gameStateRef.current.busLane - 1)
  }, [])

  const moveRight = useCallback(() => {
    if (gameStateRef.current.isGameOver) return
    gameStateRef.current.busLane = Math.min(
      TOURBUS_LANE_COUNT - 1,
      gameStateRef.current.busLane + 1
    )
  }, [])

  // Track upgrades via ref to keep update stable
  const upgradesRef = useRef(player.van?.upgrades || [])
  useEffect(() => {
    upgradesRef.current = player.van?.upgrades || []
  }, [player.van?.upgrades])

  // Shared completion path for the natural finish (update loop) and the forced
  // finish. The update loop syncs stats/UI itself right afterwards, so only the
  // forced finish requests the immediate sync.
  const endRun = useCallback(
    (syncImmediately: boolean) => {
      const game = gameStateRef.current
      if (finishCalledRef.current || game.isGameOver) return
      finishCalledRef.current = true
      game.isGameOver = true
      completeTravelMinigame(game.damage, game.itemsCollected)
      if (!syncImmediately) return
      statsRef.current.health = Math.max(0, 100 - game.damage)
      statsRef.current.isGameOver = true
      setUiState(prev => ({
        ...prev,
        isGameOver: true
      }))
    },
    [completeTravelMinigame]
  )

  const update = useCallback(
    (deltaMS: number) => {
      const game = gameStateRef.current
      if (game.isGameOver) return

      const currentSpawnRate = updateGameSpeed(game)
      const clampedDelta = Math.max(
        0,
        Math.min(finiteNumberOr(deltaMS, 0), 100)
      )
      game.distance += game.speed * clampedDelta

      spawnObstacles(game, currentSpawnRate, clampedDelta)
      processObstacles(game, clampedDelta, upgradesRef.current)

      // Check Win/Loss
      if (game.distance >= TOURBUS_TARGET_DISTANCE) {
        endRun(false)
      }

      // Update stats ref for Pixi
      statsRef.current.health = Math.max(0, 100 - game.damage)
      statsRef.current.isGameOver = game.isGameOver

      syncUiState(game, setUiState)
    },
    [endRun]
  )

  // Setup keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault()
        moveLeft()
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault()
        moveRight()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [moveLeft, moveRight])

  return {
    gameStateRef, // Passed to Pixi
    stats: statsRef.current, // Passed to Pixi (initial/ref)
    update, // Passed to Pixi
    uiState,
    actions: { moveLeft, moveRight },
    finishMinigame: useCallback(() => endRun(true), [endRun])
  }
}
