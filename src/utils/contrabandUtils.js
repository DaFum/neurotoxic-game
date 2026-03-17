// TODO: Review this file
import {
  CONTRABAND_RARITY_WEIGHTS,
  CONTRABAND_BY_RARITY
} from '../data/contraband.js'

export const DROP_BASE_CHANCE = 0.15
export const LUCK_MOD_PER_POINT = 0.005
export const MAX_DROP_CHANCE = 0.5

/**
 * Picks a random rarity based on weights.
 * @param {Function} [rng=Math.random]
 * @returns {string} rarity tier
 */
export function pickRarity(rng = Math.random) {
  const weights = CONTRABAND_RARITY_WEIGHTS
  let total = 0
  for (const rarity in weights) {
    if (Object.hasOwn(weights, rarity)) {
      total += weights[rarity]
    }
  }

  let r = rng() * total
  for (const rarity in weights) {
    if (Object.hasOwn(weights, rarity)) {
      const w = weights[rarity]
      if (r < w) return rarity
      r -= w
    }
  }
  return 'common'
}

/**
 * Picks a random contraband ID from a specific rarity pool.
 * @param {string} rarity
 * @param {Function} [rng=Math.random]
 * @returns {string|null} ID of picked contraband or null if none found
 */
export function pickRandomContrabandByRarity(rarity, rng = Math.random) {
  const pool = CONTRABAND_BY_RARITY[rarity] || []
  if (pool.length === 0) return null
  return pool[Math.floor(rng() * pool.length)].id
}

/**
 * Picks a random contraband ID using the weighted rarity system.
 * @param {Function} [rng=Math.random]
 * @returns {string|null}
 */
export function pickRandomContraband(rng = Math.random) {
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
