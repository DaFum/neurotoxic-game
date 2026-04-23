import {
  useEffect,
  useRef,
  lazy,
  Suspense
} from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { useRhythmGameLogic } from '../hooks/useRhythmGameLogic'
import { useGigEffects } from '../hooks/useGigEffects'
import { useGigInput } from '../hooks/useGigInput'
import { useGigSession } from '../hooks/useGigSession'
import { useGigVisuals } from '../hooks/useGigVisuals'
import { GigHUD } from '../components/GigHUD'

const PixiStage = lazy(() =>
  import('../components/PixiStage').then(m => ({ default: m.PixiStage }))
)
import { audioManager } from '../utils/AudioManager'

import { AudioLockedOverlay } from '../components/minigames/gig/AudioLockedOverlay'
import { BandMembersLayer } from '../components/minigames/gig/BandMembersLayer'
import { PauseOverlay } from '../components/minigames/gig/PauseOverlay'

/**
 * The core Rhythm Game scene.
 * Orchestrates audio, visualizers (PixiJS), and game logic.
 */
export const Gig = () => {
  const { t } = useTranslation()
  const { currentGig, changeScene, addToast, setLastGigStats, band, endGig } =
    useGameState()

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

export default Gig
