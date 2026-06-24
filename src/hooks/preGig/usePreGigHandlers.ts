import { useState, useCallback, useRef } from 'react'
import type { GameState, PlayerState, BandState, Venue, GigModifiers } from '../../types'
import type { RhythmSetlistEntry } from '../../types/rhythmGame'
import type { Song } from '../../types/audio'
import type { AssetModifiers } from '../../types/assets'
import type { TranslationCallback } from '../../types/callbacks'
import type { UpdatePlayerPayload } from '../../types'
import {
  MODIFIER_COSTS,
  calculateGigModifierCost
} from '../../utils/economyEngine'
import {
  clampPlayerMoney,
  clampBandHarmony,
  finiteNumberOr
} from '../../utils/gameState'
import {
  getMerchCapacity,
  resolveMerchRestockCost,
  getMerchBundleAmount,
  getTotalMerchStock
} from '../../utils/merchUtils'
import { audioService, getSongId } from '../../utils/audio/audioEngine'
import { handleError } from '../../utils/errorHandler'
import { getSafeRandom, getSafeUUID } from '../../utils/crypto'
import { HQ_ITEMS_BY_MERCH_KEY } from '../../data/hqItems'
import {
  getLastMinigameFallback,
  setLastMinigameFallback,
  isMinigame
} from './preGigUtils'
import type { Minigame } from './preGigUtils'

export interface UsePreGigHandlersProps {
  band: GameState['band']
  player: PlayerState
  currentGig: Venue | null
  setlist: RhythmSetlistEntry[]
  gigModifiers: GigModifiers
  assetModifiers: AssetModifiers
  adjustedBandMeetingCost: number
  selectedSongIds: Set<string>
  calculatedBudget: number
  typedT: TranslationCallback
  updatePlayer: (updates: UpdatePlayerPayload) => void
  updateBand: (
    updates: Partial<BandState> | ((band: BandState) => Partial<BandState>)
  ) => void
  setSetlist: (setlist: RhythmSetlistEntry[]) => void
  setGigModifiers: (
    mods: Partial<GigModifiers> | ((prev: GigModifiers) => Partial<GigModifiers>)
  ) => void
  addToast: (message: string, type: 'success' | 'error' | 'info') => void
  startRoadieMinigame: (gigId: string) => void
  startKabelsalatMinigame: (gigId: string) => void
  startAmpCalibration: (gigId: string) => void
}

export interface UsePreGigHandlersReturn {
  isStarting: boolean
  handleUpdateMerchPrice: (merchKey: string, newPrice: number) => void
  handleRestockMerch: (merchKey: string) => void
  handleBandMeeting: () => void
  toggleSong: (song: Song) => void
  toggleModifier: (key: keyof typeof MODIFIER_COSTS) => void
  handleStartShow: () => Promise<void>
}

export const usePreGigHandlers = ({
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
}: UsePreGigHandlersProps): UsePreGigHandlersReturn => {
  const [isStarting, setIsStarting] = useState(false)
  const isStartingRef = useRef(false)

  const handleUpdateMerchPrice = useCallback(
    (merchKey: string, newPrice: number) => {
      updateBand((prevBand: BandState) => ({
        ...prevBand,
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
      const itemDef = HQ_ITEMS_BY_MERCH_KEY.get(merchKey)
      if (!itemDef) return

      const bundleAmount = getMerchBundleAmount(itemDef)
      const currentInventory = band.inventory ?? {}
      const merchCapacity = getMerchCapacity(assetModifiers.merchCapacityBonus)
      const remainingCapacity = Math.max(
        0,
        merchCapacity - getTotalMerchStock(currentInventory)
      )

      if (remainingCapacity <= 0) {
        addToast(typedT('ui:pregig.toasts.merchCapacityFull'), 'error')
        return
      }

      const restockAmount = Math.max(
        0,
        Math.min(bundleAmount, remainingCapacity)
      )
      const cost = resolveMerchRestockCost({
        itemCost: itemDef.cost,
        merchCostMultiplier: assetModifiers.merchCostMultiplier,
        restockAmount,
        bundleAmount
      })
      if (player.money < cost) {
        addToast(typedT('ui:pregig.toasts.noMoneyUpgrade'), 'error')
        return
      }

      updatePlayer((prev: PlayerState) => ({
        money: clampPlayerMoney(finiteNumberOr(prev.money, 0) - cost)
      }))

      updateBand((prevBand: BandState) => {
        const currentInventory = prevBand.inventory ?? {}
        const currentAmount =
          typeof currentInventory[merchKey] === 'number'
            ? (currentInventory[merchKey] as number)
            : 0
        return {
          ...prevBand,
          inventory: {
            ...currentInventory,
            [merchKey]: currentAmount + restockAmount
          }
        }
      })

      addToast(
        typedT('ui:pregig.toasts.restocked', { defaultValue: 'Restocked!' }),
        'success'
      )
    },
    [
      player.money,
      band.inventory,
      assetModifiers.merchCapacityBonus,
      assetModifiers.merchCostMultiplier,
      updatePlayer,
      updateBand,
      addToast,
      typedT
    ]
  )

  const handleBandMeeting = useCallback(() => {
    const cost = adjustedBandMeetingCost
    if (player.money < cost) {
      addToast(typedT('ui:pregig.toasts.noMoneySnacks'), 'error')
      return
    }

    const prevHarmony = finiteNumberOr(band.harmony, 1)
    if (prevHarmony >= 100) {
      addToast(
        typedT('ui:pregig.toasts.meetingHeldMax', {
          defaultValue: 'Harmony already maxed out.'
        }),
        'info'
      )
      return
    }

    updatePlayer((prev: PlayerState) => ({
      money: clampPlayerMoney(finiteNumberOr(prev.money, 0) - cost)
    }))
    const newHarmony = clampBandHarmony(prevHarmony + 15)
    const appliedDelta = newHarmony - prevHarmony

    updateBand({ harmony: newHarmony })

    addToast(
      typedT('ui:pregig.toasts.meetingHeld', { amount: appliedDelta }),
      'success'
    )
  }, [
    adjustedBandMeetingCost,
    player.money,
    addToast,
    typedT,
    updatePlayer,
    band.harmony,
    updateBand
  ])

  const toggleSong = useCallback(
    (song: Song) => {
      if (selectedSongIds.has(song.id)) {
        setSetlist(setlist.filter(s => getSongId(s) !== song.id))
      } else if (setlist.length < 3) {
        setSetlist([...setlist, { id: song.id }])
      }
    },
    [selectedSongIds, setSetlist, setlist]
  )

  const toggleModifier = useCallback(
    (key: keyof typeof MODIFIER_COSTS) => {
      const isActive = gigModifiers[key]
      const cost = calculateGigModifierCost(key, assetModifiers)

      if (!isActive) {
        const projectedTotal = calculatedBudget + cost
        if (projectedTotal > player.money) {
          addToast(typedT('ui:pregig.toasts.noMoneyUpgrade'), 'error')
          return
        }
      }

      setGigModifiers({ [key]: !isActive })
    },
    [
      gigModifiers,
      assetModifiers,
      calculatedBudget,
      player.money,
      addToast,
      setGigModifiers,
      typedT
    ]
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

      const weights: Record<Minigame, number> = {
        roadie: 1,
        kabelsalat: 1,
        amp: 1
      }

      if (lastMinigame && Object.hasOwn(weights, lastMinigame)) {
        weights[lastMinigame] = 0.2
      }

      const totalWeight = weights.roadie + weights.kabelsalat + weights.amp
      const randomVal = getSafeRandom() * totalWeight

      let chosenGame: Minigame = 'roadie'
      if (randomVal < weights.roadie) {
        chosenGame = 'roadie'
      } else if (randomVal < weights.roadie + weights.kabelsalat) {
        chosenGame = 'kabelsalat'
      } else {
        chosenGame = 'amp'
      }

      setLastMinigameFallback(chosenGame)
      try {
        sessionStorage.setItem('neurotoxic_last_minigame', chosenGame)
      } catch (_storageErr) {
        // ignore storage errors
      }

      if (chosenGame === 'roadie') {
        startRoadieMinigame(gigId)
      } else if (chosenGame === 'kabelsalat') {
        startKabelsalatMinigame(gigId)
      } else {
        startAmpCalibration(gigId)
      }
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
    toggleSong,
    toggleModifier,
    handleStartShow
  }
}
