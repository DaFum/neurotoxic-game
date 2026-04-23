import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { SONGS_DB } from '../data/songs'
import { MODIFIER_COSTS } from '../utils/economyEngine'
import { clampPlayerMoney, clampBandHarmony } from '../utils/gameStateUtils'
import { getGigModifiers } from '../utils/simulationUtils'
import { audioManager } from '../utils/AudioManager'
import { getSongId } from '../utils/audio/songUtils'
import { handleError } from '../utils/errorHandler'
import { getSafeRandom, getSafeUUID } from '../utils/crypto'

let lastMinigameFallback = null

// Exported exclusively for test cleanup
export const _resetLastMinigameFallback = () => {
  lastMinigameFallback = null
}

const BAND_MEETING_COST = 50

export const usePreGigLogic = () => {
  const { t, i18n } = useTranslation(['ui', 'venues'])

  const GIG_MODIFIER_OPTIONS = useMemo(
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

  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])

  useEffect(() => {
    if (!currentGig) {
      addToast(tRef.current('ui:pregig.toasts.noGig'), 'error')
      changeScene(GAME_PHASES.OVERWORLD)
    }
  }, [currentGig, changeScene, addToast])

  const handleBandMeeting = () => {
    const cost = BAND_MEETING_COST
    if (player.money < cost) {
      addToast(t('ui:pregig.toasts.noMoneySnacks'), 'error')
      return
    }

    updatePlayer({ money: clampPlayerMoney(player.money - cost) })
    const prevHarmony = band.harmony || 1
    const newHarmony = clampBandHarmony(prevHarmony + 15)
    const appliedDelta = newHarmony - prevHarmony

    updateBand({ harmony: newHarmony })

    if (appliedDelta > 0) {
      addToast(
        t('ui:pregig.toasts.meetingHeld', { amount: appliedDelta }),
        'success'
      )
    } else {
      addToast(
        t('ui:pregig.toasts.meetingHeldMax', {
          defaultValue: 'Harmony already maxed out.'
        }),
        'info'
      )
    }
  }

  useEffect(() => {
    if (!activeEvent && !isScreenshotMode) {
      const bandEvent = triggerEvent('band', 'pre_gig')
      if (!bandEvent) {
        triggerEvent('gig', 'pre_gig')
      }
    }
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [])

  const toggleSong = song => {
    if (selectedSongIds.has(song.id)) {
      setSetlist(setlist.filter(s => getSongId(s) !== song.id))
    } else {
      if (setlist.length < 3) {
        setSetlist([...setlist, { id: song.id }])
      }
    }
  }

  const calculatedBudget = useMemo(() => {
    let acc = 0
    for (const key in gigModifiers) {
      if (Object.hasOwn(gigModifiers, key) && gigModifiers[key]) {
        acc += MODIFIER_COSTS[key] || 0
      }
    }
    return acc
  }, [gigModifiers])

  const toggleModifier = useCallback(
    key => {
      const isActive = gigModifiers[key]
      const cost = MODIFIER_COSTS[key] || 0

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
      await audioManager.ensureAudioContext()
      const gigId = currentGig?.id || `gig_${getSafeUUID()}`

      let lastMinigame = lastMinigameFallback
      try {
        lastMinigame =
          sessionStorage.getItem('neurotoxic_last_minigame') ||
          lastMinigameFallback
      } catch (_storageErr) {
        // Ignore SecurityError or other storage errors
      }

      let weights = {
        roadie: 1,
        kabelsalat: 1,
        amp: 1
      }

      if (lastMinigame && weights[lastMinigame] !== undefined) {
        weights[lastMinigame] = 0.2
      }

      const totalWeight = weights.roadie + weights.kabelsalat + weights.amp
      const randomVal = getSafeRandom() * totalWeight

      let chosenGame = 'roadie'
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
