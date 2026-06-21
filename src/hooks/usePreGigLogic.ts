import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type {
  PlayerState,
  Venue,
  GigModifiers,
  GameState,
  BandState
} from '../types'
import type { RhythmSetlistEntry } from '../types/rhythmGame'
import type { Song } from '../types/audio'
import type { ActiveEffectEntry } from '../types/components'
import type { TranslationCallback } from '../types/callbacks'
import type { AssetModifiers } from '../types/assets'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import {
  MODIFIER_COSTS,
  calculateGigModifierCost
} from '../utils/economyEngine'
import {
  clampPlayerMoney,
  clampBandHarmony,
  finiteNumberOr
} from '../utils/gameState'
import { getGigModifiers } from '../utils/simulationUtils'
import { getActiveAssetModifiers } from '../utils/assetSelectors'
import {
  getMerchCapacity,
  resolveMerchRestockCost,
  getMerchBundleAmount,
  getTotalMerchStock
} from '../utils/merchUtils'
import { audioService, getSongId } from '../utils/audio/audioEngine'
import { handleError } from '../utils/errorHandler'
import { getSafeRandom, getSafeUUID } from '../utils/crypto'
import { HQ_ITEMS_BY_MERCH_KEY } from '../data/hqItems'

type Minigame = 'roadie' | 'kabelsalat' | 'amp'
let lastMinigameFallback: Minigame | null = null

const isMinigame = (value: unknown): value is Minigame => {
  return value === 'roadie' || value === 'kabelsalat' || value === 'amp'
}

const resetLastMinigameFallback = (): void => {
  lastMinigameFallback = null
}

const BAND_MEETING_COST = 50

const resolveBandMeetingCost = (trainingCostMultiplier: unknown): number => {
  const safeMultiplier = Math.max(0, finiteNumberOr(trainingCostMultiplier, 1))
  return Math.ceil(Math.max(0, BAND_MEETING_COST * safeMultiplier))
}

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
export interface PreGigLogicReturn {
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
  const assetModifiers = useMemo(
    () => getActiveAssetModifiers(assets ?? []),
    [assets]
  )
  const GIG_MODIFIER_OPTIONS = useMemo<ModifierOption[]>(
    () => [
      {
        key: 'soundcheck',
        label: typedT('ui:pregig.modifiers.soundcheck.label'),
        cost: calculateGigModifierCost('soundcheck', assetModifiers),
        desc: typedT('ui:pregig.modifiers.soundcheck.desc')
      },
      {
        key: 'promo',
        label: typedT('ui:pregig.modifiers.promo.label'),
        cost: calculateGigModifierCost('promo', assetModifiers),
        desc: typedT('ui:pregig.modifiers.promo.desc')
      },
      {
        key: 'merch',
        label: typedT('ui:pregig.modifiers.merch.label'),
        cost: calculateGigModifierCost('merch', assetModifiers),
        desc: typedT('ui:pregig.modifiers.merch.desc')
      },
      {
        key: 'catering',
        label: typedT('ui:pregig.modifiers.catering.label'),
        cost: calculateGigModifierCost('catering', assetModifiers),
        desc: typedT('ui:pregig.modifiers.catering.desc')
      },
      {
        key: 'guestlist',
        label: typedT('ui:pregig.modifiers.guestlist.label'),
        cost: calculateGigModifierCost('guestlist', assetModifiers),
        desc: typedT('ui:pregig.modifiers.guestlist.desc')
      }
    ],
    [assetModifiers, typedT]
  )
  const adjustedBandMeetingCost = useMemo(
    () => resolveBandMeetingCost(assetModifiers.trainingCostMultiplier),
    [assetModifiers.trainingCostMultiplier]
  )

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

      updatePlayer({
        money: clampPlayerMoney(finiteNumberOr(player?.money, 0) - cost)
      })

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

  const [isStarting, setIsStarting] = useState(false)
  const isStartingRef = useRef(false)
  const currentModifiers = getGigModifiers(band, gigModifiers)

  const selectedSongIds = useMemo(() => {
    const ids = new Set<string>()
    for (let i = 0; i < setlist.length; i++) {
      const item = setlist[i]
      if (!item) continue
      const id = getSongId(item)
      if (id) ids.add(id)
    }
    return ids
  }, [setlist])

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

    updatePlayer({
      money: clampPlayerMoney(finiteNumberOr(player?.money, 0) - cost)
    })
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

  const calculatedBudget = useMemo(() => {
    let acc = 0
    for (const key in gigModifiers) {
      if (Object.hasOwn(gigModifiers, key) && gigModifiers[key]) {
        acc += calculateGigModifierCost(
          key as keyof typeof MODIFIER_COSTS,
          assetModifiers
        )
      }
    }
    return acc
  }, [assetModifiers, gigModifiers])

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

      let lastMinigame = lastMinigameFallback
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

      lastMinigameFallback = chosenGame
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
