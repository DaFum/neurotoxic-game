/**
 * Checks whether a specific upgrade is owned.
 * Pure function extracted from context state helpers to allow direct testing
 * and avoid recreating the closure on every render.
 *
 * @param upgrades - The player's current upgrades array.
 * @param upgradeId - The ID of the upgrade to check.
 * @returns True if the upgrade is owned.
 */
const upgradeCache = new WeakMap<string[], Set<string>>()

const getUpgradeSet = (upgrades: string[]): Set<string> => {
  let upgradeSet = upgradeCache.get(upgrades)
  if (upgradeSet === undefined) {
    upgradeSet = new Set(upgrades)
    upgradeCache.set(upgrades, upgradeSet)
  }
  return upgradeSet
}

export const hasUpgrade = (
  upgrades: string[] | null | undefined,
  upgradeId: string
): boolean => Array.isArray(upgrades) && getUpgradeSet(upgrades).has(upgradeId)

const BREAKDOWN_REDUCTIONS = {
  van_suspension: 0.01,
  hq_van_suspension: 0.01,
  hq_van_tyre_spare: 0.05
} as const satisfies Record<string, number>

/**
 * Calculates the base breakdown chance after applying all upgrade reductions.
 * Centralises the subtraction logic shared by daily simulation and van repair.
 *
 * @param upgrades - The van's current upgrades array.
 * @returns Base breakdown chance (before condition multiplier), clamped at least 0.
 */
export const calcBaseBreakdownChance = (
  upgrades: string[] | null | undefined
): number => {
  let base = 0.05
  if (!Array.isArray(upgrades)) return base

  const uniqueUpgrades = getUpgradeSet(upgrades)

  for (const upgradeId of uniqueUpgrades) {
    if (Object.hasOwn(BREAKDOWN_REDUCTIONS, upgradeId)) {
      base -=
        BREAKDOWN_REDUCTIONS[upgradeId as keyof typeof BREAKDOWN_REDUCTIONS]
    }
  }

  return Math.max(0, base)
}
