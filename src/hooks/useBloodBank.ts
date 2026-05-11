import { useState, useCallback, useMemo } from 'react'
import { useGameState } from '../context/GameState'

export const useBloodBank = () => {
  const { bloodBankDonate, player, band } = useGameState()

  const [showBloodBank, setShowBloodBank] = useState(false)

  const openBloodBank = useCallback(() => setShowBloodBank(true), [])
  const closeBloodBank = useCallback(() => setShowBloodBank(false), [])

  const config = useMemo(() => {
    // Dynamic config: higher fame/money means slightly better payout but higher toll
    const multiplier = 1 + (player?.fameLevel || 0) * 0.2
    return {
      moneyGain: Math.floor(100 * multiplier),
      harmonyCost: 15, // Fixed high toll on band harmony
      staminaCost: 30, // Severe stamina drain per member
      controversyGain: 5 // Sketchy underground activity
    }
  }, [player?.fameLevel])

  const marrowConfig = useMemo(() => {
    const multiplier = 1 + (player?.fameLevel || 0) * 0.2
    return {
      moneyGain: Math.floor(500 * multiplier),
      harmonyCost: 40,
      staminaCost: 60,
      controversyGain: 20
    }
  }, [player?.fameLevel])

  const canDonate = useMemo(() => {
    if (!band || !band.members || band.members.length === 0) return false
    const hasEnoughHarmony = band.harmony > config.harmonyCost
    // Need enough stamina to survive the drain
    const minStaminaRequired = config.staminaCost + 10
    const allMembersHaveStamina = band.members.every(
      m => (m.stamina || 0) >= minStaminaRequired
    )
    return hasEnoughHarmony && allMembersHaveStamina
  }, [band, config.harmonyCost, config.staminaCost])

  const canDonateMarrow = useMemo(() => {
    if (!band || !band.members || band.members.length === 0) return false
    const hasEnoughHarmony = band.harmony > marrowConfig.harmonyCost
    const minStaminaRequired = marrowConfig.staminaCost + 10
    const allMembersHaveStamina = band.members.every(
      m => (m.stamina || 0) >= minStaminaRequired
    )
    return hasEnoughHarmony && allMembersHaveStamina
  }, [band, marrowConfig.harmonyCost, marrowConfig.staminaCost])

  const triggerDonate = useCallback((type: 'blood' | 'marrow' = 'blood') => {
    const isMarrow = type === 'marrow'
    const activeConfig = isMarrow ? marrowConfig : config

    if (isMarrow ? !canDonateMarrow : !canDonate) return

    const successToast = {
      message: isMarrow ? 'ui:blood_bank.marrow_success_toast' : 'ui:blood_bank.success_toast',
      type: 'success' as const
    }

    bloodBankDonate({
      moneyGain: activeConfig.moneyGain,
      harmonyCost: activeConfig.harmonyCost,
      staminaCost: activeConfig.staminaCost,
      controversyGain: activeConfig.controversyGain,
      successToast
    })

    closeBloodBank()
  }, [canDonate, canDonateMarrow, bloodBankDonate, closeBloodBank, config, marrowConfig])

  return {
    showBloodBank,
    openBloodBank,
    closeBloodBank,
    triggerDonate,
    canDonate,
    canDonateMarrow,
    config,
    marrowConfig
  }
}
