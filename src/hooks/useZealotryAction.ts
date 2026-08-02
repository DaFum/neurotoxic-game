import { useCallback, useState } from 'react'
import { useGameSelector } from '../context/GameState'
import { audioService } from '../utils/audio/audioEngine'
import { logger } from '../utils/logger'
import {
  hasZealotryActionRunToday,
  validateZealotryAction,
  type ZealotryActionDescriptor
} from '../utils/dailySocialActionUtils'
import type { ZealotryActionPayload } from '../types'

/**
 * Drives modal state, eligibility, and dispatch for one once-per-day zealotry
 * social action (pirate broadcast, dark-web leak, cult indoctrination).
 *
 * @param descriptor - Static description of the action.
 * @param dispatchAction - Bound action creator that resolves the action.
 * @returns Modal state, eligibility flags, and the trigger/open/close callbacks.
 */
export const useZealotryAction = (
  descriptor: ZealotryActionDescriptor,
  dispatchAction: (payload: ZealotryActionPayload) => void
) => {
  const player = useGameSelector(state => state.player)
  const band = useGameSelector(state => state.band)
  const social = useGameSelector(state => state.social)

  const [showModal, setShowModal] = useState(false)
  const openModal = useCallback(() => setShowModal(true), [])
  const closeModal = useCallback(() => setShowModal(false), [])

  const hasRunToday = hasZealotryActionRunToday(
    social,
    descriptor.dayField,
    player.day
  )

  let canRun = false
  try {
    canRun = validateZealotryAction(social, player, band, descriptor)
  } catch (error) {
    logger.error(descriptor.loggerScope, descriptor.validationFailureMessage, {
      error,
      config: descriptor.config
    })
  }

  const trigger = () => {
    if (!canRun || hasRunToday) return

    audioService.playSFX('cash')
    dispatchAction({
      cost: descriptor.config.COST,
      fameGain: descriptor.config.FAME_GAIN,
      zealotryGain: descriptor.config.ZEALOTRY_GAIN,
      controversyGain: descriptor.config.CONTROVERSY_GAIN,
      harmonyCost: descriptor.config.HARMONY_COST,
      successToast: {
        messageKey: descriptor.successMessageKey,
        type: 'success'
      }
    })
    closeModal()
  }

  return {
    showModal,
    hasRunToday,
    openModal,
    closeModal,
    trigger,
    canRun
  }
}
