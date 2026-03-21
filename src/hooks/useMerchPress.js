import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import { createMerchPressAction } from '../context/actionCreators'

export const useMerchPress = () => {
  const { t } = useTranslation(['ui'])
  const { dispatch, player, band, social } = useGameState()

  const [showMerchPress, setShowMerchPress] = useState(false)

  const openMerchPress = useCallback(() => setShowMerchPress(true), [])
  const closeMerchPress = useCallback(() => setShowMerchPress(false), [])

  const MERCH_PRESS_CONFIG = {
    cost: 150,
    loyaltyGain: 5,
    controversyGain: 10,
    failChance: 0.2, // 20% chance equipment breaks
    harmonyCostOnFail: 15
  }

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

    dispatch(createMerchPressAction({
      cost: MERCH_PRESS_CONFIG.cost,
      loyaltyGain: MERCH_PRESS_CONFIG.loyaltyGain,
      controversyGain: MERCH_PRESS_CONFIG.controversyGain,
      harmonyCost,
      successToast
    }))

    closeMerchPress()
  }, [canPress, dispatch, closeMerchPress, MERCH_PRESS_CONFIG])

  return {
    showMerchPress,
    openMerchPress,
    closeMerchPress,
    triggerPress,
    canPress,
    MERCH_PRESS_CONFIG
  }
}
