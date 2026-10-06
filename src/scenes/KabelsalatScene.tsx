import { useCallback, useMemo } from 'react'
import { useKabelsalatState } from './kabelsalat/useKabelsalatState'
import { Header } from './kabelsalat/components/Header.tsx'
import { Rules } from './kabelsalat/components/Rules.tsx'
import { KabelsalatBoard } from './kabelsalat/components/KabelsalatBoard.tsx'
import { MinigameSkipButton } from '../components/MinigameSkipButton'
import { useMinigameSceneLogic } from '../hooks/useMinigameSceneLogic'

/**
 * Hosts the Kabelsalat wiring minigame using shared state, board, header, and rules views.
 *
 * @remarks
 * Keeps its own SVG layout but shares the minigame exit controls: the SKIP
 * forfeit button and the DEV `Shift+P` backdoor come from `useMinigameSceneLogic`.
 * `forceAdvance` is idempotent, so skip, backdoor, Escape and the auto-advance
 * timer can race safely.
 */
export const KabelsalatScene = () => {
  const {
    t,
    selectedCable,
    connections,
    isShocked,
    faultReason,
    isPoweredOn,
    timeLeft,
    isGameOver,
    socketOrder,
    lightningSeeds,
    bgTextureUrl,
    handleCableClick,
    handleSocketClick,
    isPowerConnected,
    forceAdvance,
    voidSurge,
    purgeVoidSurge
  } = useKabelsalatState()

  // Shared exit controls. A pending win (isPoweredOn) or loss (isGameOver)
  // already auto-advances, so both hide SKIP and disable the backdoor.
  const logic = useMemo(
    () => ({ finishMinigame: () => forceAdvance(true) }),
    [forceAdvance]
  )
  const uiState = useMemo(
    () => ({ isGameOver: isGameOver || isPoweredOn }),
    [isGameOver, isPoweredOn]
  )
  const handleComplete = useCallback(
    () => forceAdvance(isPoweredOn),
    [forceAdvance, isPoweredOn]
  )
  const { handleSkip, canSkip } = useMinigameSceneLogic({
    logic,
    uiState,
    onComplete: handleComplete
  })

  return (
    <div
      className={`flex flex-col items-center justify-center w-full min-h-[100svh] relative p-4 ${!bgTextureUrl ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
      style={
        bgTextureUrl
          ? { backgroundImage: `url(${bgTextureUrl})`, backgroundSize: 'cover' }
          : {}
      }
    >
      <div className='absolute inset-0 bg-void-black/80 z-0'></div>

      {canSkip && <MinigameSkipButton onClick={handleSkip} />}

      <div className='flex flex-col items-center w-full max-w-4xl mx-auto z-10'>
        <Header
          t={t}
          isShocked={isShocked}
          isPoweredOn={isPoweredOn}
          isGameOver={isGameOver}
          timeLeft={timeLeft}
        />

        <KabelsalatBoard
          t={t}
          isShocked={isShocked}
          isPoweredOn={isPoweredOn}
          isGameOver={isGameOver}
          faultReason={faultReason}
          isPowerConnected={isPowerConnected}
          lightningSeeds={lightningSeeds}
          connections={connections}
          socketOrder={socketOrder}
          selectedCable={selectedCable}
          handleSocketClick={handleSocketClick}
          handleCableClick={handleCableClick}
          onAdvance={forceAdvance}
          voidSurge={voidSurge}
          purgeVoidSurge={purgeVoidSurge}
        />

        <Rules t={t} />
      </div>
    </div>
  )
}
