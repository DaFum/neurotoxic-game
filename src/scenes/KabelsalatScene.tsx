import { useKabelsalatState } from './kabelsalat/useKabelsalatState'
import { Header } from './kabelsalat/components/Header.tsx'
import { Rules } from './kabelsalat/components/Rules.tsx'
import { KabelsalatBoard } from './kabelsalat/components/KabelsalatBoard.tsx'

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
    isPowerConnected
  } = useKabelsalatState()

  return (
    <div
      className={`flex flex-col items-center justify-center w-full min-h-screen relative p-4 ${!bgTextureUrl ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
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
        />

        <Rules t={t} />
      </div>

      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-10px, 5px) rotate(-1.5deg); }
          50% { transform: translate(10px, -5px) rotate(1.5deg); }
          75% { transform: translate(-10px, -5px) rotate(0deg); }
        }
        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}

export default KabelsalatScene
