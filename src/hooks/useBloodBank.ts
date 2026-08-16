import { useState, useCallback, useMemo } from 'react'
import { useGameActions, useGameSelector } from '../context/GameState'
import { GAME_CONSTANTS } from '../context/gameConstants'
import { validateBloodBankDonation } from '../utils/bloodBankUtils'
import { finiteNumberOr } from '../utils/finiteNumber'

/**
 * Internal configuration definitions mapping donation types to base costs and rewards.
 */
const DONATION_VARIANTS = {
  blood: {
    baseMoney: GAME_CONSTANTS.BLOOD_BANK.BLOOD_BASE_MONEY,
    harmonyCost: GAME_CONSTANTS.BLOOD_BANK.BLOOD_HARMONY_COST,
    staminaCost: GAME_CONSTANTS.BLOOD_BANK.BLOOD_STAMINA_COST,
    controversyGain: GAME_CONSTANTS.BLOOD_BANK.BLOOD_CONTROVERSY_GAIN,
    successToastKey: 'ui:blood_bank.success_toast'
  },
  marrow: {
    baseMoney: GAME_CONSTANTS.BLOOD_BANK.MARROW_BASE_MONEY,
    harmonyCost: GAME_CONSTANTS.BLOOD_BANK.MARROW_HARMONY_COST,
    staminaCost: GAME_CONSTANTS.BLOOD_BANK.MARROW_STAMINA_COST,
    controversyGain: GAME_CONSTANTS.BLOOD_BANK.MARROW_CONTROVERSY_GAIN,
    successToastKey: 'ui:blood_bank.marrow_success_toast'
  }
}

/**
 * Coordinates blood-bank modal state, donation eligibility, and donation dispatch.
 *
 * @returns Modal state, donation actions, eligibility flags, and scaled donation configs
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

    const buildConfig = (variant: typeof DONATION_VARIANTS.blood) => ({
      moneyGain: Math.floor(variant.baseMoney * multiplier),
      harmonyCost: variant.harmonyCost,
      staminaCost: variant.staminaCost,
      controversyGain: variant.controversyGain
    })

    return {
      config: buildConfig(DONATION_VARIANTS.blood),
      marrowConfig: buildConfig(DONATION_VARIANTS.marrow)
    }
  }, [player?.fameLevel])

  const canDonate = validateBloodBankDonation(band, config)
  const canDonateMarrow = validateBloodBankDonation(band, marrowConfig)

  const triggerDonate = useCallback(
    (type: 'blood' | 'marrow' = 'blood') => {
      const isMarrow = type === 'marrow'
      const activeConfig = isMarrow ? marrowConfig : config
      const variant = DONATION_VARIANTS[type]

      if (isMarrow ? !canDonateMarrow : !canDonate) return

      const successToast = {
        messageKey: variant.successToastKey,
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
