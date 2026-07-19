import { hasUpgrade } from '../../utils/upgradeUtils'

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
