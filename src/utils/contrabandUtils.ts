import {
  CONTRABAND_RARITY_WEIGHTS,
  CONTRABAND_BY_RARITY
} from '../data/contraband'
import { secureRandom } from './crypto'

export const DROP_BASE_CHANCE = 0.15
export const LUCK_MOD_PER_POINT = 0.005
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
}

/**
 * Finds the highest-risk contraband item in band.stash.
 * Returns the item ID and rarity with the greatest bust potential.
 * @param {Object|null} stash - band.stash dictionary (keyed by item id)
 * @returns {{ bustChance: number, highestRiskItemId: string|null, highestRarity: string|null }}
 */
export function computeStashBustRisk(stash: unknown) {
  if (!stash || typeof stash !== 'object') {
    return { bustChance: 0, highestRiskItemId: null, highestRarity: null }
  }
  const stashRecord = stash as Record<string, unknown>

  let highestChance = 0
  let highestRiskItemId = null
  let highestRarity = null

  const keys = Object.keys(stash)
  for (let i = 0; i < keys.length; i++) {
    const itemId = keys[i]
    if (!itemId) continue
    const item = stashRecord[itemId]
    if (!item || typeof item !== 'object') continue
    const rarity =
      typeof (item as Record<string, unknown>).rarity === 'string'
        ? (item as Record<string, unknown>).rarity
        : null
    if (!rarity) continue
    const chance =
      BUST_CHANCE_BY_RARITY[rarity as keyof typeof BUST_CHANCE_BY_RARITY] ?? 0
    if (chance > highestChance) {
      highestChance = chance
      highestRiskItemId = itemId
      highestRarity = rarity
    }
  }

  return { bustChance: highestChance, highestRiskItemId, highestRarity }
}

/**
 * Picks a random rarity based on weights.
 * @param {Function} [rng=secureRandom]
 * @returns {string} rarity tier
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
 * @param {string} rarity
 * @param {Function} [rng=secureRandom]
 * @returns {string|null} ID of picked contraband or null if none found
 */
export function pickRandomContrabandByRarity(
  rarity: string,
  rng = secureRandom
) {
  const pool =
    CONTRABAND_BY_RARITY[rarity as keyof typeof CONTRABAND_BY_RARITY] || []
  if (pool.length === 0) return null
  return pool[Math.floor(rng() * pool.length)]?.id ?? null
}

/**
 * Picks a random contraband ID using the weighted rarity system.
 * @param {Function} [rng=secureRandom]
 * @returns {string|null}
 */
export function pickRandomContraband(rng = secureRandom) {
  const rarity = pickRarity(rng)
  return pickRandomContrabandByRarity(rarity, rng)
}

/**
 * Computes the overall chance of dropping contraband based on band luck.
 * @param {number} [base=DROP_BASE_CHANCE]
 * @param {number} [luck=0]
 * @returns {number} probability [0, MAX_DROP_CHANCE]
 */
export function computeDropChance(base = DROP_BASE_CHANCE, luck = 0) {
  const chance = base + (luck || 0) * LUCK_MOD_PER_POINT
  return Math.min(MAX_DROP_CHANCE, Math.max(0, chance))
}
