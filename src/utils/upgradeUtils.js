/**
 * Checks whether a specific van upgrade is owned.
 * Pure function extracted from useGameState to allow direct testing
 * and avoid recreating the closure on every render.
 *
 * @param {string[]} upgrades - The player's current van upgrades array.
 * @param {string} upgradeId - The ID of the upgrade to check.
 * @returns {boolean} True if the upgrade is owned.
 */
export const hasUpgrade = (upgrades, upgradeId) =>
  Array.isArray(upgrades) && upgrades.includes(upgradeId)
