import { useState, useCallback, useRef } from 'react'
import type { GameState, BandState, Venue, GigModifiers } from '../../types'
import type { RhythmSetlistEntry } from '../../types/rhythmGame'
import type { Song } from '../../types/audio'
import type { AssetModifiers } from '../../types/assets'
import type { ToastCallback, TranslationCallback } from '../../types/callbacks'
import { MODIFIER_COSTS, calculateGigModifierCost } from '../../utils/economy'
import { clampBandHarmony, finiteNumberOr } from '../../utils/gameState'
import { resolveMerchRestock } from '../../utils/merchUtils'
import { audioService, getSongId } from '../../utils/audio/audioEngine'
import { handleError } from '../../utils/errorHandler'
import { getSafeRandom, getSafeUUID } from '../../utils/crypto'
import { pickWeighted } from '../../utils/selectionUtils'
import {
  getLastMinigameFallback,
  setLastMinigameFallback,
  isMinigame,
  MINIGAME_CONFIG,
  BAND_MEETING_HARMONY_GAIN
} from './preGigUtils'
import type { Minigame } from './preGigUtils'

/**
 * Input properties for the usePreGigHandlers hook.
 */
export interface UsePreGigHandlersProps {
  band: GameState['band']
  currentGig: Venue | null
  setlist: RhythmSetlistEntry[]
  /** Most songs the setlist may hold. */
  setlistMax: number
  gigModifiers: GigModifiers
  assetModifiers: AssetModifiers
  isExpeditionActive?: boolean
  /** An active run has committed its setlist; the reducer rejects any change. */
  isSetlistFrozen?: boolean
  adjustedBandMeetingCost: number
  /** Cash the player may spend: excludes an active run's protected slice. */
  spendableMoney: number
  selectedSongIds: Set<string>
  calculatedBudget: number
  typedT: TranslationCallback
  holdBandMeeting: () => void
  restockMerch: (merchKey: string) => void
  updateBand: (
    updates: Partial<BandState> | ((band: BandState) => Partial<BandState>)
  ) => void
  setSetlist: (setlist: RhythmSetlistEntry[]) => void
  setGigModifiers: (
    mods:
      Partial<GigModifiers> | ((prev: GigModifiers) => Partial<GigModifiers>)
  ) => void
  addToast: ToastCallback
  startRoadieMinigame: (gigId: string) => void
  startKabelsalatMinigame: (gigId: string) => void
  startAmpCalibration: (gigId: string) => void
}

/**
 * Return value of the usePreGigHandlers hook exposing state, derived values, and executable handlers.
 */
interface UsePreGigHandlersReturn {
  isStarting: boolean
  handleUpdateMerchPrice: (merchKey: string, newPrice: number) => void
  handleRestockMerch: (merchKey: string) => void
  handleBandMeeting: () => void
  canAffordBandMeeting: boolean
  toggleSong: (song: Song) => void
  canAffordModifier: (key: keyof typeof MODIFIER_COSTS) => boolean
  toggleModifier: (key: keyof typeof MODIFIER_COSTS) => void
  handleStartShow: () => Promise<void>
}

/**
 * Encapsulates the UI action handlers during the pre-gig setup phase.
 *
 * @remarks
 * This hook is strictly bound to the Pre-Gig menu lifecycle and does not modify persistent
 * core state directly outside of its provided dispatch callbacks. It orchestrates economy
 * checks, minigame selection weighting, and modifier toggling prior to initiating the gig.
 *
 * @param props - Configuration and state context required for pre-gig actions
 * @returns Exposing state, derived values, and executable handlers
 */
export const usePreGigHandlers = ({
  band,
  currentGig,
  setlist,
  setlistMax,
  gigModifiers,
  assetModifiers,
  isExpeditionActive = false,
  isSetlistFrozen = false,
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
}: UsePreGigHandlersProps): UsePreGigHandlersReturn => {
  const [isStarting, setIsStarting] = useState(false)
  const isStartingRef = useRef(false)

  const handleUpdateMerchPrice = useCallback(
    (merchKey: string, newPrice: number) => {
      updateBand((prevBand: BandState) => ({
        merchPrices: {
          ...(prevBand.merchPrices ?? {}),
          [merchKey]: newPrice
        }
      }))
    },
    [updateBand]
  )

  const handleRestockMerch = useCallback(
    (merchKey: string) => {
      if (isExpeditionActive) return
      const restock = resolveMerchRestock(
        merchKey,
        band?.inventory ?? {},
        assetModifiers
      )
      if (!restock) return

      if (restock.restockAmount <= 0) {
        addToast(typedT('ui:pregig.toasts.merchCapacityFull'), 'error')
        return
      }

      // Spendable cash, not the raw balance, matching the reducer's check.
      if (spendableMoney < restock.cost) {
        addToast(typedT('ui:pregig.toasts.noMoneyUpgrade'), 'error')
        return
      }

      // One action pays and adds the stock, so the debit and the goods land
      // together or not at all.
      restockMerch(merchKey)

      addToast(
        typedT('ui:pregig.toasts.restocked', { defaultValue: 'Restocked!' }),
        'success'
      )
    },
    [
      spendableMoney,
      band?.inventory,
      assetModifiers,
      isExpeditionActive,
      restockMerch,
      addToast,
      typedT
    ]
  )

  // Spendable cash, not the raw balance: during an active run the protected
  // Career slice cannot pay for a meeting, and the reducer refuses it too.
  const canAffordBandMeeting = spendableMoney >= adjustedBandMeetingCost

  const handleBandMeeting = useCallback(() => {
    if (!canAffordBandMeeting) {
      addToast(typedT('ui:pregig.toasts.noMoneySnacks'), 'error')
      return
    }

    const prevHarmony = finiteNumberOr(band?.harmony, 1)
    if (prevHarmony >= 100) {
      addToast(
        typedT('ui:pregig.toasts.meetingHeldMax', {
          defaultValue: 'Harmony already maxed out.'
        }),
        'info'
      )
      return
    }

    // One action pays and restores harmony, so the debit and the reward land
    // together or not at all.
    holdBandMeeting()
    const appliedDelta =
      clampBandHarmony(prevHarmony + BAND_MEETING_HARMONY_GAIN) - prevHarmony

    addToast(
      typedT('ui:pregig.toasts.meetingHeld', { amount: appliedDelta }),
      'success'
    )
  }, [canAffordBandMeeting, addToast, typedT, holdBandMeeting, band?.harmony])

  const toggleSong = useCallback(
    (song: Song) => {
      // The reducer would drop the change silently; skip it here instead.
      if (isSetlistFrozen) return
      if (selectedSongIds.has(song.id)) {
        setSetlist(setlist.filter(s => getSongId(s) !== song.id))
      } else if (setlist.length < setlistMax) {
        setSetlist([...setlist, { id: song.id }])
      }
    },
    [isSetlistFrozen, selectedSongIds, setSetlist, setlist, setlistMax]
  )

  // Single affordability rule for enabling a modifier: the projected budget
  // (current selections plus this one) must fit the spendable cash. Shared by
  // the toggle guard and the button's disabled state. Modifier costs are paid
  // in the post-gig ledger, where the Expedition cash floor refuses a debit
  // into protected Career Cash, so protected cash must not unlock them here.
  const canAffordModifier = useCallback(
    (key: keyof typeof MODIFIER_COSTS) =>
      spendableMoney >=
      calculatedBudget + calculateGigModifierCost(key, assetModifiers),
    [spendableMoney, calculatedBudget, assetModifiers]
  )

  const toggleModifier = useCallback(
    (key: keyof typeof MODIFIER_COSTS) => {
      const isActive = gigModifiers[key]

      if (!isActive && !canAffordModifier(key)) {
        addToast(typedT('ui:pregig.toasts.noMoneyUpgrade'), 'error')
        return
      }

      setGigModifiers({ [key]: !isActive })
    },
    [gigModifiers, canAffordModifier, addToast, setGigModifiers, typedT]
  )

  const handleStartShow = useCallback(async () => {
    if (isStartingRef.current) return
    isStartingRef.current = true
    setIsStarting(true)
    try {
      const audioOk = await audioService.ensureAudioContext()
      if (!audioOk) {
        isStartingRef.current = false
        setIsStarting(false)
        addToast(typedT('ui:pregig.toasts.audioFail'), 'error')
        return
      }
      const gigId = currentGig?.id ?? `gig_${getSafeUUID()}`

      let lastMinigame = getLastMinigameFallback()
      try {
        const sessionValue = sessionStorage.getItem('neurotoxic_last_minigame')
        if (isMinigame(sessionValue)) {
          lastMinigame = sessionValue
        }
      } catch (_storageErr) {
        // Ignore SecurityError or other storage errors
      }

      const weightedGames = (Object.keys(MINIGAME_CONFIG) as Minigame[]).map(
        id => ({
          value: id,
          weight: lastMinigame === id ? 0.2 : MINIGAME_CONFIG[id].weight
        })
      )
      const chosenGame: Minigame =
        pickWeighted(weightedGames, getSafeRandom) ?? 'roadie'

      const chosenConfig = MINIGAME_CONFIG[chosenGame]

      setLastMinigameFallback(chosenConfig.persistenceId as Minigame)
      try {
        sessionStorage.setItem(
          'neurotoxic_last_minigame',
          chosenConfig.persistenceId
        )
      } catch (_storageErr) {
        // ignore storage errors
      }

      chosenConfig.launcher(gigId, {
        startRoadieMinigame,
        startKabelsalatMinigame,
        startAmpCalibration
      })
    } catch (err) {
      isStartingRef.current = false
      setIsStarting(false)
      handleError(err, {
        addToast,
        fallbackMessage: typedT('ui:pregig.toasts.audioFail')
      })
    }
  }, [
    currentGig?.id,
    startRoadieMinigame,
    startKabelsalatMinigame,
    startAmpCalibration,
    typedT,
    addToast
  ])

  return {
    isStarting,
    handleUpdateMerchPrice,
    handleRestockMerch,
    handleBandMeeting,
    canAffordBandMeeting,
    toggleSong,
    canAffordModifier,
    toggleModifier,
    handleStartShow
  }
}
