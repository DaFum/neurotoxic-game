import { useKabelsalatState } from './kabelsalat/useKabelsalatState'
import { Header } from './kabelsalat/components/Header.tsx'
import { Rules } from './kabelsalat/components/Rules.tsx'
import { KabelsalatBoard } from './kabelsalat/components/KabelsalatBoard.tsx'

/**
 * Hosts the Kabelsalat wiring minigame using shared state, board, header, and rules views.
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
