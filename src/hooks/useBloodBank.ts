import { useState, useCallback, useMemo } from 'react'
import { useGameActions, useGameSelector } from '../context/GameState'
import { GAME_CONSTANTS } from '../context/gameConstants'
import { validateBloodBankDonation } from '../utils/bloodBankUtils'
import { finiteNumberOr } from '../utils/finiteNumber'

/**
 * Coordinates blood-bank modal state, donation eligibility, and donation dispatch.
 *
 * @returns Modal state, donation actions, eligibility flags, and scaled donation configs.
 */
export const useBloodBank = () => {
  const player = useGameSelector(state => state.player)
  const band = useGameSelector(state => state.band)
  const { bloodBankDonate } = useGameActions()

  const [showBloodBank, setShowBloodBank] = useState(false)

  const openBloodBank = useCallback(() => setShowBloodBank(true), [])
  const closeBloodBank = useCallback(() => setShowBloodBank(false), [])

  const { config, marrowConfig } = useMemo(() => {
    // finiteNumberOr, not `?? 0`: a NaN fameLevel would otherwise poison
    // `multiplier` and dispatch a NaN moneyGain into bloodBankDonate.
    const multiplier = 1 + finiteNumberOr(player?.fameLevel, 0) * 0.2
    return {
      config: {
        moneyGain: Math.floor(
          GAME_CONSTANTS.BLOOD_BANK.BLOOD_BASE_MONEY * multiplier
        ),
        harmonyCost: GAME_CONSTANTS.BLOOD_BANK.BLOOD_HARMONY_COST,
        staminaCost: GAME_CONSTANTS.BLOOD_BANK.BLOOD_STAMINA_COST,
        controversyGain: GAME_CONSTANTS.BLOOD_BANK.BLOOD_CONTROVERSY_GAIN
      },
      marrowConfig: {
        moneyGain: Math.floor(
          GAME_CONSTANTS.BLOOD_BANK.MARROW_BASE_MONEY * multiplier
        ),
        harmonyCost: GAME_CONSTANTS.BLOOD_BANK.MARROW_HARMONY_COST,
        staminaCost: GAME_CONSTANTS.BLOOD_BANK.MARROW_STAMINA_COST,
        controversyGain: GAME_CONSTANTS.BLOOD_BANK.MARROW_CONTROVERSY_GAIN
      }
    }
  }, [player?.fameLevel])

  const canDonate = validateBloodBankDonation(band, config)
  const canDonateMarrow = validateBloodBankDonation(band, marrowConfig)

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
