import type { DarkWebLeakConfig } from '../types'
import { useState, useCallback } from 'react'
import { useGameActions, useGameSelector } from '../context/GameState'
import { audioService } from '../utils/audio/audioEngine'
import {
  checkHasLeakedToday,
  validateDarkWebLeak
} from '../utils/darkWebLeakUtils'
import { logger } from '../utils/logger'

/** Tuning values for the dark-web leak social action. */
export const DARK_WEB_LEAK_CONFIG: DarkWebLeakConfig = {
  COST: 500,
  FAME_GAIN: 300,
  ZEALOTRY_GAIN: 25,
  CONTROVERSY_GAIN: 30,
  HARMONY_COST: 20,
  REQUIRED_CONTROVERSY: 40
}

/**
 * Coordinates dark-web leak modal state, validation, and dispatch.
 *
 * @returns Modal state, eligibility flags, action callbacks, and leak tuning constants.
 */
export const useDarkWebLeak = () => {
  const [showDarkWebLeak, setShowDarkWebLeak] = useState(false)
  const player = useGameSelector(state => state.player)
  const band = useGameSelector(state => state.band)
  const social = useGameSelector(state => state.social)
  const { darkWebLeak } = useGameActions()

  const openDarkWebLeak = useCallback(() => setShowDarkWebLeak(true), [])
  const closeDarkWebLeak = useCallback(() => setShowDarkWebLeak(false), [])

  const hasLeakedToday = checkHasLeakedToday(social, player.day)
  let canLeak = false
  try {
    canLeak = validateDarkWebLeak(social, player, band, DARK_WEB_LEAK_CONFIG)
  } catch (error) {
    logger.error(
      'DarkWebLeak',
      'validateDarkWebLeak failed while deriving canLeak',
      {
        error,
        social,
        playerDay: player.day,
        config: DARK_WEB_LEAK_CONFIG
      }
    )
    canLeak = false
  }

  const triggerLeak = useCallback(() => {
    if (!canLeak || checkHasLeakedToday(social, player.day)) return

    audioService.playSFX('cash')

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
