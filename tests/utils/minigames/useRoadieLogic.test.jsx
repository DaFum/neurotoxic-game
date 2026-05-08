import { test, expect, describe, vi } from 'vitest'
import {
  checkCollision,
  handleCrash,
  handlePickup,
  handleDelivery
} from '../../../src/hooks/minigames/useRoadieLogic.ts'
import { ROADIE_GRID_HEIGHT } from '../../../src/hooks/minigames/minigameConstants.ts'

vi.mock('../../../src/utils/audio/AudioManager.ts', () => ({
  audioManager: { playSFX: vi.fn() }
}))

describe('useRoadieLogic - Contraband Mechanics and Minigame Rules', () => {
  test('checkCollision detects intersection', () => {
    const playerPos = { x: 5, y: 3 }
    const carHit = { x: 4.5, width: 1.5, row: 3 }
    const carMissRow = { x: 4.5, width: 1.5, row: 2 }
    const carMissX = { x: 7, width: 1.5, row: 3 }

    expect(checkCollision(carHit, playerPos)).toBe(true)
    expect(checkCollision(carMissRow, playerPos)).toBe(false)
    expect(checkCollision(carMissX, playerPos)).toBe(false)
  })

  test('handleCrash applies equipmentDamage and resets player when carrying', () => {
    let gameOverDamage = -1
    const onGameOver = damage => {
      gameOverDamage = damage
    }

    const game = {
      carrying: { type: 'CONTRABAND', weight: 1.5 },
      equipmentDamage: 50,
      playerPos: { x: 5, y: 3 },
      isGameOver: false
    }

    handleCrash(game, onGameOver)

    expect(game.equipmentDamage).toBe(60) // 50 + 10
    expect(game.playerPos.x).toBe(6)
    expect(game.playerPos.y).toBe(0)
    expect(game.isGameOver).toBe(false)
    expect(gameOverDamage).toBe(-1)
  })

  test('handleCrash triggers game over if damage reaches 100', () => {
    let gameOverDamage = -1
    const onGameOver = damage => {
      gameOverDamage = damage
    }

    const game = {
      carrying: { type: 'CONTRABAND', weight: 1.5 },
      equipmentDamage: 90,
      playerPos: { x: 5, y: 3 },
      isGameOver: false
    }

    handleCrash(game, onGameOver)

    expect(game.equipmentDamage).toBe(100) // 90 + 10 = 100
    expect(game.isGameOver).toBe(true)
    expect(gameOverDamage).toBe(100)
  })

  test('handleCrash resets player but applies no damage if not carrying', () => {
    const game = {
      carrying: null,
      equipmentDamage: 20,
      playerPos: { x: 5, y: 3 },
      isGameOver: false
    }

    handleCrash(game, () => {})

    expect(game.equipmentDamage).toBe(20) // No change
    expect(game.playerPos.x).toBe(6)
    expect(game.playerPos.y).toBe(0)
    expect(game.isGameOver).toBe(false)
  })

  test('handlePickup picks up next item if at y=0 and not carrying using shift', () => {
    const game = {
      carrying: null,
      playerPos: { x: 5, y: 0 },
      itemsToDeliver: [
        { type: 'CONTRABAND', weight: 1.5 },
        { type: 'AMP', weight: 2 }
      ]
    }

    handlePickup(game)

    expect(game.carrying.type).toBe('CONTRABAND')
    expect(game.itemsToDeliver.length).toBe(1)
  })

  test('handleDelivery delivers item and completes game if itemsToDeliver is empty', () => {
    let gameOverDamage = -1
    const onGameOver = damage => {
      gameOverDamage = damage
    }

    const game = {
      carrying: { type: 'CONTRABAND', weight: 1.5 },
      playerPos: { x: 5, y: ROADIE_GRID_HEIGHT - 1 },
      itemsDelivered: [],
      itemsToDeliver: [], // Empty means game over upon delivery
      equipmentDamage: 25,
      isGameOver: false
    }

    // handleDelivery checks if y === ROADIE_GRID_HEIGHT - 1
    handleDelivery(game, onGameOver)

    expect(game.itemsDelivered.length).toBe(1)
    expect(game.itemsDelivered[0].type).toBe('CONTRABAND')
    expect(game.carrying).toBeNull()
    expect(game.isGameOver).toBe(true)
    expect(gameOverDamage).toBe(25)
  })
})
