import { useGameSelector } from '../context/GameState'
import { useDisclosure } from './useDisclosure'
import { getExpeditionSpendableCash } from '../domain/expedition/loadout'
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
  // An unreadable state yields undefined so the guarded validation below logs it.
  const spendableCash = useGameSelector(state => {
    try {
      return getExpeditionSpendableCash(state)
    } catch {
      return undefined
    }
  })

  const {
    isOpen: showModal,
    open: openModal,
    close: closeModal
  } = useDisclosure()

  const hasRunToday = hasZealotryActionRunToday(
    social,
    descriptor.dayField,
    player.day
  )

  let canRun = false
  try {
    canRun = validateZealotryAction(
      social,
      player,
      band,
      descriptor,
      spendableCash
    )
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
