/**
 * Purchase Logic Hook
 * Encapsulates all purchase-related logic for the BandHQ shop.
 * @module usePurchaseLogic
 */

import { useCallback } from 'react'
import { handleError, GameLogicError } from '../utils/errorHandler'

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
   * Checks if an item is already owned
   * @param {Object} item - Item to check
   * @returns {boolean} True if owned
   */
  const isItemOwned = useCallback(
    item => {
      const effect = item.effect
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
      return currencyValue >= item.cost
    },
    [player.money, player.fame]
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
        [effect.item]:
          ((band.inventory ?? {})[effect.item] || 0) + effect.value
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

        case 'player':
          nextPlayerPatch[effect.stat] = Math.max(
            0,
            (player[effect.stat] || 0) + val
          )
          break

        case 'band':
          nextBandPatch = {
            [effect.stat]: Math.max(0, (band[effect.stat] || 0) + val)
          }
          break

        default: // performance or undefined (assumed performance)
          nextBandPatch = {
            performance: {
              ...(band.performance ?? {}),
              [effect.stat]: Math.max(
                0,
                ((band.performance ?? {})[effect.stat] || 0) + val
              )
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

      if (effect.effect === 'harmony_regen_travel') {
        nextBandPatch = { harmonyRegenTravel: true }
      } else if (effect.effect === 'passive_followers') {
        const val = effect.value || 0
        nextPlayerPatch.passiveFollowers =
          (player.passiveFollowers || 0) + val
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
            (nextPlayerPatch.fame ?? (player.fame ?? 0)) + 10
          )
          addToast('Looks cool. Fame +10', 'success')
          break

        case 'hq_room_diy_soundproofing':
          nextBandPatch = { harmony: Math.min(100, (band.harmony ?? 0) + 5) }
          addToast('Less noise, more peace. Harmony +5', 'success')
          break

        case 'hq_room_coffee':
        case 'hq_room_sofa':
        case 'hq_room_old_couch':
        case 'hq_room_cheap_beer_fridge': {
          const members = (band.members ?? []).map(m => {
            switch (item.id) {
              case 'hq_room_coffee':
                return { ...m, mood: Math.min(100, (m.mood ?? 0) + 20) }
              case 'hq_room_sofa':
                return { ...m, stamina: Math.min(100, (m.stamina ?? 0) + 30) }
              case 'hq_room_old_couch':
                return { ...m, stamina: Math.min(100, (m.stamina ?? 0) + 10) }
              default:
                return { ...m, mood: Math.min(100, (m.mood ?? 0) + 5) }
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
        const effect = item.effect
        const payingWithFame = item.currency === 'fame'

        const startingMoney = player.money ?? 0
        const startingFame = player.fame ?? 0
        const currencyValue = payingWithFame ? startingFame : startingMoney

        const isConsumable = effect.type === 'inventory_add'
        const isOwned = isItemOwned(item)

        if (isOwned && !isConsumable) {
          addToast('Already owned!', 'warning')
          return false
        }

        if (currencyValue < item.cost) {
          addToast(
            `Not enough ${payingWithFame ? 'Fame' : 'Money'}!`,
            'error'
          )
          return false
        }

        // Build patches
        let playerPatch = payingWithFame
          ? { fame: Math.max(0, startingFame - item.cost) }
          : { money: Math.max(0, startingMoney - item.cost) }

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
            // Also mark as owned via van upgrades for passive items from UPGRADES_DB
            // Wait, UPGRADES_DB items use `id` for ownership check in `isItemOwned`.
            // But `isItemOwned` checks `player.van.upgrades` or `player.hqUpgrades`.
            // So we need to add the item ID to one of those.
            // MainMenu did: upgrades: [...(player.van?.upgrades || []), upgrade.id]
            // We should do that here too.
            playerPatch.van = {
              ...(playerPatch.van ?? player.van ?? {}),
              upgrades: [
                ...(playerPatch.van?.upgrades ?? player.van?.upgrades ?? []),
                item.id
              ]
            }
            break
          }

          default:
            handleError(
              new GameLogicError(`Unknown effect type: ${effect.type}`, {
                item,
                effect
              }),
              { addToast, fallbackMessage: 'Purchase failed: Unknown effect type.' }
            )
            return false
        }

        // Also ensure simple stat_modifiers from UPGRADES_DB are marked as owned!
        // MainMenu logic added ALL upgrades to `player.van.upgrades`.
        // My `applyStatModifier` does NOT add to upgrades list.
        // I need to fix this. `stat_modifier` items in `UPGRADES_DB` (like van_suspension) MUST be added to `upgrades` list to be marked as owned.
        // `HQ_ITEMS` (like lucky_rabbit_foot) use `stat_modifier` but are consumables/one-offs? No, `lucky_rabbit_foot` seems like a unique item.
        // `isItemOwned` checks `van.upgrades` for `item.id`.
        // So if I buy `van_suspension`, I must add `van_suspension` to `player.van.upgrades`.
        // The previous `MainMenu` logic did: `upgrades: [...player.van.upgrades, upgrade.id]` unconditionally for all upgrades.

        // So, regardless of effect type, if it's from UPGRADES_DB (or basically any item that isn't a consumable or hq_unlock), it should probably be tracked.
        // `HQ_ITEMS` used `inventory_set` which checks `band.inventory`.

        // If the item has `currency: 'fame'`, it's likely an Upgrade that needs tracking in `van.upgrades`.
        // Or I can just check if `isOwned` logic requires it.
        // `isItemOwned` checks `player.van.upgrades.includes(item.id)`.

        if (item.currency === 'fame' && !isConsumable && effect.type !== 'unlock_upgrade') {
           // Ensure it is added to upgrades list if not already handled by unlock_upgrade
           // unlock_upgrade adds it.
           // stat_modifier does NOT add it.
           // passive does NOT add it (I added it above, but should be generic).

           // Let's unify this.
           const currentUpgrades = playerPatch.van?.upgrades ?? player.van?.upgrades ?? []
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
      applyPassive
    ]
  )

  /**
   * Checks if an item should be disabled
   * @param {Object} item - Item to check
   * @returns {boolean} True if disabled
   */
  const isItemDisabled = useCallback(
    item => {
      const isConsumable = item.effect.type === 'inventory_add'
      const isOwned = isItemOwned(item)
      return (isOwned && !isConsumable) || !canAfford(item)
    },
    [isItemOwned, canAfford]
  )

  return {
    handleBuy,
    isItemOwned,
    canAfford,
    isItemDisabled
  }
}
