import { useRef, useCallback, useEffect, useState } from 'react'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { audioService } from '../../utils/audio/audioEngine'
import { hasUpgrade } from '../../utils/upgradeUtils'
import {
  TOURBUS_LANE_COUNT,
  TOURBUS_BUS_Y_PERCENT,
  TOURBUS_BUS_HEIGHT_PERCENT,
  TOURBUS_BASE_SPEED,
  TOURBUS_MAX_SPEED,
  TOURBUS_SPAWN_RATE_MS,
  TOURBUS_TARGET_DISTANCE
} from './minigameConstants'
import { getSafeRandom } from '../../utils/crypto'
import { clamp0to100 } from '../../utils/gameStateUtils'

import type { TourbusObstacle, TourbusObstacleType } from '../../types/tourbus'

type TourbusLogicState = {
  busLane: number
  obstacles: TourbusObstacle[]
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

// Re-export constants for backward compatibility and tests
export {
  TOURBUS_BASE_SPEED as BASE_SPEED,
  TOURBUS_MAX_SPEED as MAX_SPEED,
  TOURBUS_SPAWN_RATE_MS as SPAWN_RATE_MS,
  TOURBUS_TARGET_DISTANCE as TARGET_DISTANCE
} from './minigameConstants'

export const HIT_DAMAGE_BASE = 10
export const HIT_DAMAGE_ARMOR = 2
export const HIT_DAMAGE_BULLBAR = 5

/**
 * Calculates damage taken from a hit, applying mitigation from upgrades.
 * Prioritizes Armor over Bullbar.
 */
export const getHitDamage = (upgrades: string[]) => {
  if (hasUpgrade(upgrades, 'van_armor')) {
    return HIT_DAMAGE_ARMOR
  }
  if (hasUpgrade(upgrades, 'van_bullbar')) {
    return HIT_DAMAGE_BULLBAR
  }
  return HIT_DAMAGE_BASE
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
const spawnObstacles = (
  game: TourbusLogicState,
  currentSpawnRate: number,
  deltaMS: number
) => {
  game.lastSpawnTime += deltaMS
  while (game.lastSpawnTime >= currentSpawnRate) {
    const time = performance.now()
    const safeRandomLane = getSafeRandom()
    const safeRandomType = getSafeRandom()
    const safeRandomId = getSafeRandom()

    const lane = Math.floor(safeRandomLane * TOURBUS_LANE_COUNT)
    let type: TourbusObstacleType = 'OBSTACLE'
    if (safeRandomType > 0.9) {
      type = 'VOID_HAZARD' // 10% chance
    } else if (safeRandomType > 0.7) {
      type = 'FUEL' // 20% chance
    }
    game.obstacles.push({
      id: `${time}-${safeRandomId}`,
      lane,
      y: -10, // Start above screen (0 to 100 is visible area)
      type,
      collided: false
    })
    game.lastSpawnTime -= currentSpawnRate
  }
}

/**
 * Moves obstacles and handles collisions with the bus.
 */
const processObstacles = (
  game: TourbusLogicState,
  deltaMS: number,
  upgrades: string[]
) => {
  const survivingObstacles: TourbusObstacle[] = []
  const obstacleSpeed = game.speed

  for (let i = 0; i < game.obstacles.length; i++) {
    const obs = game.obstacles[i]
    if (!obs) continue
    obs.y += obstacleSpeed * deltaMS

    if (
      !obs.collided &&
      obs.y > TOURBUS_BUS_Y_PERCENT &&
      obs.y < TOURBUS_BUS_Y_PERCENT + TOURBUS_BUS_HEIGHT_PERCENT &&
      obs.lane === game.busLane
    ) {
      obs.collided = true
      if (obs.type === 'OBSTACLE') {
        const hitDamage = getHitDamage(upgrades)
        game.damage = clamp0to100(game.damage + hitDamage)
        audioService.playSFX('crash')
      } else if (obs.type === 'FUEL') {
        game.itemsCollected.push('FUEL')
        audioService.playSFX('pickup')
      } else if (obs.type === 'VOID_HAZARD') {
        game.itemsCollected.push('VOID_HAZARD')
        audioService.playSFX('void_hit')
      }
    }

    if (obs.y < 120) {
      survivingObstacles.push(obs)
    }
  }
  game.obstacles = survivingObstacles
}

/**
 * Synchronizes the mutable game state with the UI state if necessary.
 */
const syncUiState = (
  game: TourbusLogicState,
  setUiState: React.Dispatch<React.SetStateAction<UiState>>
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

export const useTourbusLogic = () => {
  const player = useGameSelector(state => state.player)
  const { completeTravelMinigame } = useGameActions()

  // Game Loop State (Mutable, no re-renders)
  const gameStateRef = useRef<TourbusLogicState>({
    busLane: 1, // 0, 1, 2
    obstacles: [], // { id, lane, y (0-100), type }
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

  const update = useCallback(
    (deltaMS: number) => {
      const game = gameStateRef.current
      if (game.isGameOver) return

      const currentSpawnRate = updateGameSpeed(game)
      game.distance += game.speed * deltaMS

      spawnObstacles(game, currentSpawnRate, deltaMS)
      processObstacles(game, deltaMS, upgradesRef.current)

      // Check Win/Loss
      if (
        game.distance >= TOURBUS_TARGET_DISTANCE &&
        !game.isGameOver &&
        !finishCalledRef.current
      ) {
        finishCalledRef.current = true
        game.isGameOver = true
        completeTravelMinigame(game.damage, game.itemsCollected)
      }

      // Update stats ref for Pixi
      statsRef.current.health = Math.max(0, 100 - game.damage)
      statsRef.current.isGameOver = game.isGameOver

      syncUiState(game, setUiState)
    },
    [completeTravelMinigame]
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
    finishMinigame: useCallback(() => {
      if (finishCalledRef.current || gameStateRef.current.isGameOver) return
      finishCalledRef.current = true

      gameStateRef.current.isGameOver = true
      completeTravelMinigame(
        gameStateRef.current.damage,
        gameStateRef.current.itemsCollected
      )
      statsRef.current.health = Math.max(0, 100 - gameStateRef.current.damage)
      statsRef.current.isGameOver = true
      setUiState(prev => ({
        ...prev,
        isGameOver: true
      }))
    }, [completeTravelMinigame])
  }
}
