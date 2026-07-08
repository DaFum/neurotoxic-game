import {
  CONTRABAND_RARITY_WEIGHTS,
  CONTRABAND_BY_RARITY
} from '../data/contraband'
import { secureRandom } from './crypto'
import { selectRandomItem } from './selectionUtils'
import { finiteNumberOr } from './gameState'
import type { Rarity } from '../types'

/**
 * Base probability for a contraband drop. Drops are currently rolled only on
 * completion of the tourbus travel minigame (see `minigameReducer`), not on
 * every travel arrival.
 */
export const DROP_BASE_CHANCE = 0.15
/** Drop-chance bonus applied per point of band luck. */
export const LUCK_MOD_PER_POINT = 0.005
/** Maximum allowed contraband drop chance. */
export const MAX_DROP_CHANCE = 0.5

/**
 * Per-rarity bust chance when stopped by police during travel.
 * Common items are harmless; epic items are high-risk.
 */
export const BUST_CHANCE_BY_RARITY = {
  common: 0,
  uncommon: 0.05,
  rare: 0.15,
  epic: 0.3
} as const satisfies Record<Rarity, number>

/**
 * Finds the highest-risk contraband item in band.stash.
 * Returns the item ID and rarity with the greatest bust potential.
 * @param stash - band.stash dictionary (keyed by item id)
 * @returns Bust chance, highest-risk item id, and highest rarity.
 */
export function computeStashBustRisk(stash: unknown) {
  if (!stash || typeof stash !== 'object') {
    return { bustChance: 0, highestRiskItemId: null, highestRarity: null }
  }
  const stashRecord = stash as Record<string, unknown>

  let highestChance = 0
  let highestRiskItemId = null
  let highestRarity = null

  const keys = Object.keys(stashRecord)
  for (let i = 0; i < keys.length; i++) {
    const itemId = keys[i]
    if (!itemId) continue
    const item = stashRecord[itemId]
    if (!item || typeof item !== 'object') continue
    const itemRecord = item as Record<string, unknown>
    const rarityValue =
      typeof itemRecord.rarity === 'string' ? itemRecord.rarity : null
    if (!rarityValue || !Object.hasOwn(BUST_CHANCE_BY_RARITY, rarityValue))
      continue

    const chance =
      BUST_CHANCE_BY_RARITY[rarityValue as keyof typeof BUST_CHANCE_BY_RARITY]
    if (chance > highestChance) {
      highestChance = chance
      highestRiskItemId = itemId
      highestRarity = rarityValue
    }
  }

  return { bustChance: highestChance, highestRiskItemId, highestRarity }
}

/**
 * Picks a random rarity based on weights.
 * @param rng - Random source used for the weighted roll.
 * @defaultValue `secureRandom`
 * @returns Selected rarity tier.
 */
export function pickRarity(rng = secureRandom) {
  const weights = CONTRABAND_RARITY_WEIGHTS
  let total = 0
  for (const rarity in weights) {
    if (Object.hasOwn(weights, rarity)) {
      total += weights[rarity as keyof typeof weights]
    }
  }

  let r = rng() * total
  for (const rarity in weights) {
    if (Object.hasOwn(weights, rarity)) {
      const w = weights[rarity as keyof typeof weights]
      if (r < w) return rarity
      r -= w
    }
  }
  return 'common'
}

/**
 * Picks a random contraband ID from a specific rarity pool.
 * @param rarity - Rarity pool to sample.
 * @param rng - Random source used to select within the pool.
 * @defaultValue `secureRandom`
 * @returns Picked contraband id, or null when the pool is empty.
 */
export function pickRandomContrabandByRarity(
  rarity: string,
  rng = secureRandom
) {
  const pool =
    CONTRABAND_BY_RARITY[rarity as keyof typeof CONTRABAND_BY_RARITY] || []
  if (pool.length === 0) return null
  return selectRandomItem(pool, rng)?.id ?? null
}

/**
 * Picks a random contraband ID using the weighted rarity system.
 * @param rng - Random source shared across rarity and item selection.
 * @defaultValue `secureRandom`
 * @returns Picked contraband id, or null when no rarity pool is available.
 */
export function pickRandomContraband(rng = secureRandom) {
  const rarity = pickRarity(rng)
  return pickRandomContrabandByRarity(rarity, rng)
}

/**
 * Computes the overall chance of dropping contraband based on band luck.
 * @param base - Base drop probability before luck scaling.
 * @defaultValue `DROP_BASE_CHANCE`
 * @param luck - Band luck contribution.
 * @defaultValue `0`
 * @returns Probability clamped to `[0, MAX_DROP_CHANCE]`.
 */
export function computeDropChance(base = DROP_BASE_CHANCE, luck = 0) {
  const chance = base + finiteNumberOr(luck, 0) * LUCK_MOD_PER_POINT
  return Math.min(MAX_DROP_CHANCE, Math.max(0, chance))
}
