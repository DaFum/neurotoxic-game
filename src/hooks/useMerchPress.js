import { useState, useCallback } from 'react'
import { useGameState } from '../context/GameState'

export const MERCH_PRESS_CONFIG = {
  cost: 150,
  loyaltyGain: 5,
  controversyGain: 10,
  failChance: 0.2, // 20% chance equipment breaks
  harmonyCostOnFail: 15
}

export const useMerchPress = () => {
  const { merchPress, player } = useGameState()

  const [showMerchPress, setShowMerchPress] = useState(false)

  const openMerchPress = useCallback(() => setShowMerchPress(true), [])
  const closeMerchPress = useCallback(() => setShowMerchPress(false), [])

  const canPress = (player?.money || 0) >= MERCH_PRESS_CONFIG.cost

  const triggerPress = useCallback(() => {
    if (!canPress) return

    const isFailure = Math.random() < MERCH_PRESS_CONFIG.failChance
    const harmonyCost = isFailure ? MERCH_PRESS_CONFIG.harmonyCostOnFail : 0

    const successToast = {
      message: isFailure
        ? 'ui:merch_press.failure_toast'
        : 'ui:merch_press.success_toast',
      type: isFailure ? 'warning' : 'success'
    }

    merchPress({
      cost: MERCH_PRESS_CONFIG.cost,
      loyaltyGain: MERCH_PRESS_CONFIG.loyaltyGain,
      controversyGain: MERCH_PRESS_CONFIG.controversyGain,
      harmonyCost,
      successToast
    })

    closeMerchPress()
  }, [canPress, merchPress, closeMerchPress])

  return {
    showMerchPress,
    openMerchPress,
    closeMerchPress,
    triggerPress,
    canPress,
    MERCH_PRESS_CONFIG
  }
}
