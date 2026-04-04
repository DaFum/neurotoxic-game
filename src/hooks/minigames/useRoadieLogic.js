/*
 * (#1) Actual Updates: Refactored logic to reduce cognitive complexity and improve testability.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import { useRef, useCallback, useEffect, useState } from 'react'
import { useGameState } from '../../context/GameState'
import { GAME_PHASES } from '../../context/gameConstants'
import { audioManager } from '../../utils/AudioManager'
import {
  ROADIE_GRID_WIDTH,
  ROADIE_GRID_HEIGHT,
  ROADIE_MOVE_COOLDOWN_BASE
} from './constants'
import { hashString } from '../../utils/stringUtils'

const TRAFFIC_ROWS = [1, 2, 3, 4, 5, 6]
// Speed: 0.01 cells/ms = 10 cells/sec. Grid is 12 wide. 1.2 sec to cross.
// Fast cars: 0.015
// Slow trucks: 0.005
const TRAFFIC_SPEEDS = [0.005, -0.009, 0.012, -0.007, 0.015, -0.01]
const CAR_SPAWN_RATES = [2500, 2200, 1600, 2800, 1400, 2000] // Slightly denser

// --- Extracted Game Logic ---

export function checkCollision(car, playerPos) {
  if (car.row !== playerPos.y) return false

  const pLeft = playerPos.x + 0.1
  const pRight = playerPos.x + 0.9
  const cLeft = car.x
  const cRight = car.x + car.width

  return pLeft < cRight && pRight > cLeft
}

export function handleCrash(game, onGameOver) {
  audioManager.playSFX('crash')

  if (game.carrying) {
    game.equipmentDamage = Math.max(0, Math.min(100, game.equipmentDamage + 10))

    if (game.equipmentDamage >= 100) {
      game.isGameOver = true
      game.playerPos.y = 0
      game.playerPos.x = 6
      onGameOver(100)
    } else {
      game.playerPos.y = 0
      game.playerPos.x = 6
    }
  } else {
    game.playerPos.y = 0
    game.playerPos.x = 6
  }
}

export function spawnTraffic(game, deltaMS) {
  game.spawners.forEach(spawner => {
    spawner.timer += deltaMS
    while (spawner.timer > spawner.rate) {
      spawner.timer -= spawner.rate

      const id = `${performance.now()}-${spawner.row}-${spawner.timer}`

      game.traffic.push({
        id,
        textureHash: Math.abs(hashString(id)),
        row: spawner.row,
        x: spawner.speed > 0 ? -1 : ROADIE_GRID_WIDTH,
        speed: spawner.speed,
        width: 1.5
      })
    }
  })
}

export function processTraffic(game, deltaMS, onCrash) {
  const traffic = game.traffic
  let writeIdx = 0
  let crashed = false

  for (let i = 0; i < traffic.length; i++) {
    const car = traffic[i]
    car.x += car.speed * deltaMS

    if (!crashed && checkCollision(car, game.playerPos)) {
      crashed = true
      handleCrash(game, onCrash)
    }

    let keep = false
    if (car.speed > 0) {
      if (car.x < ROADIE_GRID_WIDTH + 2) keep = true
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

  if (traffic.length > writeIdx) {
    traffic.length = writeIdx
  }
  return crashed
}

export function handlePickup(game) {
  if (
    game.playerPos.y === 0 &&
    !game.carrying &&
    game.itemsToDeliver.length > 0
  ) {
    game.carrying = game.itemsToDeliver.pop()
    audioManager.playSFX('pickup')
  }
}

export function handleDelivery(game, onGameOver) {
  if (game.playerPos.y === ROADIE_GRID_HEIGHT - 1 && game.carrying) {
    game.itemsDelivered.push(game.carrying)
    game.carrying = null
    audioManager.playSFX('deliver')

    if (game.itemsToDeliver.length === 0) {
      game.isGameOver = true
      onGameOver(game.equipmentDamage)
    }
  }
}

// --- End Extracted Game Logic ---

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
      const cooldown = ROADIE_MOVE_COOLDOWN_BASE * weight

      if (now - game.lastMoveTime < cooldown) return

      const newX = Math.max(
        0,
        Math.min(ROADIE_GRID_WIDTH - 1, game.playerPos.x + dx)
      )
      const newY = Math.max(
        0,
        Math.min(ROADIE_GRID_HEIGHT - 1, game.playerPos.y + dy)
      )

      game.playerPos = { x: newX, y: newY }
      game.lastMoveTime = now

      handlePickup(game)
      handleDelivery(game, completeRoadieMinigame)

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

  const update = useCallback(
    deltaMS => {
      const game = gameStateRef.current
      if (game.isGameOver) return

      spawnTraffic(game, deltaMS)
      const crashed = processTraffic(game, deltaMS, completeRoadieMinigame)

      if (crashed) {
        setUiState(prev => ({
          ...prev,
          currentDamage: game.equipmentDamage,
          isGameOver: game.isGameOver
        }))
      }
    },
    [completeRoadieMinigame]
  )

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
    if (uiState.isGameOver && currentScene === GAME_PHASES.PRE_GIG_MINIGAME) {
      if (hasTransitionedRef.current) return

      const timeout = setTimeout(() => {
        // Double check scene hasn't changed
        if (
          currentSceneRef.current === GAME_PHASES.PRE_GIG_MINIGAME &&
          !hasTransitionedRef.current
        ) {
          hasTransitionedRef.current = true
          changeScene(GAME_PHASES.GIG)
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
