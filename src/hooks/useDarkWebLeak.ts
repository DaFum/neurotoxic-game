import type { DarkWebLeakConfig } from '../types/game'
import { useState, useCallback } from 'react'
import { useGameState } from '../context/GameState'
import { audioManager } from '../utils/audio/AudioManager'
import {
  checkHasLeakedToday,
  validateDarkWebLeak
} from '../utils/darkWebLeakUtils'

export const DARK_WEB_LEAK_CONFIG: DarkWebLeakConfig = {
  COST: 500,
  FAME_GAIN: 300,
  ZEALOTRY_GAIN: 25,
  CONTROVERSY_GAIN: 30,
  HARMONY_COST: 20,
  REQUIRED_CONTROVERSY: 40
}

export const useDarkWebLeak = () => {
  const [showDarkWebLeak, setShowDarkWebLeak] = useState(false)
  const { player, band, social, darkWebLeak } = useGameState()

  const openDarkWebLeak = useCallback(() => setShowDarkWebLeak(true), [])
  const closeDarkWebLeak = useCallback(() => setShowDarkWebLeak(false), [])

  const hasLeakedToday = checkHasLeakedToday(social, player.day)
  const canLeak = validateDarkWebLeak(
    social,
    player,
    band,
    DARK_WEB_LEAK_CONFIG
  )

  const triggerLeak = useCallback(() => {
    if (!canLeak || checkHasLeakedToday(social, player.day)) return

    audioManager.playSFX('cash')

    darkWebLeak({
      cost: DARK_WEB_LEAK_CONFIG.COST,
      fameGain: DARK_WEB_LEAK_CONFIG.FAME_GAIN,
      zealotryGain: DARK_WEB_LEAK_CONFIG.ZEALOTRY_GAIN,
      controversyGain: DARK_WEB_LEAK_CONFIG.CONTROVERSY_GAIN,
      harmonyCost: DARK_WEB_LEAK_CONFIG.HARMONY_COST,
      successToast: {
        messageKey: 'ui:dark_web_leak.success',
        type: 'success'
      }
    })

    closeDarkWebLeak()
  }, [canLeak, darkWebLeak, closeDarkWebLeak, social, player.day])

  return {
    showDarkWebLeak,
    hasLeakedToday,
    openDarkWebLeak,
    closeDarkWebLeak,
    triggerLeak,
    canLeak,
    DARK_WEB_LEAK_CONFIG
  }
}
