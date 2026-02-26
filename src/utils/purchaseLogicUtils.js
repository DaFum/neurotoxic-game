import { bandHasTrait } from './traitLogic.js'
import { clampPlayerMoney, clampBandHarmony } from './gameStateUtils.js'

/**
 * Selects the primary effect payload from catalog entries during migration.
 * @param {object} item - Purchase catalog item.
 * @returns {object|undefined} Primary effect object, if available.
 */
export const getPrimaryEffect = item => {
  if (!item) return undefined
  return item.effects?.[0] ?? item.effect
}

/**
 * Calculates the adjusted cost of an item based on active traits.
 * @param {Object} item - Item to check
 * @param {Object} band - Band state
 * @returns {number} Adjusted cost
 */
export const getAdjustedCost = (item, band) => {
  let cost = item.cost
  // Gear Nerd Trait: 20% discount on equipment (Money only to avoid fractional fame)
  if (
    item.category === 'GEAR' &&
    item.currency === 'money' &&
    bandHasTrait(band, 'gear_nerd')
  ) {
    cost = Math.floor(cost * 0.8)
  }
  return cost
}

/**
 * Helper to return a van object with the upgrade added if not already present.
 * @param {Object} van - Current van state (could be from player or playerPatch)
 * @param {string} upgradeId - ID of the upgrade to add
 * @returns {Object} Updated van object
 */
export const buildVanWithUpgrade = (van, upgradeId) => {
  const currentUpgrades = van?.upgrades ?? []

  if (!currentUpgrades.includes(upgradeId)) {
    return {
      ...(van ?? {}),
      upgrades: [...currentUpgrades, upgradeId]
    }
  }
  return van ?? {}
}

/**
 * Checks if an item is already owned.
 *
 * Note: 'inventory_add' represents consumables and does not count as owned (multiple purchases allowed),
 * while 'inventory_set' is treated as a boolean-owned flag.
 *
 * This checks:
 * - getPrimaryEffect(item)
 * - effect.type (inventory_set vs others)
 * - inventoryKey (from effect.item)
 * - player.van.upgrades
 * - player.hqUpgrades
 * - band.inventory
 *
 * @param {Object} item - Item to check
 * @param {Object} player - Player state
 * @param {Object} band - Band state
 * @returns {boolean} True if owned
 */
export const isItemOwned = (item, player, band) => {
  const effect = getPrimaryEffect(item)
  if (!effect) return false

  const inventoryKey =
    effect.type === 'inventory_set' || effect.type === 'inventory_add'
      ? effect.item
      : null

  return (
    (player.van?.upgrades ?? []).includes(item.id) ||
    (player.hqUpgrades ?? []).includes(item.id) ||
    (effect.type === 'inventory_set'
      ? band.inventory?.[inventoryKey] === true
      : false)
  )
}

/**
 * Checks if player can afford an item
 * @param {Object} item - Item to check
 * @param {Object} player - Player state
 * @param {number} adjustedCost - Cost after adjustments
 * @returns {boolean} True if affordable
 */
export const canAfford = (item, player, adjustedCost) => {
  const payingWithFame = item.currency === 'fame'
  const currencyValue = payingWithFame
    ? (player.fame ?? 0)
    : (player.money ?? 0)
  return currencyValue >= adjustedCost
}

/**
 * Applies inventory set effect
 * @param {Object} effect - Effect configuration
 * @param {Object} bandInventory - Current band inventory
 * @returns {Object} Band patch to apply
 */
export const applyInventorySet = (effect, bandInventory) => ({
  inventory: { ...(bandInventory ?? {}), [effect.item]: effect.value }
})

/**
 * Applies inventory add effect
 * @param {Object} effect - Effect configuration
 * @param {Object} bandInventory - Current band inventory
 * @returns {Object} Band patch to apply
 */
export const applyInventoryAdd = (effect, bandInventory) => ({
  inventory: {
    ...(bandInventory ?? {}),
    [effect.item]: ((bandInventory ?? {})[effect.item] || 0) + effect.value
  }
})

/**
 * Applies stat modifier effect
 * @param {Object} effect - Effect configuration
 * @param {Object} playerPatch - Current player patch
 * @param {Object} player - Player state
 * @param {Object} band - Band state
 * @returns {Object} Object with updated playerPatch and bandPatch
 */
export const applyStatModifier = (effect, playerPatch, player, band) => {
  const val = effect.value
  let nextPlayerPatch = { ...playerPatch }
  let nextBandPatch = null

  switch (effect.target) {
    case 'van':
      nextPlayerPatch.van = {
        ...(player.van ?? {}),
        [effect.stat]: Math.max(
          0,
          ((player.van ?? {})[effect.stat] || 0) + val
        )
      }
      break

    case 'player': {
      const basePlayerStat =
        nextPlayerPatch[effect.stat] ?? player[effect.stat] ?? 0

      if (effect.stat === 'money') {
        nextPlayerPatch[effect.stat] = clampPlayerMoney(basePlayerStat + val)
      } else {
        nextPlayerPatch[effect.stat] = Math.max(0, basePlayerStat + val)
      }
      break
    }

    case 'band':
      if (effect.stat === 'harmony') {
        nextBandPatch = {
          harmony: clampBandHarmony((band.harmony || 0) + val)
        }
      } else {
        nextBandPatch = {
          [effect.stat]: Math.max(0, (band[effect.stat] || 0) + val)
        }
      }
      break

    default: // performance or undefined (assumed performance)
      nextBandPatch = {
        performance: {
          ...(band.performance ?? {}),
          [effect.stat]: ((band.performance ?? {})[effect.stat] || 0) + val
        }
      }
  }

  return { playerPatch: nextPlayerPatch, bandPatch: nextBandPatch }
}

/**
 * Applies unlock upgrade effect
 * @param {Object} effect - Effect configuration
 * @param {Object} item - Item being purchased
 * @param {Object} playerPatch - Current player patch
 * @param {Object} playerVan - Current player van state
 * @returns {Object} Updated player patch
 */
export const applyUnlockUpgrade = (effect, item, playerPatch, playerVan) => {
  const upgradeId = effect.id ? effect.id : item.id
  const currentUpgrades = playerVan?.upgrades ?? []

  if (currentUpgrades.includes(upgradeId)) {
    return playerPatch
  }

  return {
    ...playerPatch,
    van: {
      ...(playerVan ?? {}),
      upgrades: [
        ...currentUpgrades,
        upgradeId
      ]
    }
  }
}

/**
 * Applies unlock HQ effect
 * @param {Object} item - Item being purchased
 * @param {Object} playerPatch - Current player patch
 * @param {Object} player - Player state
 * @param {Object} band - Band state
 * @returns {Object} Object with updated playerPatch, bandPatch and messages
 */
export const applyUnlockHQ = (item, playerPatch, player, band) => {
  let nextPlayerPatch = {
    ...playerPatch,
    hqUpgrades: [...(player.hqUpgrades ?? []), item.id]
  }
  let nextBandPatch = null
  let messages = []

  // Special item effects
  switch (item.id) {
    case 'hq_room_poster_wall':
      nextPlayerPatch.fame = Math.max(
        0,
        (nextPlayerPatch.fame ?? player.fame ?? 0) + 10
      )
      messages.push({ message: 'Looks cool. Fame +10', type: 'success' })
      break

    case 'hq_room_diy_soundproofing':
      nextBandPatch = {
        harmony: clampBandHarmony((band.harmony ?? 0) + 5)
      }
      messages.push({ message: 'Less noise, more peace. Harmony +5', type: 'success' })
      break

    case 'hq_room_label':
      nextPlayerPatch.money = clampPlayerMoney(
        (nextPlayerPatch.money ?? player.money ?? 0) + 500
      )
      messages.push({ message: 'Signed! +500€ Advance.', type: 'success' })
      break

    case 'hq_room_coffee':
    case 'hq_room_sofa':
    case 'hq_room_old_couch':
    case 'hq_room_cheap_beer_fridge': {
      const members = (band.members ?? []).map(m => {
        switch (item.id) {
          case 'hq_room_coffee':
            return {
              ...m,
              mood: Math.max(0, Math.min(100, (m.mood ?? 0) + 20))
            }
          case 'hq_room_sofa':
            return {
              ...m,
              stamina: Math.max(0, Math.min(100, (m.stamina ?? 0) + 30))
            }
          case 'hq_room_old_couch':
            return {
              ...m,
              stamina: Math.max(0, Math.min(100, (m.stamina ?? 0) + 10))
            }
          default:
            return {
              ...m,
              mood: Math.max(0, Math.min(100, (m.mood ?? 0) + 5))
            }
        }
      })
      nextBandPatch = { ...(nextBandPatch ?? {}), members }
      break
    }
  }

  return { playerPatch: nextPlayerPatch, bandPatch: nextBandPatch, messages }
}

/**
 * Applies passive effect
 * @param {Object} effect - Effect configuration
 * @param {Object} playerPatch - Current player patch
 * @param {Object} player - Player state
 * @returns {Object} Object with updated playerPatch and bandPatch
 */
export const applyPassive = (effect, playerPatch, player) => {
  let nextPlayerPatch = { ...playerPatch }
  let nextBandPatch = null

  if (effect.key === 'harmony_regen_travel') {
    nextBandPatch = { harmonyRegenTravel: true }
  } else if (effect.key === 'passive_followers') {
    const val = Number(effect.value) || 0
    nextPlayerPatch.passiveFollowers =
      (player.passiveFollowers || 0) + Math.max(0, val)
  }

  return { playerPatch: nextPlayerPatch, bandPatch: nextBandPatch }
}
