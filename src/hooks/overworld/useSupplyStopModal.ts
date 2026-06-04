import { useCallback, useMemo } from 'react'
import { useGameActions, useGameSelector } from '../../context/GameState'
import type { PurchaseItem } from '../../types'

/**
 * Manages pending supply-stop inventory and modal visibility.
 *
 * @returns Supply-stop modal visibility, inventory, and open/close callbacks.
 */
export const useSupplyStopModal = () => {
  const pendingSupplyStopInventory = useGameSelector(
    state => state.pendingSupplyStopInventory
  )
  const { setPendingSupplyStopInventory } = useGameActions()

  const openSupplyStop = useCallback(
    (nextInventory: PurchaseItem[]) =>
      setPendingSupplyStopInventory(nextInventory),
    [setPendingSupplyStopInventory]
  )
  const closeSupplyStop = useCallback(
    () => setPendingSupplyStopInventory(null),
    [setPendingSupplyStopInventory]
  )

  return useMemo(
    () => ({
      showSupplyStop: pendingSupplyStopInventory !== null,
      supplyStopInventory: pendingSupplyStopInventory,
      openSupplyStop,
      closeSupplyStop
    }),
    [pendingSupplyStopInventory, openSupplyStop, closeSupplyStop]
  )
}
