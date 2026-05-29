import { useState, useCallback, useMemo } from 'react'
import { useGameActions, useGameSelector } from '../context/GameState'
import { GAME_CONSTANTS } from '../context/gameConstants'
import { validateBloodBankDonation } from '../utils/bloodBankUtils'

export const useBloodBank = () => {
  const player = useGameSelector(state => state.player)
  const band = useGameSelector(state => state.band)
  const { bloodBankDonate } = useGameActions()

  const [showBloodBank, setShowBloodBank] = useState(false)

  const openBloodBank = useCallback(() => setShowBloodBank(true), [])
  const closeBloodBank = useCallback(() => setShowBloodBank(false), [])

  const config = useMemo(() => {
    const multiplier = 1 + (player?.fameLevel ?? 0) * 0.2
    return {
      moneyGain: Math.floor(
        GAME_CONSTANTS.BLOOD_BANK.BLOOD_BASE_MONEY * multiplier
      ),
      harmonyCost: GAME_CONSTANTS.BLOOD_BANK.BLOOD_HARMONY_COST,
      staminaCost: GAME_CONSTANTS.BLOOD_BANK.BLOOD_STAMINA_COST,
      controversyGain: GAME_CONSTANTS.BLOOD_BANK.BLOOD_CONTROVERSY_GAIN
    }
  }, [player?.fameLevel])

  const marrowConfig = useMemo(() => {
    const multiplier = 1 + (player?.fameLevel ?? 0) * 0.2
    return {
      moneyGain: Math.floor(
        GAME_CONSTANTS.BLOOD_BANK.MARROW_BASE_MONEY * multiplier
      ),
      harmonyCost: GAME_CONSTANTS.BLOOD_BANK.MARROW_HARMONY_COST,
      staminaCost: GAME_CONSTANTS.BLOOD_BANK.MARROW_STAMINA_COST,
      controversyGain: GAME_CONSTANTS.BLOOD_BANK.MARROW_CONTROVERSY_GAIN
    }
  }, [player?.fameLevel])

  const canDonate = useMemo(
    () => validateBloodBankDonation(band, config),
    [band, config]
  )
  const canDonateMarrow = useMemo(
    () => validateBloodBankDonation(band, marrowConfig),
    [band, marrowConfig]
  )

  const triggerDonate = useCallback(
    (type: 'blood' | 'marrow' = 'blood') => {
      const isMarrow = type === 'marrow'
      const activeConfig = isMarrow ? marrowConfig : config

      if (isMarrow ? !canDonateMarrow : !canDonate) return

      const successToast = {
        messageKey: isMarrow
          ? 'ui:blood_bank.marrow_success_toast'
          : 'ui:blood_bank.success_toast',
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
    },
    [
      canDonate,
      canDonateMarrow,
      bloodBankDonate,
      closeBloodBank,
      config,
      marrowConfig
    ]
  )

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
