import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { SONGS_DB } from '../data/songs'
import { getGigModifiers } from '../utils/simulationUtils'
import { MODIFIER_COSTS } from '../utils/economyEngine'
import { clampPlayerMoney, clampBandHarmony } from '../utils/gameStateUtils'
import { audioManager } from '../utils/AudioManager'
import { getSongId } from '../utils/audio/songUtils'
import { handleError } from '../utils/errorHandler'
import { getSafeRandom, getSafeUUID } from '../utils/crypto.js'
import { GigModifiersBlock } from '../components/pregig/GigModifiersBlock'
import { SetlistBlock } from '../components/pregig/SetlistBlock'
import { PreGigHeader } from '../components/pregig/PreGigHeader'
import { PreGigStartButton } from '../components/pregig/PreGigStartButton'

let lastMinigameFallback = null

// Exported exclusively for test cleanup
export const _resetLastMinigameFallback = () => {
  lastMinigameFallback = null
}

const BAND_MEETING_COST = 50

const SONGS_DICT = Object.create(null)
for (let i = 0; i < SONGS_DB.length; i++) {
  const song = SONGS_DB[i]
  SONGS_DICT[song.id] = song
}

/**
 * Scene for preparing for a gig: managing budget, setlist, and modifiers.
 */
export const PreGig = () => {
  const { t, i18n } = useTranslation(['ui', 'venues'])

  /**
   * Static options for gig modifiers.
   * Memoized to prevent referential instability in child components.
   * Only depends on `t` so it correctly updates when the user changes language.
   * Modifier costs are loaded from the static `MODIFIER_COSTS` object.
   */
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

  /**
   * Triggers a band meeting event to boost harmony.
   */
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
    // Only trigger events if no event is already active and not in screenshot mode.
    // isScreenshotMode is set in fixtures to prevent random event triggering during tests.
    if (!activeEvent && !isScreenshotMode) {
      const bandEvent = triggerEvent('band', 'pre_gig')
      if (!bandEvent) {
        triggerEvent('gig', 'pre_gig')
      }
    }
    // Intentionally run once on mount
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [])

  /**
   * Toggles a song in the setlist.
   * @param {object} song - The song to toggle.
   */
  const toggleSong = song => {
    if (selectedSongIds.has(song.id)) {
      setSetlist(setlist.filter(s => getSongId(s) !== song.id))
    } else {
      if (setlist.length < 3) {
        // Store only minimal info to save memory/localStorage
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

  /**
   * Toggles a gig modifier (budget item).
   * @param {string} key - The modifier key.
   */
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
      // Safe access for ID
      const gigId = currentGig?.id || `gig_${getSafeUUID()}`

      // Simple streak breaker using sessionStorage with fallback
      let lastMinigame = lastMinigameFallback
      try {
        lastMinigame =
          sessionStorage.getItem('neurotoxic_last_minigame') ||
          lastMinigameFallback
      } catch (_storageErr) {
        // Ignore SecurityError or other storage errors
      }

      let roadieChance = 0.5

      if (lastMinigame === 'roadie') {
        roadieChance = 0.25 // Reduce chance if played last
      } else if (lastMinigame === 'kabelsalat') {
        roadieChance = 0.75 // Increase chance if Kabelsalat played last
      }

      const randomVal = getSafeRandom()

      const chosenGame = randomVal < roadieChance ? 'roadie' : 'kabelsalat'

      lastMinigameFallback = chosenGame
      try {
        sessionStorage.setItem('neurotoxic_last_minigame', chosenGame)
      } catch (_storageErr) {
        // Ignore storage errors, relying on fallback
      }

      if (chosenGame === 'roadie') {
        startRoadieMinigame(gigId)
      } else {
        startKabelsalatMinigame(gigId)
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
    t,
    addToast
  ])

  return (
    <div className='w-full h-full overflow-y-auto flex flex-col items-center justify-start lg:justify-center px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pt-28 sm:pt-32 lg:pt-8 pb-24 lg:pb-8 bg-void-black text-star-white relative'>
      <PreGigHeader
        t={t}
        i18n={i18n}
        currentGig={currentGig}
        player={player}
        calculatedBudget={calculatedBudget}
      />

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full max-w-5xl h-auto lg:h-[58vh] relative z-10'>
        {/* Actions */}
        <GigModifiersBlock
          t={t}
          gigModifierOptions={GIG_MODIFIER_OPTIONS}
          gigModifiers={gigModifiers}
          toggleModifier={toggleModifier}
          handleBandMeeting={handleBandMeeting}
          bandMeetingCost={BAND_MEETING_COST}
          currentModifiers={currentModifiers}
        />

        {/* Setlist */}
        <SetlistBlock
          t={t}
          setlist={setlist}
          songsDb={SONGS_DB}
          songsDict={SONGS_DICT}
          selectedSongIds={selectedSongIds}
          player={player}
          toggleSong={toggleSong}
        />
      </div>

      <PreGigStartButton
        t={t}
        isStarting={isStarting}
        isSetlistEmpty={setlist.length === 0}
        onStartShow={handleStartShow}
      />
    </div>
  )
}
