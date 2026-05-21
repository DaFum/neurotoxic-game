const fs = require('fs');
const file = 'src/utils/upgradeUtils.ts';
let content = fs.readFileSync(file, 'utf8');

const search = `const upgradeCache = new WeakMap<string[], Set<string>>()

export const hasUpgrade = (
  upgrades: string[] | null | undefined,
  upgradeId: string
): boolean => {
  if (!Array.isArray(upgrades)) return false

  let upgradeSet = upgradeCache.get(upgrades)
  if (upgradeSet === undefined) {
    upgradeSet = new Set(upgrades)
    upgradeCache.set(upgrades, upgradeSet)
  }

  return upgradeSet.has(upgradeId)
}`;

const replace = `const upgradeCache = new WeakMap<string[], Set<string>>()

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
): boolean => Array.isArray(upgrades) && getUpgradeSet(upgrades).has(upgradeId)`;

content = content.replace(search, replace);

const search2 = `export const calcBaseBreakdownChance = (
  upgrades: string[] | null | undefined
): number => {
  let base = 0.05
  if (!Array.isArray(upgrades)) return base

  const uniqueUpgrades = new Set(upgrades)

  for (const upgradeId of uniqueUpgrades) {`;

const replace2 = `export const calcBaseBreakdownChance = (
  upgrades: string[] | null | undefined
): number => {
  let base = 0.05
  if (!Array.isArray(upgrades)) return base

  const uniqueUpgrades = getUpgradeSet(upgrades)

  for (const upgradeId of uniqueUpgrades) {`;

content = content.replace(search2, replace2);

fs.writeFileSync(file, content);
