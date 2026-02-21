import { useEffect, useRef, useCallback } from 'react'
import { useGameState } from '../context/GameState'
import { useRhythmGameLogic } from '../hooks/useRhythmGameLogic'
import { PixiStage } from '../components/PixiStage'
import { GigHUD } from '../components/GigHUD'
import { IMG_PROMPTS, getGenImageUrl } from '../utils/imageGen'
import { audioManager } from '../utils/AudioManager'
import { GlitchButton } from '../ui/GlitchButton'
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
    band
  } = useGameState()
  const chaosContainerRef = useRef(null)
  const hasUnlockedAudioRef = useRef(false)
  const bandAnimationsRef = useRef({})

  useEffect(() => {
    if (!currentGig) {
      addToast('No gig active! Returning to map.', 'error')
      changeScene('OVERWORLD')
    }
  }, [currentGig, changeScene, addToast])

  // Use the extracted logic hook
  const logic = useRhythmGameLogic()
  const { stats, actions, gameStateRef } = logic

  /**
   * Triggers a CSS animation on the corresponding band member DOM element.
   * @param {number} laneIndex
   */
  const triggerBandAnimation = useCallback(laneIndex => {
    const memberEl = document.getElementById(`band-member-${laneIndex}`)
    if (memberEl) {
      let anim = bandAnimationsRef.current[laneIndex]

      // Reuse existing animation if valid and attached to same element
      if (anim && anim.effect && anim.effect.target === memberEl) {
        anim.cancel()
        anim.play()
      } else {
        // Create new animation using WAAPI to avoid forced reflows
        anim = memberEl.animate(
          [
            { transform: 'rotate(0deg) scale(1)', offset: 0 },
            { transform: 'rotate(10deg) scale(1.1)', offset: 0.5 },
            { transform: 'rotate(0deg) scale(1)', offset: 1 }
          ],
          {
            duration: 200,
            easing: 'ease',
            iterations: 1
          }
        )
        bandAnimationsRef.current[laneIndex] = anim
      }
    }
  }, [])

  const ensureAudioFromGesture = useCallback(() => {
    if (hasUnlockedAudioRef.current) return
    hasUnlockedAudioRef.current = true
    audioManager.ensureAudioContext()
  }, [])

  // Keyboard Event Handling
  useEffect(() => {
    /**
     * Handles key press events for rhythm inputs and pause menu.
     * @param {KeyboardEvent} e
     */
    const handleKeyDown = e => {
      if (e.repeat) return

      ensureAudioFromGesture()

      if (e.key === 'Escape') {
        if (activeEvent) {
          setActiveEvent(null)
          addToast('Resumed', 'info')
        } else {
          setActiveEvent({
            title: 'PAUSED',
            description: 'Game Paused',
            options: [
              {
                label: 'RESUME',
                action: () => {
                  setActiveEvent(null)
                  addToast('Resuming...', 'info')
                }
              },
              {
                label: 'QUIT GIG',
                variant: 'danger',
                action: async () => {
                  // Manually flag gig as submitted/stopped to prevent multi-song chaining
                  // when stopAudio() triggers onEnded callbacks.
                  gameStateRef.current.hasSubmittedResults = true

                  try {
                    const { stopAudio } = await import('../utils/audioEngine')
                    stopAudio()
                  } catch (audioCleanupError) {
                    handleError(audioCleanupError, {
                      addToast,
                      fallbackMessage: 'Audio cleanup failed during quit.'
                    })
                  } finally {
                    setActiveEvent(null)
                    const snapshot = buildGigStatsSnapshot(
                      gameStateRef.current.score,
                      gameStateRef.current.stats,
                      gameStateRef.current.toxicTimeTotal
                    )
                    setLastGigStats(snapshot)
                    changeScene('POSTGIG')
                  }
                }
              }
            ]
          })
        }
      }

      const laneIndex = gameStateRef.current.lanes.findIndex(
        l => l.key === e.key
      )
      if (laneIndex !== -1) {
        actions.registerInput(laneIndex, true)
        triggerBandAnimation(laneIndex)
      }
    }

    /**
     * Handles key release events to stop input.
     * @param {KeyboardEvent} e
     */
    const handleKeyUp = e => {
      const laneIndex = gameStateRef.current.lanes.findIndex(
        l => l.key === e.key
      )
      if (laneIndex !== -1) {
        actions.registerInput(laneIndex, false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [
    actions,
    gameStateRef,
    activeEvent,
    setActiveEvent,
    changeScene,
    addToast,
    setLastGigStats,
    ensureAudioFromGesture,
    triggerBandAnimation
  ])

  // Touch/Mouse Input Handlers for Columns
  /**
   * Handles touch/mouse down on a lane column.
   * @param {number} laneIndex
   */
  const handleTouchStart = useCallback(
    laneIndex => {
      ensureAudioFromGesture()
      actions.registerInput(laneIndex, true)
      triggerBandAnimation(laneIndex)
    },
    [ensureAudioFromGesture, actions, triggerBandAnimation]
  )

  /**
   * Handles touch/mouse up on a lane column.
   * @param {number} laneIndex
   */
  const handleTouchEnd = useCallback(
    laneIndex => {
      actions.registerInput(laneIndex, false)
    },
    [actions]
  )

  const handleLaneInput = useCallback(
    (index, active) => (active ? handleTouchStart(index) : handleTouchEnd(index)),
    [handleTouchStart, handleTouchEnd]
  )

  // Determine Background URL
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

  const bgUrl = getGenImageUrl(bgPrompt)

  // Character Images based on Harmony
  let matzeImg = IMG_PROMPTS.MATZE_PLAYING
  let larsImg = IMG_PROMPTS.LARS_PLAYING
  let mariusImg = IMG_PROMPTS.MARIUS_PLAYING

  if (band.harmony < 30) {
    matzeImg = IMG_PROMPTS.MATZE_ANGRY
    larsImg = IMG_PROMPTS.LARS_DRINKING
    mariusImg = IMG_PROMPTS.MARIUS_IDLE
  } else if (band.harmony < 60) {
    matzeImg = IMG_PROMPTS.MATZE_ANGRY
    larsImg = IMG_PROMPTS.LARS_PLAYING
    mariusImg = IMG_PROMPTS.MARIUS_SCREAMING
  }

  // Chaos Mode Visuals (Jitter via RAF)
  useEffect(() => {
    let rAF
    const animateChaos = () => {
      if (stats.isToxicMode && chaosContainerRef.current) {
        const x = Math.random() * 4 - 2
        const y = Math.random() * 4 - 2
        chaosContainerRef.current.style.transform = `translate(${x}px, ${y}px)`
      } else if (chaosContainerRef.current) {
        chaosContainerRef.current.style.transform = 'none'
      }
      if (stats.isToxicMode) {
        rAF = requestAnimationFrame(animateChaos)
      }
    }

    if (stats.isToxicMode) {
      rAF = requestAnimationFrame(animateChaos)
    } else if (chaosContainerRef.current) {
      chaosContainerRef.current.style.transform = 'none'
    }

    return () => cancelAnimationFrame(rAF)
  }, [stats.isToxicMode])

  // Chaos Mode Visuals (Filters)
  const chaosStyle = {}
  if (stats.overload > 50) {
    chaosStyle.filter = `saturate(${1 + (stats.overload - 50) / 25})`
  }
  if (stats.overload > 80) {
    // Subtle hue shift based on overload
    chaosStyle.filter =
      (chaosStyle.filter || '') + ` hue-rotate(${stats.overload - 80}deg)`
  }
  if (stats.isToxicMode) {
    // Full Chaos Filter
    chaosStyle.filter = 'invert(0.1) contrast(1.5) saturate(2)'
  }

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
          className='absolute left-[15%] top-[30%] w-32 h-48 transition-transform duration-100'
        >
          <img
            src={getGenImageUrl(matzeImg)}
            alt='Matze'
            className='w-full h-full object-contain filter drop-shadow-[0_0_10px_var(--blood-red)]'
          />
        </div>
        {/* Lars (Drums) - Center Back */}
        <div
          id='band-member-1'
          className='absolute left-[50%] top-[20%] -translate-x-1/2 w-40 h-40 transition-transform duration-100'
        >
          <img
            src={getGenImageUrl(larsImg)}
            alt='Lars'
            className='w-full h-full object-contain filter drop-shadow-[0_0_10px_var(--toxic-green-glow)]'
          />
        </div>
        {/* Marius (Bass) - Right */}
        <div
          id='band-member-2'
          className='absolute right-[15%] top-[30%] w-32 h-48 transition-transform duration-100'
        >
          <img
            src={getGenImageUrl(mariusImg)}
            alt='Marius'
            className='w-full h-full object-contain filter drop-shadow-[0_0_10px_var(--toxic-green)]'
          />
        </div>
      </div>

      {/* Layer 2: Pixi Canvas (Notes) */}
      <PixiStage logic={logic} />

      {/* Layer 3 & 4: HUD & Inputs */}
      <GigHUD
        stats={stats}
        gameStateRef={gameStateRef}
        onLaneInput={handleLaneInput}
      />
    </div>
  )
}
