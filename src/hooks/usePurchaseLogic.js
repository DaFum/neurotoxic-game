/**
 * Purchase Logic Hook
 * Encapsulates all purchase-related logic for the BandHQ shop.
 * @module usePurchaseLogic
 */

import { useCallback } from 'react'
import { handleError, StateError } from '../utils/errorHandler.js'
import { checkTraitUnlocks } from '../utils/unlockCheck.js'
import { applyTraitUnlocks } from '../utils/traitUtils.js'
import { HQ_ITEMS } from '../data/hqItems.js'
import {
  getPrimaryEffect,
  getAdjustedCost,
  buildVanWithUpgrade,
  isItemOwned,
  canAfford,
  applyInventorySet,
  applyInventoryAdd,
  applyStatModifier,
  applyUnlockUpgrade,
  applyUnlockHQ,
  applyPassive
} from '../utils/purchaseLogicUtils.js'

export { getPrimaryEffect } // Re-export for backward compatibility if needed, though we will update consumers.

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
  social,
  updatePlayer,
  updateBand,
  addToast
}) => {
  /**
   * Calculates the adjusted cost of an item based on active traits.
   */
  const getAdjustedCostCallback = useCallback(
    item => getAdjustedCost(item, band),
    [band]
  )

  /**
   * Checks if an item is already owned
   */
  const isItemOwnedCallback = useCallback(
    item => isItemOwned(item, player, band),
    [player, band]
  )

  /**
   * Checks if player can afford an item
   */
  const canAffordCallback = useCallback(
    item => canAfford(item, player, getAdjustedCost(item, band)),
    [player, band]
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
        const finalCost = getAdjustedCost(item, band)

        const isConsumable = effect.type === 'inventory_add'
        const isOwned = isItemOwned(item, player, band)

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
          case 'inventory_set': {
            const result = applyInventorySet(effect, band.inventory)
            bandPatch = result
            break
          }

          case 'inventory_add': {
            const result = applyInventoryAdd(effect, band.inventory)
            bandPatch = result
            break
          }

          case 'stat_modifier': {
            const result = applyStatModifier(effect, playerPatch, player, band)
            playerPatch = result.playerPatch
            bandPatch = result.bandPatch

            if (item.oneTime !== false) {
              const vanState = playerPatch.van ?? player.van
              playerPatch.van = buildVanWithUpgrade(vanState, item.id)
            }
            break
          }

          case 'unlock_upgrade': {
            const vanState = playerPatch.van ?? player.van
            playerPatch = applyUnlockUpgrade(
              effect,
              item,
              playerPatch,
              vanState
            )
            break
          }

          case 'unlock_hq': {
            const result = applyUnlockHQ(item, playerPatch, player, band)
            playerPatch = result.playerPatch
            bandPatch = result.bandPatch
            if (result.messages) {
              result.messages.forEach(msg => addToast(msg.message, msg.type))
            }
            break
          }

          case 'passive': {
            const result = applyPassive(effect, playerPatch, player)
            playerPatch = result.playerPatch
            bandPatch = result.bandPatch
            // Mark passive items as owned via van upgrades to ensure isItemOwned returns true
            const vanState = playerPatch.van ?? player.van
            playerPatch.van = buildVanWithUpgrade(vanState, item.id)
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
          const vanState = playerPatch.van ?? player.van
          playerPatch.van = buildVanWithUpgrade(vanState, item.id)
        }

        // Apply updates
        updatePlayer(playerPatch)

        // Check Purchase Unlocks
        const nextPlayer = {
          ...player,
          ...playerPatch,
          van: { ...player.van, ...playerPatch.van }
        }
        const nextBand = {
          ...band,
          ...(bandPatch || {}),
          inventory: { ...band.inventory, ...(bandPatch?.inventory || {}) }
        }

        // Count ONLY gear items for gear_nerd check
        // Match inventory keys against item effect keys (e.g. 'strings' matches effect.item: 'strings')
        const allGearItems = [
          ...(HQ_ITEMS.gear || []),
          ...(HQ_ITEMS.instruments || [])
        ]
        const gearCount = Object.entries(nextBand.inventory || {}).filter(
          ([key, value]) => {
            const isOwned =
              value === true || (typeof value === 'number' && value > 0)
            if (!isOwned) return false
            const itemDef = allGearItems.find(i => {
              const e = i.effect || i.effects?.[0]
              return e?.item === key || i.id === key
            })
            return (
              itemDef &&
              (itemDef.category === 'GEAR' || itemDef.category === 'INSTRUMENT')
            )
          }
        ).length

        const purchaseUnlocks = checkTraitUnlocks(
          { player: nextPlayer, band: nextBand, social: {} },
          { type: 'PURCHASE', item, inventory: nextBand.inventory, gearCount }
        )

        if (purchaseUnlocks.length > 0) {
          const traitResult = applyTraitUnlocks(
            { band: nextBand, toasts: [] },
            purchaseUnlocks
          )

          // Apply combined band patch with trait unlock members
          updateBand({
            ...(bandPatch || {}),
            members: traitResult.band.members
          })

          // Show generated toasts
          traitResult.toasts.forEach(t => {
            addToast(t.message, t.type)
          })
        } else {
          // No unlocks — apply original bandPatch if it existed
          if (bandPatch) updateBand(bandPatch)
        }

        // Player update was already called above
        addToast(`${item.name} purchased!`, 'success')

        return true
      } catch (error) {
        handleError(error, { addToast, fallbackMessage: 'Purchase failed!' })
        return false
      }
    },
    [player, band, updatePlayer, updateBand, addToast]
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
      if (item.requiresReputation && (social?.controversyLevel || 0) >= 50)
        return true
      const isConsumable = effect.type === 'inventory_add'
      const isOwned = isItemOwned(item, player, band)
      return (
        (isOwned && !isConsumable) || !canAfford(item, player, getAdjustedCost(item, band))
      )
    },
    [player, band, social]
  )

  return {
    handleBuy,
    isItemOwned: isItemOwnedCallback,
    canAfford: canAffordCallback,
    isItemDisabled,
    getAdjustedCost: getAdjustedCostCallback
  }
}
