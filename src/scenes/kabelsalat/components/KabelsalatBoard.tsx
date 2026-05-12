/*
 * (#1) Actual Updates: Extracted KabelsalatBoard from KabelsalatScene for better maintainability.
 * (#2) Next steps and ideas to develop further: We could break down the SVG into smaller semantic layers.
 * (#3) Found errors + solutions: Extracted to avoid overly long components.
 */
import { Overlays } from './Overlays.tsx'
import { CableList } from './CableList.tsx'
import { SocketList } from './SocketList.tsx'
import { ConnectionPaths } from './ConnectionPaths.tsx'
import { RackPanel, PowerIndicator } from './HardwareProps.tsx'
import { LightningEffects } from './LightningEffects.tsx'

import type { FC } from 'react'
import type { TFunction } from 'i18next'

import type { SocketId, LightningSeed } from '../../../types/kabelsalat'
import type { CableId } from '../kabelsalatConstants'

interface KabelsalatBoardProps {
  t: TFunction
  isShocked: boolean
  isPoweredOn: boolean
  isGameOver: boolean
  faultReason: string | null
  isPowerConnected: boolean
  lightningSeeds: LightningSeed[]
  connections: Partial<Record<SocketId, CableId>>
  socketOrder: SocketId[]
  selectedCable?: CableId | null
  handleSocketClick: (id: SocketId) => void
  handleCableClick: (id: CableId) => void
  onAdvance: (isPowered: boolean) => void
  voidSurge: number
  purgeVoidSurge: () => void
}

export const KabelsalatBoard: FC<KabelsalatBoardProps> = ({
  t,
  isShocked,
  isPoweredOn,
  isGameOver,
  faultReason,
  isPowerConnected,
  lightningSeeds,
  connections,
  socketOrder,
  selectedCable,
  handleSocketClick,
  handleCableClick,
  onAdvance,
  voidSurge,
  purgeVoidSurge
}) => {
  return (
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
      {/* Void Surge Meter overlay - autonomous mechanic */}
      {(!isGameOver && !isPoweredOn) && (
        <div className='absolute top-4 right-4 z-20 flex flex-col items-end gap-2'>
          <div className='text-toxic-green font-bold text-sm tracking-widest bg-void-black/80 px-2 py-1 border border-toxic-green/50'>
            {t('ui:minigames.kabelsalat.voidSurge')}: {Math.floor(voidSurge)}%
          </div>
          <div className='w-48 h-4 bg-void-black border-2 border-concrete-gray p-0.5'>
            <div
              className={`h-full transition-all duration-300 ${voidSurge > 80 ? 'bg-error-red animate-pulse' : 'bg-cosmic-purple'}`}
              style={{ width: `${Math.min(100, Math.max(0, voidSurge))}%` }}
            />
          </div>
          {voidSurge > 0 && (
            <button
              type='button'
              onClick={purgeVoidSurge}
              className='mt-2 px-3 py-1 bg-void-black text-xs text-cosmic-purple border border-cosmic-purple hover:bg-cosmic-purple hover:text-void-black transition-colors font-bold tracking-wider'
            >
              {t('ui:minigames.kabelsalat.purgeAnomaly')}
            </button>
          )}
        </div>
      )}

      <Overlays
        t={t}
        isShocked={isShocked}
        isGameOver={isGameOver}
        isPoweredOn={isPoweredOn}
        faultReason={faultReason}
        onAdvance={onAdvance}
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
  )
}
