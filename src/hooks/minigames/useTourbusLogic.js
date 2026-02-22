
import { useRef, useCallback, useEffect, useState } from 'react'
import { useGameState } from '../../context/GameState'
import { createCompleteTravelMinigameAction } from '../../context/actionCreators'

export const LANE_COUNT = 3
export const BASE_SPEED = 0.05 // relative units per ms
export const SPAWN_RATE_MS = 1500
export const TARGET_DISTANCE = 2000
export const BUS_Y_PERCENT = 85 // Bus position in % of screen height
export const BUS_HEIGHT_PERCENT = 10

export const useTourbusLogic = () => {
  const { state, dispatch } = useGameState()
  const { minigame } = state

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

  const update = useCallback((deltaMS) => {
    const game = gameStateRef.current
    if (game.isGameOver) return

    // Update stats ref for Pixi
    statsRef.current.health = Math.max(0, 100 - game.damage)
    statsRef.current.isGameOver = game.isGameOver

    // Move Distance
    game.distance += game.speed * deltaMS

    // Spawn Obstacles
    game.lastSpawnTime += deltaMS
    if (game.lastSpawnTime > SPAWN_RATE_MS) {
      spawnObstacle(Date.now())
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
          game.damage += 10
        } else if (obs.type === 'FUEL') {
           game.itemsCollected.push('FUEL')
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
      dispatch(createCompleteTravelMinigameAction(game.damage, game.itemsCollected))
    }

    // Sync UI occasionally
    setUiState(prev => {
      // Optimize updates to avoid React thrashing
      const distDiff = Math.abs(prev.distance - game.distance)
      if (distDiff > 50 || prev.damage !== game.damage || prev.isGameOver !== game.isGameOver) {
        return {
          distance: Math.floor(game.distance),
          damage: game.damage,
          isGameOver: game.isGameOver
        }
      }
      return prev
    })

  }, [dispatch])

  // Setup keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveLeft()
      if (e.code === 'ArrowRight' || e.code === 'KeyD') moveRight()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [moveLeft, moveRight])

  return {
    gameStateRef, // Passed to Pixi
    stats: statsRef.current, // Passed to Pixi (initial/ref)
    update, // Passed to Pixi
    uiState,
    actions: { moveLeft, moveRight }
  }
}
