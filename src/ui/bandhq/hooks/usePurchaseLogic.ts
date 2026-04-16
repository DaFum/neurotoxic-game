// @ts-nocheck
/**
 * Purchase Logic Hook
 * Encapsulates all purchase-related logic for the BandHQ shop.
 * @module usePurchaseLogic
 */

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { handleError, StateError } from '../../../utils/errorHandler'
import { checkTraitUnlocks } from '../../../utils/unlockCheck'
import { applyTraitUnlocks } from '../../../utils/traitUtils'
import { translateContextKeys } from '../../../utils/translationUtils'
import {
  GEAR_LOOKUP,
  getGearCount,
  getPrimaryEffect,
  getAdjustedCost,
  buildVanWithUpgrade,
  isItemOwned,
  canAfford,
  validatePurchase,
  processPurchaseEffect
} from '../../../utils/purchaseLogicUtils'
import {
  clampPlayerMoney,
  clampPlayerFame,
  calculateFameLevel
} from '../../../utils/gameStateUtils'

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

const handlePurchaseValidationError = (validation, item, addToast, t) => {
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
        itemName: t(`items:${item.id}.name`, {
          defaultValue: item.name
        })
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
        itemName: t(`items:${item.id}.name`, {
          defaultValue: item.name
        })
      }),
      'error'
    )
  }
}

const buildInitialPlayerPatch = (
  payingWithFame,
  startingCurrency,
  finalCost
) => {
  if (payingWithFame) {
    const newFame = clampPlayerFame(startingCurrency - finalCost)
    return {
      fame: newFame,
      fameLevel: calculateFameLevel(newFame)
    }
  } else {
    const newMoney = clampPlayerMoney(startingCurrency - finalCost)
    return { money: newMoney }
  }
}

const processEffectMessages = (messages, addToast, t) => {
  messages.forEach(msg => {
    const toastMsg = msg.messageKey
      ? t(msg.messageKey, {
          ...(msg.options || {}),
          defaultValue: msg.fallback || msg.message || msg.messageKey
        })
      : msg.message
    addToast(toastMsg, msg.type)
  })
}

const processPurchaseUnlocks = (
  { item, player, band, playerPatch, bandPatch },
  { updateBand, addToast, t }
) => {
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

  let finalBandPatch = bandPatch
  if (purchaseUnlocks.length > 0) {
    const traitResult = applyTraitUnlocks(
      { band: nextBand, toasts: [] },
      purchaseUnlocks
    )

    // Apply combined band patch with trait unlock members
    finalBandPatch = {
      ...(bandPatch || {}),
      members: traitResult.band.members
    }

    processTraitToasts(traitResult.toasts, addToast, t)
  }

  if (finalBandPatch) {
    updateBand(finalBandPatch)
  }
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
          handlePurchaseValidationError(validation, item, addToast, t)
          return false
        }

        const {
          effect,
          finalCost,
          isConsumable,
          payingWithFame,
          startingCurrency
        } = validation

        // Build initial patches
        const initialPlayerPatch = buildInitialPlayerPatch(
          payingWithFame,
          startingCurrency,
          finalCost
        )

        const effectResult = processPurchaseEffect(
          effect,
          item,
          initialPlayerPatch,
          player,
          band
        )

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
          processEffectMessages(effectResult.messages, addToast, t)
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
        processPurchaseUnlocks(
          { item, player, band, playerPatch, bandPatch },
          { updateBand, addToast, t }
        )

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
