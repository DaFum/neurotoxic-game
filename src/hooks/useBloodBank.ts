import { useCallback, useMemo } from 'react'
import { useGameActions, useGameSelector } from '../context/GameState'
import { useDisclosure } from './useDisclosure'
import {
  getBloodBankDonation,
  validateBloodBankDonation
} from '../utils/bloodBankUtils'

/** i18n keys of the toast each donation kind shows on success. */
const SUCCESS_TOAST_KEYS = {
  blood: 'ui:blood_bank.success_toast',
  marrow: 'ui:blood_bank.marrow_success_toast'
} as const

/**
 * Coordinates blood-bank modal state, donation eligibility, and donation dispatch.
 *
 * @returns Modal state, donation actions, eligibility flags, and scaled donation configs
 */
export const useBloodBank = () => {
  const player = useGameSelector(state => state.player)
  const band = useGameSelector(state => state.band)
  const { bloodBankDonate } = useGameActions()

  const {
    isOpen: showBloodBank,
    open: openBloodBank,
    close: closeBloodBank
  } = useDisclosure()

  // Display only: the reducer derives the same amounts from the same table.
  const { config, marrowConfig } = useMemo(() => {
    const donation = (kind: 'blood' | 'marrow') =>
      getBloodBankDonation(kind, player?.fameLevel) as NonNullable<
        ReturnType<typeof getBloodBankDonation>
      >
    return { config: donation('blood'), marrowConfig: donation('marrow') }
  }, [player?.fameLevel])

  const canDonate = validateBloodBankDonation(band, config)
  const canDonateMarrow = validateBloodBankDonation(band, marrowConfig)

  const triggerDonate = useCallback(
    (type: 'blood' | 'marrow' = 'blood') => {
      const isMarrow = type === 'marrow'

      if (isMarrow ? !canDonateMarrow : !canDonate) return

      const successToast = {
        messageKey: SUCCESS_TOAST_KEYS[type],
        type: 'success' as const
      }

      bloodBankDonate({ kind: type, successToast })

      closeBloodBank()
    },
    [canDonate, canDonateMarrow, bloodBankDonate, closeBloodBank]
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
