/**
 * Purchase Logic Hook
 * Encapsulates all purchase-related logic for the BandHQ shop.
 * @module usePurchaseLogic
 */

import { useCallback } from 'react'
import { handleError, StateError } from '../utils/errorHandler.js'
import { bandHasTrait } from '../utils/traitLogic.js'
import { checkTraitUnlocks } from '../utils/unlockCheck.js'
import { CHARACTERS } from '../data/characters.js'

/**
 * Selects the primary effect payload from catalog entries during migration.
 *
 * @param {object} item - Purchase catalog item.
 * @returns {object|undefined} Primary effect object, if available.
 */
export const getPrimaryEffect = item => {
  if (!item) return undefined
  return item.effects?.[0] ?? item.effect
}

/**
 * Custom hook for managing shop purchase logic
 * @param {Object} params - Hook parameters
 * @param {Object} params.player - Player state
 * @param {Object} params.band - Band state
 * @param {Function} params.updatePlayer - Player update function
 * @param {Function} params.updateBand - Band update function
 * @param {Function} params.addToast - Toast notification function
 * @returns {Object} Purchase handlers and utilities
 */
export const usePurchaseLogic = ({
  player,
  band,
  updatePlayer,
  updateBand,
  addToast
}) => {
  /**
   * Calculates the adjusted cost of an item based on active traits.
   * @param {Object} item - Item to check
   * @returns {number} Adjusted cost
   */
  const getAdjustedCost = useCallback(
    item => {
      let cost = item.cost
      // Gear Nerd Trait: 20% discount on equipment
      if (item.category === 'GEAR' && bandHasTrait(band, 'gear_nerd')) {
        cost = Math.floor(cost * 0.8)
      }
      return cost
    },
    [band]
  )

  /**
   * Checks if an item is already owned
   * @param {Object} item - Item to check
   * @returns {boolean} True if owned
   */
  const isItemOwned = useCallback(
    item => {
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
    },
    [player.van?.upgrades, player.hqUpgrades, band.inventory]
  )

  /**
   * Checks if player can afford an item
   * @param {Object} item - Item to check
   * @returns {boolean} True if affordable
   */
  const canAfford = useCallback(
    item => {
      const payingWithFame = item.currency === 'fame'
      const currencyValue = payingWithFame
        ? (player.fame ?? 0)
        : (player.money ?? 0)
      return currencyValue >= getAdjustedCost(item)
    },
    [player.money, player.fame, getAdjustedCost]
  )

  /**
   * Applies inventory set effect
   * @param {Object} effect - Effect configuration
   * @returns {Object|null} Band patch to apply
   */
  const applyInventorySet = useCallback(
    effect => ({
      inventory: { ...(band.inventory ?? {}), [effect.item]: effect.value }
    }),
    [band.inventory]
  )

  /**
   * Applies inventory add effect
   * @param {Object} effect - Effect configuration
   * @returns {Object|null} Band patch to apply
   */
  const applyInventoryAdd = useCallback(
    effect => ({
      inventory: {
        ...(band.inventory ?? {}),
        [effect.item]: ((band.inventory ?? {})[effect.item] || 0) + effect.value
      }
    }),
    [band.inventory]
  )

  /**
   * Applies stat modifier effect
   * @param {Object} effect - Effect configuration
   * @param {Object} playerPatch - Current player patch
   * @returns {Object} Object with updated playerPatch and bandPatch
   */
  const applyStatModifier = useCallback(
    (effect, playerPatch) => {
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
          nextPlayerPatch[effect.stat] = Math.max(0, basePlayerStat + val)
          break
        }

        case 'band':
          nextBandPatch = {
            [effect.stat]: Math.max(0, (band[effect.stat] || 0) + val)
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
    },
    [player, band]
  )

  /**
   * Applies unlock upgrade effect
   * @param {Object} effect - Effect configuration
   * @param {Object} item - Item being purchased
   * @param {Object} playerPatch - Current player patch
   * @returns {Object} Updated player patch
   */
  const applyUnlockUpgrade = useCallback(
    (effect, item, playerPatch) => ({
      ...playerPatch,
      van: {
        ...(player.van ?? {}),
        upgrades: [
          ...(player.van?.upgrades ?? []),
          effect.id ? effect.id : item.id
        ]
      }
    }),
    [player.van]
  )

  /**
   * Applies passive effect
   * @param {Object} effect - Effect configuration
   * @param {Object} playerPatch - Current player patch
   * @returns {Object} Object with updated playerPatch and bandPatch
   */
  const applyPassive = useCallback(
    (effect, playerPatch) => {
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
    },
    [player.passiveFollowers]
  )

  /**
   * Applies unlock HQ effect
   * @param {Object} item - Item being purchased
   * @param {Object} playerPatch - Current player patch
   * @returns {Object} Object with updated playerPatch and bandPatch
   */
  const applyUnlockHQ = useCallback(
    (item, playerPatch) => {
      let nextPlayerPatch = {
        ...playerPatch,
        hqUpgrades: [...(player.hqUpgrades ?? []), item.id]
      }
      let nextBandPatch = null

      // Special item effects
      switch (item.id) {
        case 'hq_room_poster_wall':
          nextPlayerPatch.fame = Math.max(
            0,
            (nextPlayerPatch.fame ?? player.fame ?? 0) + 10
          )
          addToast('Looks cool. Fame +10', 'success')
          break

        case 'hq_room_diy_soundproofing':
          nextBandPatch = {
            harmony: Math.max(0, Math.min(100, (band.harmony ?? 0) + 5))
          }
          addToast('Less noise, more peace. Harmony +5', 'success')
          break

        case 'hq_room_label':
          nextPlayerPatch.money =
            (nextPlayerPatch.money ?? player.money ?? 0) + 500
          addToast('Signed! +500€ Advance.', 'success')
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

      return { playerPatch: nextPlayerPatch, bandPatch: nextBandPatch }
    },
    [player.hqUpgrades, player.fame, band.harmony, band.members, addToast]
  )

  /**
   * Handles the purchase of an item
   * @param {Object} item - Item to purchase
   * @returns {boolean} True if purchase was successful
   */
  const handleBuy = useCallback(
    item => {
      try {
        const effect = getPrimaryEffect(item)
        if (!effect) {
          handleError(
            new StateError('Purchase item is missing a primary effect', {
              itemId: item?.id,
              itemName: item?.name
            }),
            {
              addToast,
              fallbackMessage: 'Purchase failed: Invalid upgrade data.'
            }
          )
          return false
        }

        const payingWithFame = item.currency === 'fame'

        const startingMoney = player.money ?? 0
        const startingFame = player.fame ?? 0
        const currencyValue = payingWithFame ? startingFame : startingMoney
        const finalCost = getAdjustedCost(item)

        const isConsumable = effect.type === 'inventory_add'
        const isOwned = isItemOwned(item)

        if (isOwned && !isConsumable) {
          addToast('Already owned!', 'warning')
          return false
        }

        if (currencyValue < finalCost) {
          addToast(`Not enough ${payingWithFame ? 'Fame' : 'Money'}!`, 'error')
          return false
        }

        // Build patches
        let playerPatch = payingWithFame
          ? { fame: Math.max(0, startingFame - finalCost) }
          : { money: Math.max(0, startingMoney - finalCost) }

        let bandPatch = null

        // Apply effect based on type
        switch (effect.type) {
          case 'inventory_set':
            bandPatch = applyInventorySet(effect)
            break

          case 'inventory_add':
            bandPatch = applyInventoryAdd(effect)
            break

          case 'stat_modifier': {
            const result = applyStatModifier(effect, playerPatch)
            playerPatch = result.playerPatch
            bandPatch = result.bandPatch

            if (item.oneTime !== false) {
              const currentUpgrades =
                playerPatch.van?.upgrades ?? player.van?.upgrades ?? []

              if (!currentUpgrades.includes(item.id)) {
                playerPatch.van = {
                  ...(playerPatch.van ?? player.van ?? {}),
                  upgrades: [...currentUpgrades, item.id]
                }
              }
            }
            break
          }

          case 'unlock_upgrade':
            playerPatch = applyUnlockUpgrade(effect, item, playerPatch)
            break

          case 'unlock_hq': {
            const result = applyUnlockHQ(item, playerPatch)
            playerPatch = result.playerPatch
            bandPatch = result.bandPatch
            break
          }

          case 'passive': {
            const result = applyPassive(effect, playerPatch)
            playerPatch = result.playerPatch
            bandPatch = result.bandPatch
            // Mark passive items as owned via van upgrades to ensure isItemOwned returns true
            const currentUpgrades =
              playerPatch.van?.upgrades ?? player.van?.upgrades ?? []

            if (!currentUpgrades.includes(item.id)) {
              playerPatch.van = {
                ...(playerPatch.van ?? player.van ?? {}),
                upgrades: [...currentUpgrades, item.id]
              }
            }
            break
          }

          default:
            handleError(
              new StateError(`Unknown effect type: ${effect.type}`, {
                effectType: effect.type,
                itemId: item.id,
                currency: item.currency
              }),
              {
                addToast,
                fallbackMessage: 'Purchase failed: Unknown effect type.'
              }
            )
            return false
        }

        // Ensure fame-based upgrades are tracked in van.upgrades for ownership detection
        if (
          item.currency === 'fame' &&
          !isConsumable &&
          effect.type !== 'unlock_upgrade'
        ) {
          const currentUpgrades =
            playerPatch.van?.upgrades ?? player.van?.upgrades ?? []
          if (!currentUpgrades.includes(item.id)) {
            playerPatch.van = {
              ...(playerPatch.van ?? player.van ?? {}),
              upgrades: [...currentUpgrades, item.id]
            }
          }
        }

        // Apply updates
        updatePlayer(playerPatch)
        if (bandPatch) updateBand(bandPatch)

        // Check Purchase Unlocks
        // We need to construct the next state optimistically to check unlocks
        const nextPlayer = { ...player, ...playerPatch, van: { ...player.van, ...playerPatch.van } }
        const nextBand = {
          ...band,
          ...(bandPatch || {}),
          inventory: { ...band.inventory, ...(bandPatch?.inventory || {}) }
        }

        // Count gear for gear_nerd check
        // Assuming current inventory plus purchased item if it's gear
        const currentGearCount = Object.values(nextBand.inventory || {}).filter(val => val === true || (typeof val === 'number' && val > 0)).length
        // Refined logic in checkTraitUnlocks will handle heuristics, here we pass relevant context

        const purchaseUnlocks = checkTraitUnlocks(
          { player: nextPlayer, band: nextBand, social: {} }, // Social not needed for purchase unlocks
          { type: 'PURCHASE', item, inventory: nextBand.inventory, gearCount: currentGearCount }
        )

        if (purchaseUnlocks.length > 0) {
          const membersWithUnlocks = (nextBand.members || []).map(m => {
            const unlock = purchaseUnlocks.find(u => u.memberId === m.name)
            if (unlock) {
              const trait = CHARACTERS[m.name.toUpperCase()]?.traits?.find(t => t.id === unlock.traitId)
              if (trait && !m.traits.some(t => t.id === trait.id)) {
                addToast(`Unlocked Trait: ${trait.name} (${m.name})`, 'success')
                return { ...m, traits: [...m.traits, trait] }
              }
            }
            return m
          })

          // Re-apply band update with new traits
          // If bandPatch existed, merge. If not, create one.
          updateBand({ ...(bandPatch || {}), members: membersWithUnlocks })
        }

        addToast(`${item.name} purchased!`, 'success')

        return true
      } catch (error) {
        handleError(error, { addToast, fallbackMessage: 'Purchase failed!' })
        return false
      }
    },
    [
      player,
      isItemOwned,
      updatePlayer,
      updateBand,
      addToast,
      applyInventorySet,
      applyInventoryAdd,
      applyStatModifier,
      applyUnlockUpgrade,
      applyUnlockHQ,
      applyPassive,
      getAdjustedCost
    ]
  )

  /**
   * Checks if an item should be disabled
   * @param {Object} item - Item to check
   * @returns {boolean} True if disabled
   */
  const isItemDisabled = useCallback(
    item => {
      const effect = getPrimaryEffect(item)
      if (!effect) return true
      const isConsumable = effect.type === 'inventory_add'
      const isOwned = isItemOwned(item)
      return (isOwned && !isConsumable) || !canAfford(item)
    },
    [isItemOwned, canAfford]
  )

  return {
    handleBuy,
    isItemOwned,
    canAfford,
    isItemDisabled,
    getAdjustedCost
  }
}
