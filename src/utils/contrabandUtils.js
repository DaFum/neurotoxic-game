import { CONTRABAND_RARITY_WEIGHTS, CONTRABAND_BY_RARITY } from '../data/contraband.js'

export const DROP_BASE_CHANCE = 0.15
export const LUCK_MOD_PER_POINT = 0.005
export const MAX_DROP_CHANCE = 0.5

/**
 * Wählt eine Seltenheitsstufe zufällig entsprechend den definierten Gewichtungen aus.
 * @param {Function} [rng=Math.random] - Zufallsfunktion, die eine Zahl im Bereich [0, 1) zurückgibt.
 * @returns {string} Die gewählte Seltenheitsstufe (z. B. "common", "rare").
 */
export function pickRarity(rng = Math.random) {
  const weights = CONTRABAND_RARITY_WEIGHTS
  const total = Object.values(weights).reduce((s, w) => s + w, 0)
  let r = rng() * total
  for (const [rarity, w] of Object.entries(weights)) {
    if (r < w) return rarity
    r -= w
  }
  return 'common'
}

/**
 * Wählt eine zufällige Contraband-ID aus dem Pool der angegebenen Seltenheit.
 * @param {string} rarity - Name der Seltenheitsstufe, aus der gewählt werden soll.
 * @param {Function} [rng=Math.random] - Optionale Zufallsfunktion (liefert Werte in [0,1)) für deterministisches Testen.
 * @returns {string|null} Die gewählte Contraband-ID, oder `null` wenn kein Eintrag im Pool vorhanden ist.
 */
export function pickRandomContrabandByRarity(rarity, rng = Math.random) {
  const pool = CONTRABAND_BY_RARITY[rarity] || []
  if (pool.length === 0) return null
  return pool[Math.floor(rng() * pool.length)].id
}

/**
 * Wählt eine Contraband-ID basierend auf der gewichteten Seltenheit aus.
 * @param {Function} [rng=Math.random] - Optionale Zufallsfunktion, die eine Zahl in [0, 1) zurückgibt.
 * @returns {string|null} Die ausgewählte Contraband-ID oder `null`, wenn kein Element verfügbar ist.
 */
export function pickRandomContraband(rng = Math.random) {
  const rarity = pickRarity(rng)
  return pickRandomContrabandByRarity(rarity, rng)
}

/**
 * Berechnet die Wahrscheinlichkeit, dass Kontraband droppt.
 * @param {number} [base=DROP_BASE_CHANCE] - Basiswahrscheinlichkeit vor Glückmodifikator.
 * @param {number} [luck=0] - Glückpunkte der Bande, beeinflussen die Wahrscheinlichkeit linear.
 * @returns {number} Die finale Drop-Wahrscheinlichkeit, auf den Bereich 0 bis MAX_DROP_CHANCE beschränkt.
 */
export function computeDropChance(base = DROP_BASE_CHANCE, luck = 0) {
  const chance = base + (luck || 0) * LUCK_MOD_PER_POINT
  return Math.min(MAX_DROP_CHANCE, Math.max(0, chance))
}
