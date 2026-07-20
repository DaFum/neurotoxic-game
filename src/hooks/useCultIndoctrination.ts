import type { CultIndoctrinationConfig } from '../types'
import { useState, useCallback } from 'react'
import { useGameActions, useGameSelector } from '../context/GameState'
import { audioService } from '../utils/audio/audioEngine'
import {
  checkHasIndoctrinatedToday,
  validateCultIndoctrination
} from '../utils/cultIndoctrinationUtils'
import { logger } from '../utils/logger'

/** Tuning values for the cult indoctrination social action. */
export const CULT_INDOCTRINATION_CONFIG = {
  COST: 1000,
  FAME_GAIN: 500,
  ZEALOTRY_GAIN: 40,
  CONTROVERSY_GAIN: 50,
  HARMONY_COST: 30,
  REQUIRED_ZEALOTRY: 50
} as const satisfies CultIndoctrinationConfig

/**
 * Coordinates cult indoctrination modal state, validation, and dispatch.
 *
 * @returns Modal state, eligibility flags, action callbacks, and indoctrination tuning constants.
 */
export const useCultIndoctrination = () => {
  const [showCultIndoctrination, setShowCultIndoctrination] = useState(false)
  const player = useGameSelector(state => state.player)
  const band = useGameSelector(state => state.band)
  const social = useGameSelector(state => state.social)
  const { cultIndoctrination } = useGameActions()

  const openCultIndoctrination = useCallback(() => setShowCultIndoctrination(true), [])
  const closeCultIndoctrination = useCallback(() => setShowCultIndoctrination(false), [])

  const hasIndoctrinatedToday = checkHasIndoctrinatedToday(social, player.day)
  const canIndoctrinate = validateCultIndoctrination(social, player, band, CULT_INDOCTRINATION_CONFIG)

  const triggerIndoctrination = useCallback(() => {
    if (!canIndoctrinate || checkHasIndoctrinatedToday(social, player.day)) return

    audioService.playSFX('cash')

    cultIndoctrination({
      cost: CULT_INDOCTRINATION_CONFIG.COST,
      fameGain: CULT_INDOCTRINATION_CONFIG.FAME_GAIN,
      zealotryGain: CULT_INDOCTRINATION_CONFIG.ZEALOTRY_GAIN,
      controversyGain: CULT_INDOCTRINATION_CONFIG.CONTROVERSY_GAIN,
      harmonyCost: CULT_INDOCTRINATION_CONFIG.HARMONY_COST,
      successToast: {
        messageKey: 'ui:cult_indoctrination.success',
        type: 'success'
      }
    })

    closeCultIndoctrination()
  }, [canIndoctrinate, cultIndoctrination, closeCultIndoctrination, social, player.day])

  return {
    showCultIndoctrination,
    hasIndoctrinatedToday,
    openCultIndoctrination,
    closeCultIndoctrination,
    triggerIndoctrination,
    canIndoctrinate,
    CULT_INDOCTRINATION_CONFIG
  }
}
