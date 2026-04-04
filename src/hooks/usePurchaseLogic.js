// TODO: Refactor logic to reduce cognitive complexity and improve testability
/**
 * Purchase Logic Hook
 * Encapsulates all purchase-related logic for the BandHQ shop.
 * @module usePurchaseLogic
 */

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { handleError, StateError } from '../utils/errorHandler.js'
import { checkTraitUnlocks } from '../utils/unlockCheck.js'
import { applyTraitUnlocks } from '../utils/traitUtils.js'
import { HQ_ITEMS } from '../data/hqItems.js'
import { translateContextKeys } from '../utils/translationUtils.js'
import {
  getPrimaryEffect,
  getAdjustedCost,
  buildVanWithUpgrade,
  isItemOwned,
  canAfford,
  validatePurchase,
  processPurchaseEffect
} from '../utils/purchaseLogicUtils.js'
import {
  clampPlayerMoney,
  clampPlayerFame,
  calculateFameLevel
} from '../utils/gameStateUtils.js'

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
// Pre-compute gear lookup for O(1) checks during purchases
const GEAR_LOOKUP = new Map()
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
const getGearCount = (inventory, lookup) => {
  let count = 0
  const inv = inventory || {}
  for (const [key, value] of Object.entries(inv)) {
    const isOwned = value === true || (typeof value === 'number' && value > 0)
    if (isOwned && lookup.has(key)) {
      count++
    }
  }
  return count
}

/**
 * Helper to process and display toasts from trait unlocks
 * @param {Array} toasts - Array of toast objects
 * @param {Function} addToast - Toast function
 * @param {Function} t - Translation function
 */
const processTraitToasts = (toasts, addToast, t) => {
  toasts.forEach(toastItem => {
    const safeOptions = toastItem.options
      ? translateContextKeys(toastItem.options, t)
      : {}
    const toastMsg = toastItem.messageKey
      ? t(toastItem.messageKey, {
          ...safeOptions,
          defaultValue: toastItem.message
        })
      : toastItem.message
    addToast(toastMsg, toastItem.type)
  })
}

export const usePurchaseLogic = ({
  player,
  band,
  social,
  updatePlayer,
  updateBand,
  addToast
}) => {
  const { t } = useTranslation(['ui', 'items'])
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
        const validation = validatePurchase(item, player, band)

        if (!validation.isValid) {
          if (validation.errorType === 'missing_effect') {
            handleError(
              new StateError('Purchase item is missing a primary effect', {
                itemId: item?.id,
                itemName: item?.name
              }),
              {
                addToast,
                fallbackMessage: t('ui:shop.messages.invalidData', {
                  defaultValue: 'Purchase failed: Invalid upgrade data.'
                })
              }
            )
          } else if (validation.errorType === 'already_owned') {
            addToast(
              t('ui:shop.messages.alreadyOwned', {
                itemName: t(`items:${item.id}.name`, { defaultValue: item.name })
              }),
              'warning'
            )
          } else if (validation.errorType === 'insufficient_funds') {
            const payingWithFame = item.currency === 'fame'
            addToast(
              t('ui:shop.messages.notEnough', {
                currency: payingWithFame
                  ? t('ui:shop.messages.fame')
                  : t('ui:shop.messages.money'),
                itemName: t(`items:${item.id}.name`, { defaultValue: item.name })
              }),
              'error'
            )
          }
          return false
        }

        const { effect, finalCost, isConsumable, payingWithFame, startingCurrency } = validation

        // Build initial patches
        let initialPlayerPatch
        if (payingWithFame) {
          const newFame = clampPlayerFame(startingCurrency - finalCost)
          initialPlayerPatch = {
            fame: newFame,
            fameLevel: calculateFameLevel(newFame)
          }
        } else {
          const newMoney = clampPlayerMoney(startingCurrency - finalCost)
          initialPlayerPatch = { money: newMoney }
        }

        const effectResult = processPurchaseEffect(effect, item, initialPlayerPatch, player, band)

        if (effectResult.errorType === 'unknown_effect') {
          handleError(
            new StateError(`Unknown effect type: ${effectResult.effectType}`, {
              effectType: effectResult.effectType,
              itemId: item.id,
              currency: item.currency
            }),
            {
              addToast,
              fallbackMessage: t('ui:shop.messages.unknownEffect', {
                defaultValue: 'Purchase failed: Unknown effect type.'
              })
            }
          )
          return false
        }

        let playerPatch = effectResult.playerPatch || initialPlayerPatch
        let bandPatch = effectResult.bandPatch || null

        if (effectResult.messages) {
          effectResult.messages.forEach(msg => {
            const toastMsg = msg.messageKey
              ? t(msg.messageKey, {
                  ...(msg.options || {}),
                  defaultValue: msg.fallback || msg.message || msg.messageKey
                })
              : msg.message
            addToast(toastMsg, msg.type)
          })
        }

        // Ensure fame-based upgrades are tracked in van.upgrades for ownership detection
        if (
          item.currency === 'fame' &&
          !isConsumable &&
          effect.type !== 'unlock_upgrade' &&
          effect.type !== 'inventory_set'
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

        const gearCount = getGearCount(nextBand.inventory, GEAR_LOOKUP)

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

          processTraitToasts(traitResult.toasts, addToast, t)
        } else {
          // No unlocks — apply original bandPatch if it existed
          if (bandPatch) updateBand(bandPatch)
        }

        // Player update was already called above
        addToast(
          t('ui:shop.messages.purchaseSuccess', {
            itemName: t(`items:${item.id}.name`, { defaultValue: item.name })
          }),
          'success'
        )

        return true
      } catch (error) {
        handleError(error, {
          addToast,
          fallbackMessage: t('ui:shop.messages.purchaseFailed', {
            defaultValue: 'Purchase failed!'
          })
        })
        return false
      }
    },
    [player, band, updatePlayer, updateBand, addToast, t]
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
        (isOwned && !isConsumable) ||
        !canAfford(item, player, getAdjustedCost(item, band))
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
