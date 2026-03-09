import { useKabelsalatState } from './kabelsalat/useKabelsalatState.js'
import { Header } from './kabelsalat/components/Header.jsx'
import { Rules } from './kabelsalat/components/Rules.jsx'
import { Overlays } from './kabelsalat/components/Overlays.jsx'
import { CableList } from './kabelsalat/components/CableList.jsx'
import { SocketList } from './kabelsalat/components/SocketList.jsx'
import { ConnectionPaths } from './kabelsalat/components/ConnectionPaths.jsx'
import { RackScrew } from './kabelsalat/components/HardwareProps.jsx'

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
      <div className='absolute inset-0 bg-(--void-black)/80 z-0'></div>

      <div className='flex flex-col items-center w-full max-w-4xl mx-auto z-10'>
        <Header
          t={t}
          isShocked={isShocked}
          isPoweredOn={isPoweredOn}
          isGameOver={isGameOver}
          timeLeft={timeLeft}
        />

        <div
          className={`relative w-full aspect-[4/3] border-4 bg-(--void-black) transition-all duration-100 select-none overflow-hidden shadow-[inset_0_0_50px_var(--shadow-black)]
            ${
              isShocked
                ? 'border-(--error-red) animate-[shake_0.1s_infinite]'
                : isPoweredOn
                  ? 'border-(--success-green) shadow-[0_0_30px_var(--success-green)]'
                  : isGameOver
                    ? 'border-(--blood-red)'
                    : 'border-(--concrete-gray)'
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
            <rect
              x='40'
              y='20'
              width='720'
              height='180'
              fill='var(--shadow-black)'
              stroke='var(--concrete-gray)'
              strokeWidth='4'
            />
            <rect
              x='50'
              y='30'
              width='700'
              height='160'
              fill='var(--void-black)'
            />
            <RackScrew x='60' y='40' /> <RackScrew x='760' y='40' />
            <RackScrew x='60' y='170' /> <RackScrew x='760' y='170' />
            <circle
              cx='80'
              cy='100'
              r='6'
              fill={
                isPowerConnected
                  ? 'var(--success-green)'
                  : 'var(--concrete-gray)'
              }
              style={{
                filter: isPowerConnected
                  ? 'drop-shadow(0 0 10px var(--success-green))'
                  : 'none'
              }}
            />
            <text
              x='80'
              y='125'
              fill='var(--ash-gray)'
              fontSize='8'
              textAnchor='middle'
              className='font-mono tracking-widest'
            >
              {t('ui:minigames.kabelsalat.pwrLabel')}
            </text>

            {lightningSeeds.map(seed => (
              <path
                key={seed.id}
                d={`M ${seed.startX} 0 L ${seed.startX + seed.o1} 200 L ${seed.startX + seed.o2} 400 L ${seed.startX + seed.o3} 600`}
                fill='none'
                stroke='var(--warning-yellow)'
                strokeWidth={seed.w}
                className='animate-[flash_0.05s_infinite]'
                style={{
                  filter: 'drop-shadow(0 0 20px var(--warning-yellow))'
                }}
              />
            ))}

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
