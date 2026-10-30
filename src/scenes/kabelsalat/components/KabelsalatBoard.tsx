import { GamepadHint } from '../../../ui/shared/InputHint'
import { useTranslation } from 'react-i18next'
import { ProgressBar } from '../../../ui/shared/ProgressBar'
import { formatPercent } from '../../../utils/numberUtils'
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

/**
 * Composes the interactive Kabelsalat board, connections, cables, sockets, and overlays.
 * @param props - Kabelsalat translator, state flags, connection state, socket/cable handlers, lightning seeds, and surge controls.
 */
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
  const { i18n } = useTranslation()
  return (
    <div className='relative w-full sm:mx-auto [@media(min-height:30rem)]:max-w-[min(100%,calc((100svh-14rem)*4/3))]'>
      <GamepadHint action='confirm'>
        {t('ui:controller.connectCable', {
          defaultValue: 'Select a cable and connect it'
        })}
      </GamepadHint>
      {/* Void Surge Meter overlay - autonomous mechanic */}
      {!isGameOver && !isPoweredOn && (
        <div className='mb-2 flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3'>
          <div className='text-toxic-green font-bold text-sm tracking-widest bg-void-black/80 px-2 py-1 border border-toxic-green/50'>
            {t('ui:minigames.kabelsalat.voidSurge')}:{' '}
            {formatPercent(Math.floor(voidSurge) / 100, i18n.language)}
          </div>
          <div className='w-48'>
            <ProgressBar
              value={voidSurge}
              max={100}
              showValue={false}
              aria-label={t('ui:minigames.kabelsalat.voidSurge')}
              color={
                voidSurge > 80
                  ? 'bg-error-red animate-pulse'
                  : 'bg-cosmic-purple'
              }
              trackClassName='w-full h-4 bg-void-black border-2 border-concrete-gray p-0.5'
              fillClassName='transition-all duration-300'
            />
          </div>
          {voidSurge > 0 && (
            <button
              type='button'
              onClick={purgeVoidSurge}
              className='mt-2 sm:mt-0 px-3 py-1 max-sm:min-h-11 max-sm:px-4 [@media(pointer:coarse)]:min-h-11 bg-void-black text-xs text-void-purple border border-void-purple hover:bg-cosmic-purple hover:text-void-black transition-colors font-bold tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-void-black focus-visible:ring-toxic-green'
            >
              {t('ui:minigames.kabelsalat.purgeAnomaly')}
            </button>
          )}
        </div>
      )}

      <div
        data-chatter-avoid-compact=''
        className={`relative w-full aspect-[4/3] border-4 bg-void-black transition-all duration-100 select-none overflow-hidden shadow-[inset_0_0_50px_var(--color-shadow-black)]
          ${
            isShocked
              ? 'border-error-red motion-safe:animate-[shake_0.1s_infinite]'
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
          onAdvance={onAdvance}
        />

        <svg
          width='100%'
          height='100%'
          viewBox='0 0 800 600'
          preserveAspectRatio='xMidYMid meet'
          className='absolute inset-0 z-(--z-stage-bg)'
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
    </div>
  )
}
