import { useState, useCallback } from 'react'
import { useGameActions, useGameSelector } from '../context/GameState'
import { audioService } from '../utils/audio/audioEngine'
import {
  checkHasBroadcastedToday,
  validatePirateBroadcast
} from '../utils/pirateRadioUtils'
import { logger } from '../utils/logger'

/** Tuning values for the pirate-radio social action. */
export const PIRATE_RADIO_CONFIG = {
  COST: 200,
  FAME_GAIN: 150,
  ZEALOTRY_GAIN: 15,
  CONTROVERSY_GAIN: 20,
  HARMONY_COST: 10
}

/**
 * Coordinates pirate-radio modal state, validation, and dispatch.
 *
 * @returns Modal state, eligibility flags, action callbacks, and pirate-radio tuning constants.
 */
export const usePirateRadio = () => {
  const [showPirateRadio, setShowPirateRadio] = useState(false)
  const player = useGameSelector(state => state.player)
  const band = useGameSelector(state => state.band)
  const social = useGameSelector(state => state.social)
  const { pirateBroadcast } = useGameActions()

  const openPirateRadio = useCallback(() => setShowPirateRadio(true), [])
  const closePirateRadio = useCallback(() => setShowPirateRadio(false), [])

  const hasBroadcastedToday = checkHasBroadcastedToday(social, player.day)
  let canBroadcast = false
  try {
    canBroadcast = validatePirateBroadcast(
      social,
      player,
      band,
      PIRATE_RADIO_CONFIG
    )
  } catch (error) {
    logger.error(
      'PirateRadio',
      'validatePirateBroadcast failed while deriving canBroadcast',
      {
        error,
        social,
        playerDay: player.day,
        config: PIRATE_RADIO_CONFIG
      }
    )
    canBroadcast = false
  }

  const triggerBroadcast = useCallback(() => {
    if (!canBroadcast) return

    audioService.playSFX('cash')

    pirateBroadcast({
      cost: PIRATE_RADIO_CONFIG.COST,
      fameGain: PIRATE_RADIO_CONFIG.FAME_GAIN,
      zealotryGain: PIRATE_RADIO_CONFIG.ZEALOTRY_GAIN,
      controversyGain: PIRATE_RADIO_CONFIG.CONTROVERSY_GAIN,
      harmonyCost: PIRATE_RADIO_CONFIG.HARMONY_COST,
      successToast: {
        messageKey: 'ui:pirate_radio.success',
        type: 'success'
      }
    })

    closePirateRadio()
  }, [canBroadcast, pirateBroadcast, closePirateRadio])

  return {
    showPirateRadio,
    hasBroadcastedToday,
    openPirateRadio,
    closePirateRadio,
    triggerBroadcast,
    canBroadcast,
    PIRATE_RADIO_CONFIG
  }
}
