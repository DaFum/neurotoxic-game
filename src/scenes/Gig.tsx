import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { useRhythmGameLogic } from '../hooks/useRhythmGameLogic'
import { useGigEffects } from '../hooks/useGigEffects'
import { useGigInput } from '../hooks/useGigInput'
import { useGigSession } from '../hooks/useGigSession'
import { useGigVisuals } from '../hooks/useGigVisuals'
import { audioService } from '../utils/audio/audioEngine'
import { logger } from '../utils/logger'

import { AudioLockedOverlay } from '../components/minigames/gig/AudioLockedOverlay'

import { GigView } from '../components/minigames/gig/GigView'

/**
 * The core Rhythm Game scene.
 * Orchestrates audio, visualizers (PixiJS), and game logic.
 */
export const Gig = () => {
  const { t } = useTranslation()
  const currentGig = useGameSelector(state => state.currentGig)
  const band = useGameSelector(state => state.band)
  const { changeScene, addToast, setLastGigStats, endGig } = useGameActions()

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

  // Use extracted session hook
  const { isPaused, handleTogglePause, handleQuitGig } = useGigSession({
    addToast,
    setLastGigStats,
    endGig,
    tRef,
    gameStateRef
  })

  // Use extracted effects hook
  const {
    chaosContainerRef,
    chaosStyle,
    triggerBandAnimation,
    setBandMemberRef
  } = useGigEffects(stats)

  // Use extracted input hook
  const { handleLaneInput } = useGigInput({
    actions,
    gameStateRef,
    triggerBandAnimation,
    onTogglePause: handleTogglePause
  })

  // Use extracted visuals hook
  const { bgUrl, matzeUrl, mariusUrl, larsUrl } = useGigVisuals({
    currentGig,
    bandHarmony: band.harmony
  })

  // Render blocking overlay if audio is locked
  if (stats.isAudioReady === false) {
    return (
      <AudioLockedOverlay
        onInitializeAudio={() => {
          void audioService
            .ensureAudioContext()
            .then(isUnlocked => {
              if (isUnlocked !== false) {
                actions.retryAudioInitialization()
              } else {
                logger.warn('Gig', 'Audio context unlock returned false')
              }
            })
            .catch(err => {
              logger.error('Gig', 'Audio context unlock rejected', err)
            })
        }}
      />
    )
  }

  return (
    <GigView
      chaosContainerRef={chaosContainerRef}
      chaosStyle={chaosStyle}
      isToxicMode={stats.isToxicMode}
      bgUrl={bgUrl}
      matzeUrl={matzeUrl}
      mariusUrl={mariusUrl}
      larsUrl={larsUrl}
      setBandMemberRef={setBandMemberRef}
      t={t}
      gameStateRef={gameStateRef}
      update={update}
      stats={stats}
      handleLaneInput={handleLaneInput}
      handleTogglePause={handleTogglePause}
      isPaused={isPaused}
      handleQuitGig={handleQuitGig}
    />
  )
}
