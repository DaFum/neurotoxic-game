import { useRef, useCallback, useEffect, useState } from 'react'
import { useGameState } from '../../context/GameState'
import { audioManager } from '../../utils/AudioManager'
import { hasUpgrade } from '../../utils/upgradeUtils'

export const LANE_COUNT = 3
export const BASE_SPEED = 0.05 // relative units per ms
export const MAX_SPEED = 0.12
export const SPAWN_RATE_MS = 1500
export const TARGET_DISTANCE = 2500
export const BUS_Y_PERCENT = 85 // Bus position in % of screen height
export const BUS_HEIGHT_PERCENT = 10

export const useTourbusLogic = () => {
  const { player, completeTravelMinigame } = useGameState()

  // Game Loop State (Mutable, no re-renders)
  const gameStateRef = useRef({
    busLane: 1, // 0, 1, 2
    obstacles: [], // { id, lane, y (0-100), type }
    distance: 0,
    speed: BASE_SPEED,
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
    gameStateRef.current.busLane = Math.min(LANE_COUNT - 1, gameStateRef.current.busLane + 1)
  }, [])

  const spawnObstacle = (time) => {
    const lane = Math.floor(Math.random() * LANE_COUNT)
    const type = Math.random() > 0.8 ? 'FUEL' : 'OBSTACLE' // 20% chance for fuel
    gameStateRef.current.obstacles.push({
      id: `${time}-${Math.random()}`,
      lane,
      y: -10, // Start above screen (0 to 100 is visible area)
      type,
      collided: false
    })
  }

  // Track upgrades via ref to keep update stable
  const upgradesRef = useRef(player.van?.upgrades || [])
  useEffect(() => {
    upgradesRef.current = player.van?.upgrades || []
  }, [player.van?.upgrades])

  const update = useCallback((deltaMS) => {
    const game = gameStateRef.current
    if (game.isGameOver) return

    // Update stats ref for Pixi
    statsRef.current.health = Math.max(0, 100 - game.damage)
    statsRef.current.isGameOver = game.isGameOver

    // Progression: Speed increases with distance
    // Reach Max Speed at 80% of target distance
    const progress = Math.min(1, game.distance / (TARGET_DISTANCE * 0.8))
    game.speed = BASE_SPEED + (MAX_SPEED - BASE_SPEED) * progress

    // Spawn Rate scales with speed to maintain constant spatial density.
    // Rate = (BASE_SPEED * SPAWN_RATE_MS) / currentSpeed
    // We maintain a density where obstacles appear at consistent distances relative to speed.
    // We also apply a clamp (600ms) to ensure it doesn't get unplayably fast if speed were to spike.
    const currentSpawnRate = Math.max(600, (BASE_SPEED * SPAWN_RATE_MS) / game.speed)

    // Move Distance
    game.distance += game.speed * deltaMS

    // Spawn Obstacles
    game.lastSpawnTime += deltaMS
    if (game.lastSpawnTime > currentSpawnRate) {
      spawnObstacle(performance.now())
      game.lastSpawnTime = 0
    }

    // Move Obstacles & Collision
    const survivingObstacles = []

    // Speed of obstacles relative to bus.
    // If we assume camera follows bus, objects move down.
    // Speed in % of screen height per ms.
    // Let's say 0.05 units per ms -> 50% screen per second.
    const obstacleSpeed = game.speed

    game.obstacles.forEach(obs => {
      obs.y += obstacleSpeed * deltaMS

      let collided = false
      if (
        !obs.collided &&
        obs.y > BUS_Y_PERCENT &&
        obs.y < BUS_Y_PERCENT + BUS_HEIGHT_PERCENT &&
        obs.lane === game.busLane
      ) {
        collided = true
        obs.collided = true
        if (obs.type === 'OBSTACLE') {
          // Damage Mitigation
          let hitDamage = 10
          // Prioritize Armor (2) over Bullbar (5)
          if (hasUpgrade(upgradesRef.current, 'van_armor')) {
            hitDamage = 2
          } else if (hasUpgrade(upgradesRef.current, 'van_bullbar')) {
            hitDamage = 5
          }

          game.damage = Math.max(0, Math.min(100, game.damage + hitDamage))
          audioManager.playSFX('crash') // Play SFX immediately on collision
        } else if (obs.type === 'FUEL') {
           game.itemsCollected.push('FUEL')
           audioManager.playSFX('pickup')
        }
      }

      if (obs.y < 120) { // Keep if strictly less than 120 (buffer below screen)
         survivingObstacles.push(obs)
      }
    })
    gameStateRef.current.obstacles = survivingObstacles

    // Check Win/Loss
    if (game.distance >= TARGET_DISTANCE && !game.isGameOver) {
      game.isGameOver = true
      completeTravelMinigame(game.damage, game.itemsCollected)
    }

    // Sync UI occasionally
    setUiState(prev => {
      // Optimize updates to avoid React thrashing
      const distDiff = Math.abs(prev.distance - game.distance)

      // SFX Triggers moved to main update loop to avoid double-fire in Strict Mode

      // Check items collected logic requires separate tracking or relying on game loop event
      // Since itemsCollected is an array, we can track length in UI state or just fire here?
      // Mutable game state doesn't allow "diff" easily unless we store prev in ref.
      // But here we are inside update loop. We know if we just collided.

      if (distDiff > 50 || prev.damage !== game.damage || prev.isGameOver !== game.isGameOver) {
        return {
          distance: Math.floor(game.distance),
          damage: game.damage,
          isGameOver: game.isGameOver
        }
      }
      return prev
    })

  }, [completeTravelMinigame])

  // Setup keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault()
        moveLeft()
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault()
        moveRight()
      }
      // Backdoor for E2E testing
      if (import.meta.env?.DEV && e.code === 'KeyP' && e.shiftKey) {
        e.preventDefault()
        if (gameStateRef.current.isGameOver) return
        gameStateRef.current.distance = TARGET_DISTANCE
        gameStateRef.current.isGameOver = true
        completeTravelMinigame(0, [])
        setUiState(prev => ({ ...prev, distance: TARGET_DISTANCE, isGameOver: true }))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [moveLeft, moveRight, completeTravelMinigame])

  return {
    gameStateRef, // Passed to Pixi
    stats: statsRef.current, // Passed to Pixi (initial/ref)
    update, // Passed to Pixi
    uiState,
    actions: { moveLeft, moveRight }
  }
}
