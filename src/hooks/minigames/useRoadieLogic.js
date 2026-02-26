import { useRef, useCallback, useEffect, useState } from 'react'
import { useGameState } from '../../context/GameState'
import { audioManager } from '../../utils/AudioManager'
import { GRID_WIDTH, GRID_HEIGHT } from './constants'

export const MOVE_COOLDOWN_BASE = 120 // ms (Faster base movement)

const TRAFFIC_ROWS = [1, 2, 3, 4, 5, 6]
// Speed: 0.01 cells/ms = 10 cells/sec. Grid is 12 wide. 1.2 sec to cross.
// Fast cars: 0.015
// Slow trucks: 0.005
const TRAFFIC_SPEEDS = [0.005, -0.009, 0.012, -0.007, 0.015, -0.01]
const CAR_SPAWN_RATES = [2500, 2200, 1600, 2800, 1400, 2000] // Slightly denser

export const useRoadieLogic = () => {
  const { completeRoadieMinigame, currentScene, changeScene } = useGameState()

  // Mutable Game State
  const gameStateRef = useRef({
    playerPos: { x: 6, y: 0 },
    carrying: null, // { type, weight }
    itemsToDeliver: [
      { id: 'amp', type: 'AMP', weight: 2 },
      { id: 'drums', type: 'DRUMS', weight: 1.5 },
      { id: 'guitar', type: 'GUITAR', weight: 1 }
    ],
    itemsDelivered: [],
    traffic: [], // { id, row, x (float), speed }
    lastMoveTime: 0,
    equipmentDamage: 0,
    isGameOver: false,
    spawners: TRAFFIC_ROWS.map((row, i) => ({
      row,
      timer: 0,
      rate: CAR_SPAWN_RATES[i],
      speed: TRAFFIC_SPEEDS[i]
    }))
  })

  // UI State
  const [uiState, setUiState] = useState({
    itemsRemaining: 3,
    itemsDelivered: 0,
    currentDamage: 0,
    carrying: null,
    isGameOver: false
  })

  // Stats Ref for Pixi
  const statsRef = useRef({
    health: 100
  })

  const move = useCallback(
    (dx, dy) => {
      const game = gameStateRef.current
      if (game.isGameOver) return

      const now = Date.now()
      const weight = game.carrying ? game.carrying.weight : 1
      const cooldown = MOVE_COOLDOWN_BASE * weight

      if (now - game.lastMoveTime < cooldown) return

      const newX = Math.max(0, Math.min(GRID_WIDTH - 1, game.playerPos.x + dx))
      const newY = Math.max(0, Math.min(GRID_HEIGHT - 1, game.playerPos.y + dy))

      // Logic:
      // If at y=0 (Start), pick up item if not carrying
      // If at y=GRID_HEIGHT-1 (Venue), drop item

      // Check pickup
      if (newY === 0 && !game.carrying && game.itemsToDeliver.length > 0) {
        // Auto pickup next item? Or manual? Let's say auto for now.
        game.carrying = game.itemsToDeliver.pop()
        audioManager.playSFX('pickup')
      }

      // Check delivery
      if (newY === GRID_HEIGHT - 1 && game.carrying) {
        game.itemsDelivered.push(game.carrying)
        game.carrying = null
        audioManager.playSFX('deliver')
        // Win Condition check
        if (game.itemsToDeliver.length === 0 && !game.carrying) {
          game.isGameOver = true
          hasTransitionedRef.current = true
          completeRoadieMinigame(game.equipmentDamage)
        }
      }

      game.playerPos = { x: newX, y: newY }
      game.lastMoveTime = now

      // Update UI immediately for responsiveness
      setUiState(prev => ({
        ...prev,
        itemsRemaining: game.itemsToDeliver.length,
        itemsDelivered: game.itemsDelivered.length,
        carrying: game.carrying,
        isGameOver: game.isGameOver
      }))
    },
    [completeRoadieMinigame]
  )

  const update = useCallback(deltaMS => {
    const game = gameStateRef.current
    if (game.isGameOver) return

    // Spawn Traffic
    game.spawners.forEach(spawner => {
      spawner.timer += deltaMS
      if (spawner.timer > spawner.rate) {
        spawner.timer = 0
        game.traffic.push({
          id: `${performance.now()}-${spawner.row}`,
          row: spawner.row,
          x: spawner.speed > 0 ? -1 : GRID_WIDTH, // Start outside
          speed: spawner.speed,
          width: 1.5 // Car width in cells
        })
      }
    })

    // Move Traffic & Collision (Optimized: in-place update)
    const traffic = game.traffic
    let writeIdx = 0

    for (let i = 0; i < traffic.length; i++) {
      const car = traffic[i]
      car.x += car.speed * deltaMS

      // Collision
      // Player is at integer (x,y). Car is at float x, integer row.
      // Bounding box overlap.
      // Player width ~0.8. Car width ~1.5.
      if (car.row === game.playerPos.y) {
        const pLeft = game.playerPos.x + 0.1
        const pRight = game.playerPos.x + 0.9
        const cLeft = car.x
        const cRight = car.x + car.width

        if (pLeft < cRight && pRight > cLeft) {
          // Hit!
          audioManager.playSFX('crash')
          if (game.carrying) {
            game.equipmentDamage = Math.max(
              0,
              Math.min(100, game.equipmentDamage + 10)
            )

            if (game.equipmentDamage >= 100) {
              game.isGameOver = true
              game.playerPos.y = 0
              game.playerPos.x = 6
              hasTransitionedRef.current = true
              completeRoadieMinigame(100)
            } else {
              // Drop item? Or just damage?
              // Let's respawn player at start with item still? Or item damaged.
              // Let's say item is damaged, player respawns at start (y=0)
              game.playerPos.y = 0
              game.playerPos.x = 6 // Reset x
            }
          } else {
            // Just hit, respawn
            game.playerPos.y = 0
            game.playerPos.x = 6
          }
          setUiState(prev => ({
            ...prev,
            currentDamage: game.equipmentDamage,
            isGameOver: game.isGameOver
          }))
        }
      }

      // Cleanup Check
      let keep = false
      if (car.speed > 0) {
        if (car.x < GRID_WIDTH + 2) keep = true
      } else {
        if (car.x > -2) keep = true
      }

      if (keep) {
        if (i !== writeIdx) {
          traffic[writeIdx] = car
        }
        writeIdx++
      }
    }

    // Truncate array to remove dead items
    if (traffic.length > writeIdx) {
      traffic.length = writeIdx
    }
  }, [completeRoadieMinigame])

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault()
        move(-1, 0)
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault()
        move(1, 0)
      }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault()
        move(0, -1)
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault()
        move(0, 1)
      }
      // Backdoor for E2E testing
      if (import.meta.env?.DEV && e.code === 'KeyP' && e.shiftKey) {
        e.preventDefault()
        const game = gameStateRef.current
        game.isGameOver = true
        game.equipmentDamage = 5
        hasTransitionedRef.current = true
        completeRoadieMinigame(5)
        setUiState(prev => ({ ...prev, currentDamage: 5, isGameOver: true }))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [move, completeRoadieMinigame])

  // Initial setup: pickup first item
  useEffect(() => {
    if (
      !gameStateRef.current.carrying &&
      gameStateRef.current.itemsToDeliver.length > 0
    ) {
      gameStateRef.current.carrying = gameStateRef.current.itemsToDeliver.pop()
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setUiState(prev => ({
        ...prev,
        carrying: gameStateRef.current.carrying,
        itemsRemaining: gameStateRef.current.itemsToDeliver.length
      }))
    }
  }, [])

  const currentSceneRef = useRef(currentScene)
  const hasTransitionedRef = useRef(false)

  useEffect(() => {
    currentSceneRef.current = currentScene
  }, [currentScene])

  // Safety Fallback: Ensure scene advances if UI hangs
  useEffect(() => {
    if (uiState.isGameOver && currentScene === 'PRE_GIG_MINIGAME') {
      if (hasTransitionedRef.current) return

      const timeout = setTimeout(() => {
        // Double check scene hasn't changed
        if (
          currentSceneRef.current === 'PRE_GIG_MINIGAME' &&
          !hasTransitionedRef.current
        ) {
          hasTransitionedRef.current = true
          changeScene('GIG')
        }
      }, 10000) // 10s fallback
      return () => clearTimeout(timeout)
    }
  }, [uiState.isGameOver, currentScene, changeScene])

  return {
    gameStateRef,
    stats: statsRef.current,
    update,
    uiState,
    actions: { move }
  }
}
