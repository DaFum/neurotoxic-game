// @ts-nocheck
import { useKabelsalatState } from './kabelsalat/useKabelsalatState.js'
import { Header } from './kabelsalat/components/Header.tsx'
import { Rules } from './kabelsalat/components/Rules.tsx'
import { Overlays } from './kabelsalat/components/Overlays.tsx'
import { CableList } from './kabelsalat/components/CableList.tsx'
import { SocketList } from './kabelsalat/components/SocketList.tsx'
import { ConnectionPaths } from './kabelsalat/components/ConnectionPaths.tsx'
import {
  RackPanel,
  PowerIndicator
} from './kabelsalat/components/HardwareProps.tsx'
import { LightningEffects } from './kabelsalat/components/LightningEffects.tsx'

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

        <div
          className={`relative w-full aspect-[4/3] border-4 bg-void-black transition-all duration-100 select-none overflow-hidden shadow-[inset_0_0_50px_var(--color-shadow-black)]
            ${
              isShocked
                ? 'border-error-red animate-[shake_0.1s_infinite]'
                : isPoweredOn
                  ? 'border-success-green shadow-[0_0_30px_var(--color-success-green)]'
                  : isGameOver
                    ? 'border-blood-red'
                    : 'border-concrete-gray'
            }`}
        >
          <Overlays
            t={t}
            isShocked={isShocked}
            isGameOver={isGameOver}
            isPoweredOn={isPoweredOn}
            faultReason={faultReason}
          />

          <svg
            width='100%'
            height='100%'
            viewBox='0 0 800 600'
            preserveAspectRatio='xMidYMid meet'
            className='absolute inset-0 z-10'
            role='img'
            aria-label={t('ui:minigames.kabelsalat.title')}
          >
            <title>{t('ui:minigames.kabelsalat.title')}</title>
            <RackPanel />
            <PowerIndicator t={t} isPowerConnected={isPowerConnected} />
            <LightningEffects lightningSeeds={lightningSeeds} />
            <ConnectionPaths
              connections={connections}
              isPowerConnected={isPowerConnected}
              socketOrder={socketOrder}
            />
            <SocketList
              t={t}
              socketOrder={socketOrder}
              connections={connections}
              isPowerConnected={isPowerConnected}
              selectedCable={selectedCable}
              isGameOver={isGameOver}
              handleSocketClick={handleSocketClick}
            />
            <CableList
              t={t}
              connections={connections}
              selectedCable={selectedCable}
              isShocked={isShocked}
              isGameOver={isGameOver}
              handleCableClick={handleCableClick}
            />
          </svg>
        </div>

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
