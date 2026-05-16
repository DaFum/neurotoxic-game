import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { PlayerState, Venue, GigModifiers, GameState } from '../types'
import type { RhythmSetlistEntry } from '../types/rhythmGame'
import type { Song } from '../types/audio'
import type { ActiveEffectEntry } from '../types/components'
import type { TranslationCallback } from '../types/callbacks'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { MODIFIER_COSTS } from '../utils/economyEngine'
import { clampPlayerMoney, clampBandHarmony } from '../utils/gameStateUtils'
import { getGigModifiers } from '../utils/simulationUtils'
import { audioService } from '../utils/audio/audioEngine'
import { getSongId } from '../utils/audio/songUtils'
import { handleError } from '../utils/errorHandler'
import { getSafeRandom, getSafeUUID } from '../utils/crypto'
import { HQ_ITEMS } from '../data/hqItems'

type Minigame = 'roadie' | 'kabelsalat' | 'amp'
let lastMinigameFallback: Minigame | null = null

// Exported exclusively for test cleanup

const isMinigame = (value: unknown): value is Minigame => {
  return value === 'roadie' || value === 'kabelsalat' || value === 'amp'
}

export const _resetLastMinigameFallback = () => {
  lastMinigameFallback = null
}

const BAND_MEETING_COST = 50

export type ModifierOption = {
  key: keyof typeof MODIFIER_COSTS
  label: string
  cost: number
  desc: string
}

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
  selectedSongIds: Set<string>
  calculatedBudget: number
  isStarting: boolean
  GIG_MODIFIER_OPTIONS: ModifierOption[]
  BAND_MEETING_COST: number
  handleBandMeeting: () => void
  toggleSong: (song: Song) => void
  toggleModifier: (key: keyof typeof MODIFIER_COSTS) => void
  handleStartShow: () => Promise<void>
}

export const usePreGigLogic = (): PreGigLogicReturn => {
  const { t, i18n } = useTranslation(['ui', 'venues'])

  const typedT = useCallback<TranslationCallback>(
    (key, options) => t(key, options),
    [t]
  )

  const GIG_MODIFIER_OPTIONS = useMemo<ModifierOption[]>(
    () => [
      {
        key: 'soundcheck',
        label: typedT('ui:pregig.modifiers.soundcheck.label'),
        cost: MODIFIER_COSTS.soundcheck,
        desc: typedT('ui:pregig.modifiers.soundcheck.desc')
      },
      {
        key: 'promo',
        label: typedT('ui:pregig.modifiers.promo.label'),
        cost: MODIFIER_COSTS.promo,
        desc: typedT('ui:pregig.modifiers.promo.desc')
      },
      {
        key: 'merch',
        label: typedT('ui:pregig.modifiers.merch.label'),
        cost: MODIFIER_COSTS.merch,
        desc: typedT('ui:pregig.modifiers.merch.desc')
      },
      {
        key: 'catering',
        label: typedT('ui:pregig.modifiers.catering.label'),
        cost: MODIFIER_COSTS.catering,
        desc: typedT('ui:pregig.modifiers.catering.desc')
      },
      {
        key: 'guestlist',
        label: typedT('ui:pregig.modifiers.guestlist.label'),
        cost: MODIFIER_COSTS.guestlist,
        desc: typedT('ui:pregig.modifiers.guestlist.desc')
      }
    ],
    [typedT]
  )

  const {
    currentGig,
    changeScene,
    setSetlist,
    setlist,
    gigModifiers,
    setGigModifiers,
    player,
    updatePlayer,
    triggerEvent,
    activeEvent,
    band,
    updateBand,
    addToast,
    startRoadieMinigame,
    startKabelsalatMinigame,
    startAmpCalibration,
    isScreenshotMode
  } = useGameState()

  const handleUpdateMerchPrice = useCallback(
    (merchKey: string, newPrice: number) => {
      updateBand(prevBand => ({
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
      const itemDef = Object.values(HQ_ITEMS)
        .flat()
        .find(
          item =>
            typeof item.effect === 'object' &&
            item.effect !== null &&
            Object.hasOwn(item.effect, 'item') &&
            (item.effect as { item?: unknown }).item === merchKey
        )
      if (!itemDef) return

      const cost = itemDef.cost
      if (player.money < cost) {
        addToast(typedT('ui:pregig.toasts.noMoneyUpgrade'), 'error')
        return
      }

      updatePlayer({ money: clampPlayerMoney(player.money - cost) })

      updateBand(prevBand => {
        const currentInventory = prevBand.inventory ?? {}
        const currentAmount =
          typeof currentInventory[merchKey] === 'number'
            ? (currentInventory[merchKey] as number)
            : 0
        return {
          ...prevBand,
          inventory: {
            ...currentInventory,
            [merchKey]:
              currentAmount +
              (typeof itemDef.effect?.value === 'number'
                ? itemDef.effect.value
                : 10)
          }
        }
      })

      addToast(
        typedT('ui:pregig.toasts.restocked', { defaultValue: 'Restocked!' }),
        'success'
      )
    },
    [player.money, updatePlayer, updateBand, addToast, typedT]
  )

  const [isStarting, setIsStarting] = useState(false)
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
    const cost = BAND_MEETING_COST
    if (player.money < cost) {
      addToast(typedT('ui:pregig.toasts.noMoneySnacks'), 'error')
      return
    }

    const prevHarmony = band.harmony ?? 1
    if (prevHarmony >= 100) {
      addToast(
        typedT('ui:pregig.toasts.meetingHeldMax', {
          defaultValue: 'Harmony already maxed out.'
        }),
        'info'
      )
      return
    }

    updatePlayer({ money: clampPlayerMoney(player.money - cost) })
    const newHarmony = clampBandHarmony(prevHarmony + 15)
    const appliedDelta = newHarmony - prevHarmony

    updateBand({ harmony: newHarmony })

    addToast(
      typedT('ui:pregig.toasts.meetingHeld', { amount: appliedDelta }),
      'success'
    )
  }, [player.money, addToast, typedT, updatePlayer, band.harmony, updateBand])

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
      } else {
        if (setlist.length < 3) {
          setSetlist([...setlist, { id: song.id }])
        }
      }
    },
    [selectedSongIds, setSetlist, setlist]
  )

  const calculatedBudget = useMemo(() => {
    let acc = 0
    for (const key in gigModifiers) {
      if (Object.hasOwn(gigModifiers, key) && gigModifiers[key]) {
        acc += MODIFIER_COSTS[key as keyof typeof MODIFIER_COSTS] ?? 0
      }
    }
    return acc
  }, [gigModifiers])

  const toggleModifier = useCallback(
    (key: keyof typeof MODIFIER_COSTS) => {
      const isActive = gigModifiers[key]
      const cost = MODIFIER_COSTS[key] ?? 0

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
      calculatedBudget,
      player.money,
      addToast,
      setGigModifiers,
      typedT
    ]
  )

  const handleStartShow = useCallback(async () => {
    setIsStarting(true)
    try {
      const audioOk = await audioService.ensureAudioContext()
      if (!audioOk) {
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
    selectedSongIds,
    calculatedBudget,
    isStarting,
    GIG_MODIFIER_OPTIONS,
    BAND_MEETING_COST,
    handleBandMeeting,
    toggleSong,
    toggleModifier,
    handleStartShow
  }
}
