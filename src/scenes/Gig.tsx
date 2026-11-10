import { useEffect, useRef, useState } from 'react'
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
import { DEFAULT_GAMEPAD_LANE_BINDINGS } from '../utils/gamepad/constants'

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
  const gamepadLaneBindings =
    useGameSelector(state => state.settings?.gamepadLaneBindings) ??
    DEFAULT_GAMEPAD_LANE_BINDINGS
  const { changeScene, addToast, setLastGigStats, endGig } = useGameActions()

  // An unlock attempt that returned false or rejected: the retry would fail
  // the same way, so the player needs the way out whatever the audio status.
  const [unlockAttemptFailed, setUnlockAttemptFailed] = useState(false)
  const unlockAttemptRef = useRef(0)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      unlockAttemptRef.current += 1
    }
  }, [])

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
  const {
    stats,
    actions,
    gameStateRef,
    update,
    onStageReady,
    onStageInitError
  } = logic

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

  const isInitFailed =
    stats.initStatus?.status === 'failed' || stats.audioStatus === 'failed'
  const isInitBlocked =
    stats.initStatus?.status === 'blocked' || stats.audioStatus === 'blocked'

  // Use extracted input hook
  const { handleLaneInput } = useGigInput({
    actions,
    gameStateRef,
    triggerBandAnimation,
    onTogglePause: handleTogglePause,
    gamepadLaneBindings,
    isPaused,
    gamepadEnabled: !isInitBlocked && !isInitFailed,
    onGamepadDisconnect: () =>
      addToast(
        t('ui:controller.disconnectPause', {
          defaultValue: 'Controller disconnected. Gig paused.'
        }),
        'info'
      )
  })

  // Use extracted visuals hook
  const { bgUrl, matzeUrl, mariusUrl, larsUrl } = useGigVisuals({
    currentGig,
    bandHarmony: band.harmony
  })

  // Render blocking overlay if audio is locked
  if (isInitBlocked || isInitFailed) {
    const failureKind =
      stats.initStatus?.status === 'failed'
        ? stats.initStatus.failureKind
        : stats.failureKind === 'stage'
          ? 'stage'
          : 'audio'

    return (
      <AudioLockedOverlay
        onInitializeAudio={() => {
          const attempt = ++unlockAttemptRef.current
          const isCurrentAttempt = () =>
            mountedRef.current &&
            attempt === unlockAttemptRef.current &&
            !gameStateRef?.current?.hasSubmittedResults
          void audioService
            .ensureAudioContext()
            .then(isUnlocked => {
              if (!isCurrentAttempt()) return
              if (isUnlocked !== false) {
                actions.retryAudioInitialization()
              } else {
                logger.warn('Gig', 'Audio context unlock returned false')
                setUnlockAttemptFailed(true)
                addToast(
                  t('ui:gig.audioUnlockFailed', {
                    defaultValue: 'Audio could not be unlocked. Try again.'
                  }),
                  'error'
                )
              }
            })
            .catch(err => {
              if (!isCurrentAttempt()) return
              logger.error('Gig', 'Audio context unlock rejected', err)
              setUnlockAttemptFailed(true)
              addToast(
                t('ui:gig.audioUnlockFailed', {
                  defaultValue: 'Audio could not be unlocked. Try again.'
                }),
                'error'
              )
            })
        }}
        onQuit={
          isInitFailed || unlockAttemptFailed
            ? () => {
                unlockAttemptRef.current += 1
                void handleQuitGig()
              }
            : undefined
        }
        failureKind={failureKind}
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
      onStageReady={onStageReady}
      onStageInitError={onStageInitError}
      stats={stats}
      handleLaneInput={handleLaneInput}
      handleTogglePause={handleTogglePause}
      isPaused={isPaused}
      handleQuitGig={handleQuitGig}
    />
  )
}
