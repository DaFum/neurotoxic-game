// TODO: Review this file
import { HQ_ITEMS } from '../data/hqItems'
import { bandHasTrait } from './traitLogic'
import {
  clampPlayerMoney,
  clampBandHarmony,
  clampMemberStamina,
  clampMemberMood,
  clampPlayerFame,
  calculateFameLevel
} from './gameStateUtils'

/**
 * Selects the primary effect payload from catalog entries during migration.
 * @param {object} item - Purchase catalog item.
 * @returns {object|undefined} Primary effect object, if available.
 */
export const getPrimaryEffect = item => {
  if (!item) return undefined
  return item.effects?.[0] ?? item.effect
}

// Pre-compute gear lookup for O(1) checks during purchases
export const GEAR_LOOKUP = new Map()
const allGearItems = [...(HQ_ITEMS.gear || []), ...(HQ_ITEMS.instruments || [])]

allGearItems.forEach(item => {
  if (item.category === 'GEAR' || item.category === 'INSTRUMENT') {
    GEAR_LOOKUP.set(item.id, item)
    const e = getPrimaryEffect(item)
    if (e?.item) {
      GEAR_LOOKUP.set(e.item, item)
    }
  }
})

/**
 * Helper to calculate the current gear count in band inventory
 * @param {Object} inventory - Band inventory
 * @param {Map} lookup - Gear lookup map
 * @returns {number} Gear count
 */
export const getGearCount = (inventory, lookup) => {
  let count = 0
  const inv = inventory || {}
  for (const key in inv) {
    if (Object.hasOwn(inv, key)) {
      const value = inv[key]
      const isOwned = value === true || (typeof value === 'number' && value > 0)
      if (isOwned && lookup.has(key)) {
        count++
      }
    }
  }
  return count
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
        [effect.stat]: Math.max(0, ((player.van ?? {})[effect.stat] || 0) + val)
      }
      break

    case 'player': {
      const basePlayerStat =
        nextPlayerPatch[effect.stat] ?? player[effect.stat] ?? 0

      if (effect.stat === 'money') {
        nextPlayerPatch[effect.stat] = clampPlayerMoney(basePlayerStat + val)
      } else if (effect.stat === 'fame') {
        const clampedFame = clampPlayerFame(basePlayerStat + val)
        nextPlayerPatch.fame = clampedFame
        nextPlayerPatch.fameLevel = calculateFameLevel(clampedFame)
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
 * Validates whether the item can be purchased.
 * @param {Object} item - Item to purchase
 * @param {Object} player - Player state
 * @param {Object} band - Band state
 * @returns {Object} { isValid: boolean, errorType?: string, finalCost?: number, isConsumable?: boolean, payingWithFame?: boolean, startingCurrency?: number, effect?: Object }
 */
export const validatePurchase = (item, player, band) => {
  const effect = getPrimaryEffect(item)
  if (!effect) {
    return { isValid: false, errorType: 'missing_effect' }
  }

  const payingWithFame = item.currency === 'fame'
  const startingMoney = player.money ?? 0
  const startingFame = player.fame ?? 0
  const currencyValue = payingWithFame ? startingFame : startingMoney
  const finalCost = getAdjustedCost(item, band)

  const isConsumable = effect.type === 'inventory_add'
  const isOwned = isItemOwned(item, player, band)

  if (isOwned && !isConsumable) {
    return { isValid: false, errorType: 'already_owned' }
  }

  if (currencyValue < finalCost) {
    return { isValid: false, errorType: 'insufficient_funds' }
  }

  return {
    isValid: true,
    finalCost,
    isConsumable,
    payingWithFame,
    startingCurrency: currencyValue,
    effect
  }
}

/**
 * Registry of effect handlers to process different purchase effect types
 */
export const EFFECT_HANDLERS = {
  inventory_set: (effect, _item, _playerPatch, _player, band) => {
    return { bandPatch: applyInventorySet(effect, band.inventory) }
  },

  inventory_add: (effect, _item, _playerPatch, _player, band) => {
    return { bandPatch: applyInventoryAdd(effect, band.inventory) }
  },

  stat_modifier: (effect, item, playerPatch, player, band) => {
    const result = applyStatModifier(effect, playerPatch, player, band)
    let nextPlayerPatch = result.playerPatch

    if (item.oneTime !== false) {
      const vanState = nextPlayerPatch.van ?? player.van
      nextPlayerPatch.van = buildVanWithUpgrade(vanState, item.id)
    }
    return { playerPatch: nextPlayerPatch, bandPatch: result.bandPatch }
  },

  unlock_upgrade: (effect, item, playerPatch, player, _band) => {
    const vanState = playerPatch.van ?? player.van
    const nextPlayerPatch = applyUnlockUpgrade(
      effect,
      item,
      playerPatch,
      vanState
    )
    return { playerPatch: nextPlayerPatch }
  },

  unlock_hq: (_effect, item, playerPatch, player, band) => {
    return applyUnlockHQ(item, playerPatch, player, band)
  },

  passive: (effect, item, playerPatch, player, _band) => {
    const result = applyPassive(effect, playerPatch, player)
    let nextPlayerPatch = result.playerPatch

    // Mark passive items as owned via van upgrades to ensure isItemOwned returns true
    const vanState = nextPlayerPatch.van ?? player.van
    nextPlayerPatch.van = buildVanWithUpgrade(vanState, item.id)

    return { playerPatch: nextPlayerPatch, bandPatch: result.bandPatch }
  }
}

/**
 * Processes a purchase effect using the corresponding handler.
 * @param {Object} effect - Primary effect of the item
 * @param {Object} item - Item being purchased
 * @param {Object} initialPlayerPatch - Player patch after cost deduction
 * @param {Object} player - Player state
 * @param {Object} band - Band state
 * @returns {Object} { playerPatch, bandPatch, messages, errorType }
 */
export const processPurchaseEffect = (
  effect,
  item,
  initialPlayerPatch,
  player,
  band
) => {
  const handler = EFFECT_HANDLERS[effect.type]

  if (!handler) {
    return { errorType: 'unknown_effect', effectType: effect.type }
  }

  return handler(effect, item, initialPlayerPatch, player, band)
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
      upgrades: [...currentUpgrades, upgradeId]
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
    case 'hq_room_poster_wall': {
      const clampedFame = clampPlayerFame(
        (nextPlayerPatch.fame ?? player.fame ?? 0) + 10
      )
      nextPlayerPatch.fame = clampedFame
      nextPlayerPatch.fameLevel = calculateFameLevel(clampedFame)
      messages.push({
        messageKey: 'ui:shop.messages.posterWall',
        fallback: 'Looks cool. Fame +10',
        type: 'success'
      })
      break
    }

    case 'hq_room_diy_soundproofing':
      nextBandPatch = {
        harmony: clampBandHarmony((band.harmony ?? 0) + 5)
      }
      messages.push({
        messageKey: 'ui:shop.messages.soundproofing',
        fallback: 'Less noise, more peace. Harmony +5',
        type: 'success'
      })
      break

    case 'hq_room_label':
      nextPlayerPatch.money = clampPlayerMoney(
        (nextPlayerPatch.money ?? player.money ?? 0) + 500
      )
      messages.push({
        messageKey: 'ui:shop.messages.labelSigned',
        fallback: 'Signed! +500€ Advance.',
        type: 'success'
      })
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
              mood: clampMemberMood((m.mood ?? 0) + 20)
            }
          case 'hq_room_sofa':
            return {
              ...m,
              stamina: clampMemberStamina((m.stamina ?? 0) + 30, m.staminaMax)
            }
          case 'hq_room_old_couch':
            return {
              ...m,
              stamina: clampMemberStamina((m.stamina ?? 0) + 10, m.staminaMax)
            }
          default:
            return {
              ...m,
              mood: clampMemberMood((m.mood ?? 0) + 5)
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
