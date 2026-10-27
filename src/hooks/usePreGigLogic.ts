import { useEffect, useCallback, useRef, useMemo } from 'react'
import type { PlayerState, Venue, GigModifiers, GameState } from '../types'
import type { RhythmSetlistEntry } from '../types/rhythmGame'
import type { Song } from '../types/audio'
import type { ActiveEffectEntry } from '../types/components'
import type { TranslationCallback } from '../types/callbacks'
import type { AssetModifiers } from '../types/assets'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { MODIFIER_COSTS } from '../utils/economy'

import { canStartExpeditionPreGig } from '../domain/expedition/condition'
import { isExpeditionCommitmentFrozen } from '../domain/expedition/buildCommitment'
import { getExpeditionSpendableCash } from '../domain/expedition/spendableCash'
import { EXPEDITION_MAX_SETLIST_SONGS } from '../domain/expedition/loadout'
import { resolveActiveExpeditionCargo } from '../domain/expedition/cargo'
import { usePreGigDerivations } from './preGig/usePreGigDerivations'
import { usePreGigHandlers } from './preGig/usePreGigHandlers'

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
  merchInventory: Record<string, unknown>
  isExpeditionActive: boolean
  /** An active run has committed its setlist, so song toggles are inert. */
  isSetlistFrozen: boolean

  t: TranslationCallback
  i18n: { language: string }
  currentGig: Venue | null
  player: PlayerState
  setlist: RhythmSetlistEntry[]
  /** Songs the setlist may hold: the committed Expedition set, else three. */
  setlistMax: number
  gigModifiers: GigModifiers
  currentModifiers: { activeEffects: ActiveEffectEntry[] }
  assetModifiers: AssetModifiers
  selectedSongIds: Set<string>
  calculatedBudget: number
  isStarting: boolean
  isStartBlocked: boolean
  GIG_MODIFIER_OPTIONS: ModifierOption[]
  bandMeetingCost: number
  handleBandMeeting: () => void
  /** Whether spendable cash (never protected run cash) covers a meeting. */
  canAffordBandMeeting: boolean
  toggleSong: (song: Song) => void
  canAffordModifier: (key: keyof typeof MODIFIER_COSTS) => boolean
  toggleModifier: (key: keyof typeof MODIFIER_COSTS) => void
  handleStartShow: () => Promise<void>
}

const CAREER_MAX_SETLIST_SONGS = 3

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
  const spendableMoney = useGameSelector(getExpeditionSpendableCash)
  const activeEvent = useGameSelector(state => state.activeEvent)
  const band = useGameSelector(state => state.band)
  const assets = useGameSelector(state => state.assets)
  const isScreenshotMode = useGameSelector(state => state.isScreenshotMode)
  const expedition = useGameSelector(state => state.expedition)
  const isExpeditionActive = expedition?.status === 'active'
  const merchInventory = useMemo(() => {
    if (!isExpeditionActive) return band?.inventory ?? {}
    return Object.fromEntries(
      (resolveActiveExpeditionCargo({ expedition })?.merch ?? []).map(
        ({ inventoryKey, quantity }) => [inventoryKey, quantity]
      )
    )
  }, [band?.inventory, expedition, isExpeditionActive])
  // ⚡ BOLT OPTIMIZATION: Eliminate root GameState selector subscription.
  // Why: Subscribing to full GameState via `state => state` causes the pre-gig scene to re-render on EVERY state update across the entire app (ticks, toasts, chatter).
  // Impact: Prevents unnecessary component re-renders when unrelated store slices update during pre-gig setup.
  const expeditionState = useMemo(
    () => ({ band, expedition }),
    [band, expedition]
  )
  const canStartShow = useGameSelector(canStartExpeditionPreGig)
  const isSetlistFrozen = useGameSelector(isExpeditionCommitmentFrozen)
  const setlistMax =
    expedition?.status === 'active'
      ? EXPEDITION_MAX_SETLIST_SONGS
      : CAREER_MAX_SETLIST_SONGS
  const {
    changeScene,
    setSetlist,
    setGigModifiers,
    holdBandMeeting,
    restockMerch,
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
    calculatedBudget,
    isStartBlocked
  } = usePreGigDerivations({
    band,
    assets,
    gigModifiers,
    setlist,
    typedT,
    canStartShow,
    expeditionState
  })

  const {
    isStarting,
    handleUpdateMerchPrice,
    handleRestockMerch,
    handleBandMeeting,
    canAffordBandMeeting,
    toggleSong,
    canAffordModifier,
    toggleModifier,
    handleStartShow
  } = usePreGigHandlers({
    band,
    currentGig,
    setlist,
    setlistMax,
    gigModifiers,
    assetModifiers,
    isExpeditionActive,
    isSetlistFrozen,
    adjustedBandMeetingCost,
    spendableMoney,
    selectedSongIds,
    calculatedBudget,
    typedT,
    holdBandMeeting,
    restockMerch,
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
    merchInventory,
    isExpeditionActive,
    isSetlistFrozen,
    t: typedT,
    i18n,
    currentGig,
    player,
    setlist,
    setlistMax,
    gigModifiers,
    currentModifiers,
    assetModifiers,
    selectedSongIds,
    calculatedBudget,
    isStarting,
    isStartBlocked,
    GIG_MODIFIER_OPTIONS,
    bandMeetingCost: adjustedBandMeetingCost,
    handleBandMeeting,
    canAffordBandMeeting,
    toggleSong,
    canAffordModifier,
    toggleModifier,
    handleStartShow
  }
}
