// TODO: Review this file
import { useState, useCallback } from 'react'
import { useGameState } from '../context/GameState'
import { audioManager } from '../utils/AudioManager'

export const PIRATE_RADIO_CONFIG = {
  COST: 200,
  FAME_GAIN: 150,
  ZEALOTRY_GAIN: 15,
  CONTROVERSY_GAIN: 20,
  HARMONY_COST: 10
}

export const usePirateRadio = () => {
  const [showPirateRadio, setShowPirateRadio] = useState(false)
  const { player, band, social, pirateBroadcast } = useGameState()

  const openPirateRadio = useCallback(() => setShowPirateRadio(true), [])
  const closePirateRadio = useCallback(() => setShowPirateRadio(false), [])

  const hasBroadcastedToday = social.lastPirateBroadcastDay === player.day

  const canBroadcast =
    !hasBroadcastedToday &&
    player.money >= PIRATE_RADIO_CONFIG.COST &&
    band.harmony >= PIRATE_RADIO_CONFIG.HARMONY_COST

  const triggerBroadcast = useCallback(() => {
    if (!canBroadcast) return

    audioManager.playSFX('cash')

    pirateBroadcast({
      cost: PIRATE_RADIO_CONFIG.COST,
      fameGain: PIRATE_RADIO_CONFIG.FAME_GAIN,
      zealotryGain: PIRATE_RADIO_CONFIG.ZEALOTRY_GAIN,
      controversyGain: PIRATE_RADIO_CONFIG.CONTROVERSY_GAIN,
      harmonyCost: PIRATE_RADIO_CONFIG.HARMONY_COST,
      successToast: {
        message: 'ui:pirate_radio.success',
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
