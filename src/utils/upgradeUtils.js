/**
 * Checks whether a specific upgrade is owned.
 * Pure function extracted from useGameState to allow direct testing
 * and avoid recreating the closure on every render.
 *
 * @param {string[]} upgrades - The player's current upgrades array.
 * @param {string} upgradeId - The ID of the upgrade to check.
 * @returns {boolean} True if the upgrade is owned.
 */
export const hasUpgrade = (upgrades, upgradeId) =>
  Array.isArray(upgrades) && upgrades.includes(upgradeId)

const BREAKDOWN_REDUCTIONS = {
  van_suspension: 0.01,
  hq_van_suspension: 0.01,
  hq_van_tyre_spare: 0.05
}

/**
 * Calculates the base breakdown chance after applying all upgrade reductions.
 * Centralises the subtraction logic shared by daily simulation and van repair.
 *
 * @param {string[]} upgrades - The van's current upgrades array.
 * @returns {number} Base breakdown chance (before condition multiplier), clamped >= 0.
 */
export const calcBaseBreakdownChance = upgrades => {
  let base = 0.05
  if (!Array.isArray(upgrades)) return base

  const uniqueUpgrades = new Set(upgrades)

  for (const upgradeId of uniqueUpgrades) {
    if (Object.hasOwn(BREAKDOWN_REDUCTIONS, upgradeId)) {
      base -= BREAKDOWN_REDUCTIONS[upgradeId]
    }
  }

  return Math.max(0, base)
}
