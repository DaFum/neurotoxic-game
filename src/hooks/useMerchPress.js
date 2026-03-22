import { useState, useCallback, useMemo } from 'react'
import { useGameState } from '../context/GameState'

export const useMerchPress = () => {
  const { merchPress, player } = useGameState()

  const [showMerchPress, setShowMerchPress] = useState(false)

  const openMerchPress = useCallback(() => setShowMerchPress(true), [])
  const closeMerchPress = useCallback(() => setShowMerchPress(false), [])

  const config = useMemo(() => {
    // Dynamic config scaling with fame level (e.g. higher stakes as you grow)
    const multiplier = 1 + (player?.fameLevel || 0) * 0.5
    return {
      cost: Math.floor(150 * multiplier),
      loyaltyGain: Math.floor(5 * multiplier),
      controversyGain: Math.floor(10 * multiplier),
      failChance: 0.2, // 20% constant chance of failure
      harmonyCostOnFail: 15
    }
  }, [player?.fameLevel])

  const canPress = (player?.money || 0) >= config.cost

  const triggerPress = useCallback(() => {
    if (!canPress) return

    const isFailure = Math.random() < config.failChance
    const harmonyCost = isFailure ? config.harmonyCostOnFail : 0

    const successToast = {
      message: isFailure
        ? 'ui:merch_press.failure_toast'
        : 'ui:merch_press.success_toast',
      type: isFailure ? 'warning' : 'success'
    }

    merchPress({
      cost: config.cost,
      loyaltyGain: config.loyaltyGain,
      controversyGain: config.controversyGain,
      harmonyCost,
      isSuccess: !isFailure,
      successToast
    })

    closeMerchPress()
  }, [canPress, merchPress, closeMerchPress, config])

  return {
    showMerchPress,
    openMerchPress,
    closeMerchPress,
    triggerPress,
    canPress,
    config
  }
}
