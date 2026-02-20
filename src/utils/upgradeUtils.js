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

/**
 * Calculates the base breakdown chance after applying all upgrade reductions.
 * Centralises the subtraction logic shared by daily simulation and van repair.
 *
 * @param {string[]} upgrades - The van's current upgrades array.
 * @returns {number} Base breakdown chance (before condition multiplier), clamped >= 0.
 */
export const calcBaseBreakdownChance = upgrades => {
  let base = 0.05
  if (hasUpgrade(upgrades, 'van_suspension')) base -= 0.01
  if (hasUpgrade(upgrades, 'hq_van_suspension')) base -= 0.01
  if (hasUpgrade(upgrades, 'hq_van_tyre_spare')) base -= 0.05
  return Math.max(0, base)
}
