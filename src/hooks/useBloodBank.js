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

  // Need at least enough harmony to not completely shatter (must be > harmonyCost)
  // And enough stamina to survive the drain
  const minStaminaRequired = config.staminaCost + 10

  const canDonate = useMemo(() => {
    if (!band || !band.members) return false
    const hasEnoughHarmony = band.harmony > config.harmonyCost
    const allMembersHaveStamina = band.members.every(m => (m.stamina || 0) >= minStaminaRequired)
    return hasEnoughHarmony && allMembersHaveStamina
  }, [band, config.harmonyCost, minStaminaRequired])

  const triggerDonate = useCallback(() => {
    if (!canDonate) return

    const successToast = {
      message: 'ui:blood_bank.success_toast',
      type: 'success'
    }

    bloodBankDonate({
      moneyGain: config.moneyGain,
      harmonyCost: config.harmonyCost,
      staminaCost: config.staminaCost,
      controversyGain: config.controversyGain,
      successToast
    })

    closeBloodBank()
  }, [canDonate, bloodBankDonate, closeBloodBank, config])

  return {
    showBloodBank,
    openBloodBank,
    closeBloodBank,
    triggerDonate,
    canDonate,
    config
  }
}
