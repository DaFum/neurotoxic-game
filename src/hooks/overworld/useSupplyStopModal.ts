import { useCallback, useEffect, useState } from 'react'
import { useGameActions, useGameSelector } from '../../context/GameState'
import type { PurchaseItem } from '../../types'

export const useSupplyStopModal = () => {
  const pendingSupplyStopInventory = useGameSelector(
    state => state.pendingSupplyStopInventory
  )
  const { setPendingSupplyStopInventory } = useGameActions()
  const [inventory, setInventory] = useState<PurchaseItem[] | null>(
    pendingSupplyStopInventory
  )

  useEffect(() => {
    if (!pendingSupplyStopInventory) return
    setInventory(pendingSupplyStopInventory)
    setPendingSupplyStopInventory(null)
  }, [pendingSupplyStopInventory, setPendingSupplyStopInventory])

  const openSupplyStop = useCallback(
    (nextInventory: PurchaseItem[]) => setInventory(nextInventory),
    []
  )
  const closeSupplyStop = useCallback(() => setInventory(null), [])

  return {
    showSupplyStop: inventory !== null,
    supplyStopInventory: inventory,
    openSupplyStop,
    closeSupplyStop
  }
}
