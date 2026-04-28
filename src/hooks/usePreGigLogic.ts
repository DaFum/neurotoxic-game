import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { TFunction } from 'react-i18next'
import type { PlayerState, Venue, GigModifiers } from '../types/game'
import type { RhythmSetlistEntry, Song } from '../types/rhythmGame'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { MODIFIER_COSTS } from '../utils/economyEngine'
import { clampPlayerMoney, clampBandHarmony } from '../utils/gameStateUtils'
import { getGigModifiers } from '../utils/simulationUtils'
import { audioManager } from '../utils/AudioManager'
import { getSongId } from '../utils/audio/songUtils'
import { handleError } from '../utils/errorHandler'
import { getSafeRandom, getSafeUUID } from '../utils/crypto'

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
  t: (key: string, options?: unknown) => string
  i18n: { language: string }
  currentGig: Venue | null
  player: PlayerState
  setlist: RhythmSetlistEntry[]
  gigModifiers: GigModifiers
  currentModifiers: { activeEffects: Record<string, unknown>[] }
  selectedSongIds: Set<unknown>
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

  const GIG_MODIFIER_OPTIONS = useMemo<ModifierOption[]>(
    () => [
      {
        key: 'soundcheck',
        label: t('ui:pregig.modifiers.soundcheck.label'),
        cost: MODIFIER_COSTS.soundcheck,
        desc: t('ui:pregig.modifiers.soundcheck.desc')
      },
      {
        key: 'promo',
        label: t('ui:pregig.modifiers.promo.label'),
        cost: MODIFIER_COSTS.promo,
        desc: t('ui:pregig.modifiers.promo.desc')
      },
      {
        key: 'merch',
        label: t('ui:pregig.modifiers.merch.label'),
        cost: MODIFIER_COSTS.merch,
        desc: t('ui:pregig.modifiers.merch.desc')
      },
      {
        key: 'catering',
        label: t('ui:pregig.modifiers.catering.label'),
        cost: MODIFIER_COSTS.catering,
        desc: t('ui:pregig.modifiers.catering.desc')
      },
      {
        key: 'guestlist',
        label: t('ui:pregig.modifiers.guestlist.label'),
        cost: MODIFIER_COSTS.guestlist,
        desc: t('ui:pregig.modifiers.guestlist.desc')
      }
    ],
    [t]
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

  const [isStarting, setIsStarting] = useState(false)
  const currentModifiers = getGigModifiers(band, gigModifiers)

  const selectedSongIds = useMemo(() => {
    const ids = new Set()
    for (let i = 0; i < setlist.length; i++) {
      ids.add(getSongId(setlist[i]))
    }
    return ids
  }, [setlist])

  const tRef = useRef<TFunction>(t)
  useEffect(() => {
    tRef.current = t
  }, [t])

  useEffect(() => {
    if (!currentGig) {
      addToast(tRef.current('ui:pregig.toasts.noGig'), 'error')
      changeScene(GAME_PHASES.OVERWORLD)
    }
  }, [currentGig, changeScene, addToast])

  const handleBandMeeting = useCallback(() => {
    const cost = BAND_MEETING_COST
    if (player.money < cost) {
      addToast(t('ui:pregig.toasts.noMoneySnacks'), 'error')
      return
    }

    const prevHarmony = band.harmony ?? 1
    if (prevHarmony >= 100) {
      addToast(
        t('ui:pregig.toasts.meetingHeldMax', {
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
      t('ui:pregig.toasts.meetingHeld', { amount: appliedDelta }),
      'success'
    )
  }, [player.money, addToast, t, updatePlayer, band.harmony, updateBand])

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
          addToast(t('ui:pregig.toasts.noMoneyUpgrade'), 'error')
          return
        }
      }

      setGigModifiers({ [key]: !isActive })
    },
    [gigModifiers, calculatedBudget, player.money, addToast, setGigModifiers, t]
  )

  const handleStartShow = useCallback(async () => {
    setIsStarting(true)
    try {
      const audioOk = await audioManager.ensureAudioContext()
      if (!audioOk) {
        setIsStarting(false)
        addToast(t('ui:pregig.toasts.audioFail'), 'error')
        return
      }
      const gigId = currentGig?.id || `gig_${getSafeUUID()}`

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
        fallbackMessage: t('ui:pregig.toasts.audioFail')
      })
    }
  }, [
    currentGig?.id,
    startRoadieMinigame,
    startKabelsalatMinigame,
    startAmpCalibration,
    t,
    addToast
  ])

  return {
    t,
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
