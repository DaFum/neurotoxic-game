import React, { useEffect } from 'react'
import { useGameState } from '../context/GameState'
import { useRhythmGameLogic } from '../hooks/useRhythmGameLogic'
import { PixiStage } from '../components/PixiStage'
import { GigHUD } from '../components/GigHUD'
import { IMG_PROMPTS, getGenImageUrl } from '../utils/imageGen'

/**
 * The core Rhythm Game scene.
 * Orchestrates audio, visualizers (PixiJS), and game logic.
 */
export const Gig = () => {
  const { currentGig, changeScene, addToast, activeEvent, setActiveEvent } =
    useGameState()

  React.useEffect(() => {
    if (!currentGig) {
      addToast('No gig active! Returning to map.', 'error')
      changeScene('OVERWORLD')
    }
  }, [currentGig, changeScene, addToast])

  // Use the extracted logic hook
  const logic = useRhythmGameLogic()
  const { stats, actions, gameStateRef } = logic

  // Keyboard Event Handling
  useEffect(() => {
    /**
     * Handles key press events for rhythm inputs and pause menu.
     * @param {KeyboardEvent} e
     */
    const handleKeyDown = e => {
      if (e.repeat) return

      if (e.key === 'Escape') {
        if (activeEvent) {
          setActiveEvent(null)
          addToast('Resumed', 'info')
        } else {
          setActiveEvent({
            title: 'PAUSED',
            text: 'Game Paused',
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
                action: () => {
                  import('../utils/audioEngine').then(m => {
                    m.stopAudio()
                    setActiveEvent(null)
                    changeScene('OVERWORLD')
                  })
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
    addToast
  ])

  /**
   * Triggers a CSS animation on the corresponding band member DOM element.
   * @param {number} laneIndex
   */
  const triggerBandAnimation = laneIndex => {
    const memberEl = document.getElementById(`band-member-${laneIndex}`)
    if (memberEl) {
      memberEl.classList.remove('animate-headbang')
      void memberEl.offsetWidth // Trigger reflow
      memberEl.classList.add('animate-headbang')
    }
  }

  // Touch/Mouse Input Handlers for Columns
  /**
   * Handles touch/mouse down on a lane column.
   * @param {number} laneIndex
   */
  const handleTouchStart = laneIndex => {
    actions.registerInput(laneIndex, true)
    triggerBandAnimation(laneIndex)
  }

  /**
   * Handles touch/mouse up on a lane column.
   * @param {number} laneIndex
   */
  const handleTouchEnd = laneIndex => {
    actions.registerInput(laneIndex, false)
  }

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

  return (
    <div
      className={`w-full h-full relative bg-black flex flex-col overflow-hidden ${stats.isToxicMode ? 'border-4 border-(--toxic-green) animate-pulse' : ''}`}
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
            src={getGenImageUrl(IMG_PROMPTS.MATZE_PLAYING)}
            alt='Matze'
            className='w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]'
          />
        </div>
        {/* Lars (Drums) - Center Back */}
        <div
          id='band-member-1'
          className='absolute left-[50%] top-[20%] -translate-x-1/2 w-40 h-40 transition-transform duration-100'
        >
          <img
            src={getGenImageUrl(IMG_PROMPTS.LARS_PLAYING)}
            alt='Lars'
            className='w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(0,255,65,0.5)]'
          />
        </div>
        {/* Marius (Bass) - Right */}
        <div
          id='band-member-2'
          className='absolute right-[15%] top-[30%] w-32 h-48 transition-transform duration-100'
        >
          <img
            src={getGenImageUrl(IMG_PROMPTS.MARIUS_PLAYING)}
            alt='Marius'
            className='w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(0,65,255,0.5)]'
          />
        </div>
      </div>

      {/* Layer 2: Pixi Canvas (Notes) */}
      <PixiStage logic={logic} />

      {/* Layer 3 & 4: HUD & Inputs */}
      <GigHUD
        stats={stats}
        onLaneInput={(index, active) =>
          active ? handleTouchStart(index) : handleTouchEnd(index)
        }
      />
    </div>
  )
}
