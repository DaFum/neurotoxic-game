import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  lazy,
  Suspense
} from 'react'
import { useGameState } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { useRhythmGameLogic } from '../hooks/useRhythmGameLogic'
import { useGigEffects } from '../hooks/useGigEffects'
import { useGigInput } from '../hooks/useGigInput'
import { GigHUD } from '../components/GigHUD'

const PixiStage = lazy(() =>
  import('../components/PixiStage').then(m => ({ default: m.PixiStage }))
)
import { IMG_PROMPTS, getGenImageUrl } from '../utils/imageGen.js'
import { audioManager } from '../utils/AudioManager'

import { pauseAudio, resumeAudio, stopAudio } from '../utils/audioEngine'
import { buildGigStatsSnapshot } from '../utils/gigStats'
import { handleError } from '../utils/errorHandler'
import { useTranslation } from 'react-i18next'

import { AudioLockedOverlay } from '../components/minigames/gig/AudioLockedOverlay'
import { BandMembersLayer } from '../components/minigames/gig/BandMembersLayer'
import { PauseOverlay } from '../components/minigames/gig/PauseOverlay'

/**
 * The core Rhythm Game scene.
 * Orchestrates audio, visualizers (PixiJS), and game logic.
 */
export const Gig = () => {
  const { t } = useTranslation()
  const {
    currentGig,
    changeScene,
    addToast,
    activeEvent,
    setActiveEvent,
    setLastGigStats,
    band,
    endGig
  } = useGameState()

  const [isPaused, setIsPaused] = useState(false)
  const hasInteractedRef = useRef(false)

  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])

  useEffect(() => {
    if (!currentGig) {
      addToast(
        tRef.current('ui:pregig.toasts.noGig', {
          defaultValue: 'No gig active! Returning to map.'
        }),
        'error'
      )
      changeScene(GAME_PHASES.OVERWORLD)
    }
  }, [currentGig, changeScene, addToast])

  // Use the extracted logic hook
  const logic = useRhythmGameLogic()
  const { stats, actions, gameStateRef, update } = logic

  // Use extracted effects hook
  const {
    chaosContainerRef,
    chaosStyle,
    triggerBandAnimation,
    setBandMemberRef
  } = useGigEffects(stats)

  // Pause Logic Effect - must be before handlers to follow structure
  useEffect(() => {
    if (!hasInteractedRef.current) {
      if (!isPaused) {
        hasInteractedRef.current = true
        return
      }
      // If starts paused (unlikely) or quick toggle
      pauseAudio()
      addToast(
        tRef.current('ui:gig.paused', { defaultValue: 'PAUSED' }),
        'info'
      )
      // Focus management delegated to Modal or done here if needed
      hasInteractedRef.current = true
      return
    }

    if (isPaused) {
      pauseAudio()
      addToast(
        tRef.current('ui:gig.paused', { defaultValue: 'PAUSED' }),
        'info'
      )
    } else {
      resumeAudio()
      addToast(
        tRef.current('ui:gig.resumed', { defaultValue: 'RESUMED' }),
        'info'
      )
    }
  }, [isPaused, addToast])

  const handleTogglePause = useCallback(() => {
    setIsPaused(prev => !prev)
  }, [])

  const handleQuitGig = useCallback(async () => {
    if (gameStateRef.current) {
      gameStateRef.current.hasSubmittedResults = true
    }
    try {
      stopAudio()
    } catch (e) {
      handleError(e, {
        addToast,
        fallbackMessage: tRef.current('ui:errors.audio_cleanup_failed', {
          defaultValue: 'Audio cleanup failed.'
        })
      })
    } finally {
      // Use fallback stats if gameStateRef is unavailable or uninitialized
      const score = gameStateRef.current?.score || 0
      // Ensure statsSnapshot has defaults to prevent NaN in buildGigStatsSnapshot
      const rawStats = gameStateRef.current?.stats || {}
      const statsSnapshot = {
        perfectHits: rawStats.perfectHits || 0,
        perfects: rawStats.perfects || 0, // Alias if used
        hits: rawStats.hits || 0,
        misses: rawStats.misses || 0,
        earlyHits: rawStats.earlyHits || 0,
        lateHits: rawStats.lateHits || 0,
        maxCombo: rawStats.maxCombo || 0
      }
      const toxicTime = gameStateRef.current?.toxicTimeTotal || 0

      const snapshot = buildGigStatsSnapshot(
        score,
        statsSnapshot,
        toxicTime,
        gameStateRef.current?.songStats || []
      )
      setLastGigStats(snapshot)
      endGig()
    }
  }, [endGig, setLastGigStats, addToast, gameStateRef])

  // Use extracted input hook
  const { handleLaneInput } = useGigInput({
    actions,
    gameStateRef,
    activeEvent,
    setActiveEvent,
    changeScene,
    addToast,
    setLastGigStats,
    triggerBandAnimation,
    onTogglePause: handleTogglePause
  })

  // Determine Background URL
  const bgUrl = useMemo(() => {
    let bgPrompt = IMG_PROMPTS.VENUE_CLUB
    if (currentGig?.name?.includes('Kaminstube'))
      bgPrompt = IMG_PROMPTS.VENUE_KAMINSTUBE
    else if (
      currentGig?.name?.includes('Festival') ||
      currentGig?.name?.includes('Open Air')
    )
      bgPrompt = IMG_PROMPTS.VENUE_FESTIVAL
    else if (currentGig?.diff <= 2) bgPrompt = IMG_PROMPTS.VENUE_DIVE_BAR
    else if (currentGig?.diff >= 5) bgPrompt = IMG_PROMPTS.VENUE_GALACTIC

    return getGenImageUrl(bgPrompt)
  }, [currentGig?.name, currentGig?.diff])

  // Character Images based on Harmony
  const { matzeUrl, mariusUrl, larsUrl } = useMemo(() => {
    let matzePrompt = IMG_PROMPTS.MATZE_PLAYING
    let mariusPrompt = IMG_PROMPTS.MARIUS_PLAYING
    let larsPrompt = IMG_PROMPTS.LARS_PLAYING

    if (band.harmony < 30) {
      matzePrompt = IMG_PROMPTS.MATZE_ANGRY
      mariusPrompt = IMG_PROMPTS.MARIUS_DRINKING
      larsPrompt = IMG_PROMPTS.LARS_IDLE
    } else if (band.harmony < 60) {
      matzePrompt = IMG_PROMPTS.MATZE_ANGRY
      mariusPrompt = IMG_PROMPTS.MARIUS_PLAYING
      larsPrompt = IMG_PROMPTS.LARS_SCREAMING
    }

    return {
      matzeUrl: getGenImageUrl(matzePrompt),
      mariusUrl: getGenImageUrl(mariusPrompt),
      larsUrl: getGenImageUrl(larsPrompt)
    }
  }, [band.harmony])

  // Render blocking overlay if audio is locked (moved here to avoid hook violations)
  if (stats.isAudioReady === false) {
    return (
      <AudioLockedOverlay
        onInitializeAudio={() => {
          audioManager.ensureAudioContext().then(isUnlocked => {
            if (isUnlocked !== false) {
              actions.retryAudioInitialization()
            }
          })
        }}
      />
    )
  }

  return (
    <div
      ref={chaosContainerRef}
      className={`w-full h-full relative bg-void-black flex flex-col overflow-hidden ${stats.isToxicMode ? 'border-4 border-toxic-green' : ''}`}
      style={chaosStyle}
    >
      {/* Layer 0: Background */}
      <div
        className='absolute inset-0 z-0 bg-cover bg-center opacity-50'
        style={{ backgroundImage: `url("${bgUrl}")` }}
      />

      {/* Layer 1: Band Members (DOM) */}
      <BandMembersLayer
        matzeUrl={matzeUrl}
        mariusUrl={mariusUrl}
        larsUrl={larsUrl}
        setBandMemberRef={setBandMemberRef}
      />

      {/* Layer 2: Pixi Canvas (Notes) */}
      <Suspense
        fallback={
          <div className='w-full h-full flex items-center justify-center bg-void-black text-ash-gray text-xl'>
            {t('ui:loading_stage', { defaultValue: 'Loading Stage...' })}
          </div>
        }
      >
        <PixiStage gameStateRef={gameStateRef} update={update} />
      </Suspense>

      {/* Layer 3 & 4: HUD & Inputs */}
      <GigHUD
        stats={stats}
        gameStateRef={gameStateRef}
        onLaneInput={handleLaneInput}
        onTogglePause={handleTogglePause}
      />

      {/* Pause Overlay */}
      <PauseOverlay
        isPaused={isPaused}
        onResume={handleTogglePause}
        onQuit={handleQuitGig}
      />
    </div>
  )
}
