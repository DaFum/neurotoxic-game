import { hasUpgrade } from '../../utils/upgradeUtils'
import { clamp0to100 } from '../../utils/gameState'
import {
  TOURBUS_BUS_Y_PERCENT,
  TOURBUS_BUS_HEIGHT_PERCENT
} from './minigameConstants'
import type { TourbusObstacle, TourbusObstacleType } from '../../types/tourbus'

/** Damage from a standard obstacle hit with no mitigation upgrades. */
const HIT_DAMAGE_BASE = 10
/** Damage from a standard obstacle hit when van armor is installed. */
const HIT_DAMAGE_ARMOR = 2
/** Damage from a standard obstacle hit when only the bullbar upgrade applies. */
const HIT_DAMAGE_BULLBAR = 5

/**
 * Calculates damage taken from a hit, applying mitigation from upgrades.
 * Prioritizes Armor over Bullbar.
 *
 * @param upgrades - Van upgrade ids currently installed.
 * @returns Damage applied for one obstacle hit.
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

/** Obstacles at or below this y have left the screen and are dropped. */
const OBSTACLE_DESPAWN_Y = 120

/** Tourbus state that one obstacle movement step reads and updates. */
export interface TourbusObstacleStepState {
  busLane: number
  obstacles: TourbusObstacle[]
  damage: number
  itemsCollected: TourbusObstacleType[]
}

/**
 * Moves every obstacle down by `travel` and resolves bus collisions.
 *
 * @remarks
 * The hit test uses the swept interval from the previous to the new y, so a
 * long frame cannot step an obstacle over the bus hit region. Splitting the
 * same travel into smaller steps gives the same outcome. Each obstacle
 * collides at most once (`collided`), and off-screen obstacles are removed.
 *
 * @param game - Mutable tourbus state; obstacles, damage and pickups are updated in place.
 * @param travel - Distance in screen percent every obstacle moves this step.
 * @param upgrades - Van upgrade ids currently installed.
 * @returns Types of the obstacles that collided this step, in obstacle order.
 */
export const stepTourbusObstacles = (
  game: TourbusObstacleStepState,
  travel: number,
  upgrades: string[]
): TourbusObstacleType[] => {
  const hitTop = TOURBUS_BUS_Y_PERCENT
  const hitBottom = TOURBUS_BUS_Y_PERCENT + TOURBUS_BUS_HEIGHT_PERCENT
  const collisions: TourbusObstacleType[] = []
  const survivingObstacles: TourbusObstacle[] = []

  for (const obs of game.obstacles) {
    const prevY = obs.y
    obs.y = prevY + travel

    if (
      !obs.collided &&
      obs.lane === game.busLane &&
      obs.y > hitTop &&
      prevY < hitBottom
    ) {
      obs.collided = true
      if (obs.type === 'OBSTACLE') {
        game.damage = clamp0to100(game.damage + getHitDamage(upgrades))
      } else {
        game.itemsCollected.push(obs.type)
      }
      collisions.push(obs.type)
    }

    if (obs.y < OBSTACLE_DESPAWN_Y) {
      survivingObstacles.push(obs)
    }
  }
  game.obstacles = survivingObstacles
  return collisions
}
