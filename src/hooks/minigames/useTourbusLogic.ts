import { useRef, useCallback, useEffect, useState } from 'react'
import { useGameState } from '../../context/GameState'
import { audioManager } from '../../utils/audio/AudioManager'
import { hasUpgrade } from '../../utils/upgradeUtils'
import {
  TOURBUS_LANE_COUNT,
  TOURBUS_BUS_Y_PERCENT,
  TOURBUS_BUS_HEIGHT_PERCENT,
  TOURBUS_BASE_SPEED,
  TOURBUS_MAX_SPEED,
  TOURBUS_SPAWN_RATE_MS,
  TOURBUS_TARGET_DISTANCE
} from './constants'
import { getSafeRandom } from '../../utils/crypto'

// Re-export constants for backward compatibility and tests
export {
  TOURBUS_BASE_SPEED as BASE_SPEED,
  TOURBUS_MAX_SPEED as MAX_SPEED,
  TOURBUS_SPAWN_RATE_MS as SPAWN_RATE_MS,
  TOURBUS_TARGET_DISTANCE as TARGET_DISTANCE
} from './constants'

export const HIT_DAMAGE_BASE = 10
export const HIT_DAMAGE_ARMOR = 2
export const HIT_DAMAGE_BULLBAR = 5

/**
 * Calculates damage taken from a hit, applying mitigation from upgrades.
 * Prioritizes Armor over Bullbar.
 */
export const getHitDamage = upgrades => {
  if (hasUpgrade(upgrades, 'van_armor')) {
    return HIT_DAMAGE_ARMOR
  }
  if (hasUpgrade(upgrades, 'van_bullbar')) {
    return HIT_DAMAGE_BULLBAR
  }
  return HIT_DAMAGE_BASE
}

export const useTourbusLogic = () => {
  const { player, completeTravelMinigame } = useGameState()

  // Game Loop State (Mutable, no re-renders)
  const gameStateRef = useRef({
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
  const [uiState, setUiState] = useState({
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
    deltaMS => {
      const game = gameStateRef.current
      if (game.isGameOver) return

      // Progression: Speed increases with distance
      // Reach Max Speed at 80% of target distance
      const progress = Math.min(
        1,
        game.distance / (TOURBUS_TARGET_DISTANCE * 0.8)
      )
      game.speed =
        TOURBUS_BASE_SPEED + (TOURBUS_MAX_SPEED - TOURBUS_BASE_SPEED) * progress

      // Spawn Rate scales with speed to maintain constant spatial density.
      // Rate = (TOURBUS_BASE_SPEED * TOURBUS_SPAWN_RATE_MS) / currentSpeed
      // We maintain a density where obstacles appear at consistent distances relative to speed.
      // We also apply a clamp (600ms) to ensure it doesn't get unplayably fast if speed were to spike.
      const currentSpawnRate = Math.max(
        600,
        (TOURBUS_BASE_SPEED * TOURBUS_SPAWN_RATE_MS) / game.speed
      )

      // Move Distance
      game.distance += game.speed * deltaMS

      // Spawn Obstacles
      game.lastSpawnTime += deltaMS
      while (game.lastSpawnTime >= currentSpawnRate) {
        const time = performance.now()
        const safeRandomLane = getSafeRandom()
        const safeRandomType = getSafeRandom()
        const safeRandomId = getSafeRandom()

        const lane = Math.floor(safeRandomLane * TOURBUS_LANE_COUNT)
        const type = safeRandomType > 0.8 ? 'FUEL' : 'OBSTACLE' // 20% chance for fuel
        game.obstacles.push({
          id: `${time}-${safeRandomId}`,
          lane,
          y: -10, // Start above screen (0 to 100 is visible area)
          type,
          collided: false
        })
        game.lastSpawnTime -= currentSpawnRate
      }

      // Move Obstacles & Collision
      const survivingObstacles = []

      // Speed of obstacles relative to bus.
      // If we assume camera follows bus, objects move down.
      // Speed in % of screen height per ms.
      // Let's say 0.05 units per ms -> 50% screen per second.
      const obstacleSpeed = game.speed

      for (let i = 0; i < game.obstacles.length; i++) {
        const obs = game.obstacles[i]
        obs.y += obstacleSpeed * deltaMS

        if (
          !obs.collided &&
          obs.y > TOURBUS_BUS_Y_PERCENT &&
          obs.y < TOURBUS_BUS_Y_PERCENT + TOURBUS_BUS_HEIGHT_PERCENT &&
          obs.lane === game.busLane
        ) {
          obs.collided = true
          if (obs.type === 'OBSTACLE') {
            // Damage Mitigation
            const hitDamage = getHitDamage(upgradesRef.current)

            game.damage = Math.max(0, Math.min(100, game.damage + hitDamage))
            audioManager.playSFX('crash') // Play SFX immediately on collision
          } else if (obs.type === 'FUEL') {
            game.itemsCollected.push('FUEL')
            audioManager.playSFX('pickup')
          }
        }

        if (obs.y < 120) {
          // Keep if strictly less than 120 (buffer below screen)
          survivingObstacles.push(obs)
        }
      }
      gameStateRef.current.obstacles = survivingObstacles

      // Check Win/Loss
      if (game.distance >= TOURBUS_TARGET_DISTANCE && !game.isGameOver) {
        game.isGameOver = true
        completeTravelMinigame(game.damage, game.itemsCollected)
      }

      // Update stats ref for Pixi
      statsRef.current.health = Math.max(0, 100 - game.damage)
      statsRef.current.isGameOver = game.isGameOver

      // Sync UI occasionally
      setUiState(prev => {
        // Optimize updates to avoid React thrashing
        const distDiff = Math.abs(prev.distance - game.distance)

        // SFX Triggers moved to main update loop to avoid double-fire in Strict Mode

        // Check items collected logic requires separate tracking or relying on game loop event
        // Since itemsCollected is an array, we can track length in UI state or just fire here?
        // Mutable game state doesn't allow "diff" easily unless we store prev in ref.
        // But here we are inside update loop. We know if we just collided.

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
    },
    [completeTravelMinigame]
  )

  // Setup keyboard controls
  useEffect(() => {
    const handleKeyDown = e => {
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
      if (finishCalledRef.current) return
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
