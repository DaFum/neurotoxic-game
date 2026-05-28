import { audioService } from '../audio/audioEngine'
import { clamp0to100 } from '../gameStateUtils'
import { ROADIE_GRID_HEIGHT } from '../../hooks/minigames/minigameConstants'
import type { RoadieRenderState } from '../../components/stage/RoadiePlayerManager'

export type RoadieCarryingItem = {
  id: string
  type: string
  weight: number
}

export type RoadieTrafficCar = {
  id: string
  textureHash: number
  row: number
  x: number
  speed: number
  width: number
}

export type RoadieSpawner = {
  row: number
  timer: number
  rate: number
  speed: number
}

export type RoadieLogicState = RoadieRenderState & {
  carrying: RoadieCarryingItem | null
  itemsToDeliver: RoadieCarryingItem[]
  itemsDelivered: RoadieCarryingItem[]
  contrabandCount: number
  traffic: RoadieTrafficCar[]
  lastMoveTime: number
  isGameOver: boolean
  spawners: RoadieSpawner[]
}

export function checkCollision(
  car: RoadieTrafficCar,
  playerPos: RoadieLogicState['playerPos']
): boolean {
  if (car.row !== playerPos.y) return false

  const pLeft = playerPos.x + 0.1
  const pRight = playerPos.x + 0.9
  const cLeft = car.x
  const cRight = car.x + car.width

  return pLeft < cRight && pRight > cLeft
}

export function handleCrash(
  game: RoadieLogicState,
  onGameOver: (damage: number) => void
): void {
  audioService.playSFX('crash')

  if (game.carrying) {
    game.equipmentDamage = clamp0to100(game.equipmentDamage + 10)

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

export function handlePickup(game: RoadieLogicState): void {
  if (
    game.playerPos.y === 0 &&
    !game.carrying &&
    game.itemsToDeliver.length > 0
  ) {
    game.carrying = game.itemsToDeliver.shift() ?? null
    audioService.playSFX('pickup')
  }
}

export function handleDelivery(
  game: RoadieLogicState,
  onGameOver: (equipmentDamage: number, contrabandDelivered?: number) => void
): void {
  if (game.playerPos.y === ROADIE_GRID_HEIGHT - 1 && game.carrying) {
    game.itemsDelivered.push(game.carrying)

    if (game.carrying.type === 'CONTRABAND') {
      game.contrabandCount = (game.contrabandCount ?? 0) + 1
    }

    game.carrying = null
    audioService.playSFX('deliver')

    if (game.itemsToDeliver.length === 0) {
      game.isGameOver = true
      onGameOver(game.equipmentDamage, game.contrabandCount ?? 0)
    }
  }
}
