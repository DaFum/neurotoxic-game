import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useGameState } from '../context/GameState'
import { useRhythmGameLogic } from '../hooks/useRhythmGameLogic'
import { useGigEffects } from '../hooks/useGigEffects'
import { useGigInput } from '../hooks/useGigInput'
import { PixiStage } from '../components/PixiStage'
import { GigHUD } from '../components/GigHUD'
import { IMG_PROMPTS, getGenImageUrl } from '../utils/imageGen'
import { audioManager } from '../utils/AudioManager'
import { GlitchButton } from '../ui/GlitchButton'
import { pauseAudio, resumeAudio, stopAudio } from '../utils/audioEngine'
import { buildGigStatsSnapshot } from '../utils/gigStats'
import { handleError } from '../utils/errorHandler'

/**
 * The core Rhythm Game scene.
 * Orchestrates audio, visualizers (PixiJS), and game logic.
 */
export const Gig = () => {
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

  useEffect(() => {
    if (!currentGig) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      addToast('No gig active! Returning to map.', 'error')
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      changeScene('OVERWORLD')
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
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      addToast('PAUSED', 'info')
      // Focus management delegated to Modal or done here if needed
      hasInteractedRef.current = true
      return
    }

    if (isPaused) {
      pauseAudio()
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      addToast('PAUSED', 'info')
    } else {
      resumeAudio()
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      addToast('RESUMED', 'info')
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
      handleError(e, { addToast, fallbackMessage: 'Audio cleanup failed.' })
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

      const snapshot = buildGigStatsSnapshot(score, statsSnapshot, toxicTime)
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
  const { matzeUrl, MariusUrl, LarsUrl } = useMemo(() => {
    let matzePrompt = IMG_PROMPTS.MATZE_PLAYING
    let MariusPrompt = IMG_PROMPTS.MARIUS_PLAYING
    let LarsPrompt = IMG_PROMPTS.LARS_PLAYING

    if (band.harmony < 30) {
      matzePrompt = IMG_PROMPTS.MATZE_ANGRY
      MariusPrompt = IMG_PROMPTS.MARIUS_DRINKING
      LarsPrompt = IMG_PROMPTS.LARS_IDLE
    } else if (band.harmony < 60) {
      matzePrompt = IMG_PROMPTS.MATZE_ANGRY
      MariusPrompt = IMG_PROMPTS.MARIUS_PLAYING
      LarsPrompt = IMG_PROMPTS.LARS_SCREAMING
    }

    return {
      matzeUrl: getGenImageUrl(matzePrompt),
      MariusUrl: getGenImageUrl(MariusPrompt),
      LarsUrl: getGenImageUrl(LarsPrompt)
    }
  }, [band.harmony])

  // Render blocking overlay if audio is locked (moved here to avoid hook violations)
  if (stats.isAudioReady === false) {
    return (
      <div className='flex flex-col items-center justify-center w-full h-full bg-(--void-black) z-[100] relative'>
        <h2 className="text-4xl text-(--toxic-green) font-['Metal_Mania'] mb-8 animate-pulse text-center">
          SYSTEM LOCKED
        </h2>
        <p className='text-(--ash-gray) mb-8 font-mono max-w-md text-center'>
          Audio Interface requires manual override.
        </p>
        <GlitchButton
          onClick={() => {
            audioManager.ensureAudioContext().then(isUnlocked => {
              if (isUnlocked) {
                actions.retryAudioInitialization()
              }
            })
          }}
          className='scale-150'
        >
          INITIALIZE AUDIO
        </GlitchButton>
      </div>
    )
  }

  return (
    <div
      ref={chaosContainerRef}
      className={`w-full h-full relative bg-(--void-black) flex flex-col overflow-hidden ${stats.isToxicMode ? 'border-4 border-(--toxic-green)' : ''}`}
      style={chaosStyle}
    >
      {/* Layer 0: Background */}
      <div
        className='absolute inset-0 z-0 bg-cover bg-center opacity-50'
        style={{ backgroundImage: `url("${bgUrl}")` }}
      />

      {/* Layer 1: Band Members (DOM) */}
      <div className='absolute inset-0 z-10 pointer-events-none'>
        {/* Matze (Guitar) - Left */}
        <div
          id='band-member-0'
          ref={setBandMemberRef(0)}
          className='absolute left-[15%] top-[30%] w-32 h-48 transition-transform duration-100'
        >
          <img
            src={matzeUrl}
            alt='Matze'
            className='w-full h-full object-contain filter drop-shadow-[0_0_10px_var(--blood-red)]'
          />
        </div>
        {/* Marius (Drums) - Center Back */}
        <div
          id='band-member-1'
          ref={setBandMemberRef(1)}
          className='absolute left-[50%] top-[20%] -translate-x-1/2 w-40 h-40 transition-transform duration-100'
        >
          <img
            src={MariusUrl}
            alt='Marius'
            className='w-full h-full object-contain filter drop-shadow-[0_0_10px_var(--toxic-green-glow)]'
          />
        </div>
        {/* Lars (Bass) - Right */}
        <div
          id='band-member-2'
          ref={setBandMemberRef(2)}
          className='absolute right-[15%] top-[30%] w-32 h-48 transition-transform duration-100'
        >
          <img
            src={LarsUrl}
            alt='Lars'
            className='w-full h-full object-contain filter drop-shadow-[0_0_10px_var(--toxic-green)]'
          />
        </div>
      </div>

      {/* Layer 2: Pixi Canvas (Notes) */}
      <PixiStage gameStateRef={gameStateRef} update={update} />

      {/* Layer 3 & 4: HUD & Inputs */}
      <GigHUD
        stats={stats}
        gameStateRef={gameStateRef}
        onLaneInput={handleLaneInput}
        onTogglePause={handleTogglePause}
      />

      {/* Pause Overlay */}
      {isPaused && (
        <div
          className='absolute inset-0 z-[100] bg-(--void-black)/90 flex flex-col items-center justify-center pointer-events-auto'
          role='dialog'
          aria-modal='true'
        >
          <h2 className='text-6xl font-[var(--font-display)] text-(--toxic-green) mb-8 animate-pulse drop-shadow-[0_0_15px_var(--toxic-green)]'>
            PAUSED
          </h2>
          <div className='flex flex-col gap-6 w-64'>
            <GlitchButton onClick={handleTogglePause}>
              RESUME
            </GlitchButton>
            <GlitchButton onClick={handleQuitGig} variant='danger'>
              QUIT GIG
            </GlitchButton>
          </div>
        </div>
      )}
    </div>
  )
}
