import { useCallback, useMemo } from 'react'
import { useGameActions, useGameSelector } from '../../context/GameState'
import type { PurchaseItem } from '../../types'

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
