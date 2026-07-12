import { useEffect, useCallback, useRef } from 'react'
import type { PlayerState, Venue, GigModifiers, GameState } from '../types'
import type { RhythmSetlistEntry } from '../types/rhythmGame'
import type { Song } from '../types/audio'
import type { ActiveEffectEntry } from '../types/components'
import type { TranslationCallback } from '../types/callbacks'
import type { AssetModifiers } from '../types/assets'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { MODIFIER_COSTS } from '../utils/economyEngine'

import {
  resetLastMinigameFallback,
  resolveBandMeetingCost
} from './preGig/preGigUtils'
import { usePreGigDerivations } from './preGig/usePreGigDerivations'
import { usePreGigHandlers } from './preGig/usePreGigHandlers'

const isTestRuntime =
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'

/**
 * Internal testing utilities exposed only during test execution.
 *
 * @remarks
 * This export is `undefined` in production. It exposes hidden module state
 * and internal helpers strictly to enable isolated unit testing without modifying
 * production signatures.
 */
export const __testInternals:
  | {
      resetLastMinigameFallback: () => void
      resolveBandMeetingCost: (trainingCostMultiplier: unknown) => number
    }
  | undefined = isTestRuntime
  ? {
      resetLastMinigameFallback,
      resolveBandMeetingCost
    }
  : undefined

/**
 * UI-ready metadata for one pre-gig modifier option.
 */
export type ModifierOption = {
  key: keyof typeof MODIFIER_COSTS
  label: string
  cost: number
  desc: string
}

/**
 * View model and handlers consumed by the pre-gig setup scene.
 */
interface PreGigLogicReturn {
  handleUpdateMerchPrice: (merchKey: string, newPrice: number) => void
  handleRestockMerch: (merchKey: string) => void
  band: GameState['band']

  t: TranslationCallback
  i18n: { language: string }
  currentGig: Venue | null
  player: PlayerState
  setlist: RhythmSetlistEntry[]
  gigModifiers: GigModifiers
  currentModifiers: { activeEffects: ActiveEffectEntry[] }
  assetModifiers: AssetModifiers
  selectedSongIds: Set<string>
  calculatedBudget: number
  isStarting: boolean
  GIG_MODIFIER_OPTIONS: ModifierOption[]
  bandMeetingCost: number
  handleBandMeeting: () => void
  toggleSong: (song: Song) => void
  toggleModifier: (key: keyof typeof MODIFIER_COSTS) => void
  handleStartShow: () => Promise<void>
}

/**
 * Builds pre-gig setup state and actions for setlists, modifiers, merch, and show start.
 * @returns Pre-gig view model and handlers.
 */
export const usePreGigLogic = (): PreGigLogicReturn => {
  const { t, i18n } = useTranslation(['ui', 'venues'])

  const typedT = useCallback<TranslationCallback>(
    (key, options) => t(key, options),
    [t]
  )

  const currentGig = useGameSelector(state => state.currentGig)
  const setlist = useGameSelector(state => state.setlist)
  const gigModifiers = useGameSelector(state => state.gigModifiers)
  const player = useGameSelector(state => state.player)
  const activeEvent = useGameSelector(state => state.activeEvent)
  const band = useGameSelector(state => state.band)
  const assets = useGameSelector(state => state.assets)
  const isScreenshotMode = useGameSelector(state => state.isScreenshotMode)
  const {
    changeScene,
    setSetlist,
    setGigModifiers,
    updatePlayer,
    triggerEvent,
    updateBand,
    addToast,
    startRoadieMinigame,
    startKabelsalatMinigame,
    startAmpCalibration
  } = useGameActions()

  const {
    assetModifiers,
    GIG_MODIFIER_OPTIONS,
    adjustedBandMeetingCost,
    currentModifiers,
    selectedSongIds,
    calculatedBudget
  } = usePreGigDerivations({ band, assets, gigModifiers, setlist, typedT })

  const {
    isStarting,
    handleUpdateMerchPrice,
    handleRestockMerch,
    handleBandMeeting,
    toggleSong,
    toggleModifier,
    handleStartShow
  } = usePreGigHandlers({
    band,
    player,
    currentGig,
    setlist,
    gigModifiers,
    assetModifiers,
    adjustedBandMeetingCost,
    selectedSongIds,
    calculatedBudget,
    typedT,
    updatePlayer,
    updateBand,
    setSetlist,
    setGigModifiers,
    addToast,
    startRoadieMinigame,
    startKabelsalatMinigame,
    startAmpCalibration
  })

  const tRef = useRef<TranslationCallback>(typedT)
  useEffect(() => {
    tRef.current = typedT
  }, [typedT])

  useEffect(() => {
    if (!currentGig) {
      addToast(tRef.current('ui:pregig.toasts.noGig'), 'error')
      changeScene(GAME_PHASES.OVERWORLD)
    }
  }, [currentGig, changeScene, addToast])

  const hasRunRef = useRef(false)
  useEffect(() => {
    if (hasRunRef.current) return
    hasRunRef.current = true
    if (!activeEvent && !isScreenshotMode) {
      const bandEvent = triggerEvent('band', 'pre_gig')
      if (!bandEvent) {
        triggerEvent('gig', 'pre_gig')
      }
    }
  }, [activeEvent, isScreenshotMode, triggerEvent])

  return {
    handleUpdateMerchPrice,
    handleRestockMerch,
    band,
    t: typedT,
    i18n,
    currentGig,
    player,
    setlist,
    gigModifiers,
    currentModifiers,
    assetModifiers,
    selectedSongIds,
    calculatedBudget,
    isStarting,
    GIG_MODIFIER_OPTIONS,
    bandMeetingCost: adjustedBandMeetingCost,
    handleBandMeeting,
    toggleSong,
    toggleModifier,
    handleStartShow
  }
}
