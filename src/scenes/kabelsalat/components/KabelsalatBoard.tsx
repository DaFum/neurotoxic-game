/*
 * (#1) Actual Updates: Extracted KabelsalatBoard from KabelsalatScene for better maintainability.
 * (#2) Next steps and ideas to develop further: We could break down the SVG into smaller semantic layers.
 * (#3) Found errors + solutions: Extracted to avoid overly long components.
 */
import PropTypes from 'prop-types'
import { Overlays } from './Overlays.tsx'
import { CableList } from './CableList.tsx'
import { SocketList } from './SocketList.tsx'
import { ConnectionPaths } from './ConnectionPaths.tsx'
import { RackPanel, PowerIndicator } from './HardwareProps.tsx'
import { LightningEffects } from './LightningEffects.tsx'

import type { FC } from 'react'
import type { TFunction } from 'i18next'
import type { SOCKET_DEFS } from '../constants.ts'

import type { SocketId, LightningSeed } from '../../../types/kabelsalat'



interface KabelsalatBoardProps {
  t: TFunction
  isShocked: boolean
  isPoweredOn: boolean
  isGameOver: boolean
  faultReason: string | null
  isPowerConnected: boolean
  lightningSeeds: LightningSeed[]
  connections: Partial<Record<SocketId, string>>
  socketOrder: SocketId[]
  selectedCable?: string | null
  handleSocketClick: (id: SocketId) => void
  handleCableClick: (id: string) => void
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
  handleCableClick
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
  )
}

KabelsalatBoard.propTypes = {
  t: PropTypes.func.isRequired,
  isShocked: PropTypes.bool.isRequired,
  isPoweredOn: PropTypes.bool.isRequired,
  isGameOver: PropTypes.bool.isRequired,
  faultReason: PropTypes.string,
  isPowerConnected: PropTypes.bool.isRequired,
  lightningSeeds: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      startX: PropTypes.number.isRequired,
      o1: PropTypes.number.isRequired,
      o2: PropTypes.number.isRequired,
      o3: PropTypes.number.isRequired,
      w: PropTypes.number.isRequired
    })
  ).isRequired,
  connections: PropTypes.objectOf(PropTypes.string).isRequired,
  socketOrder: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedCable: PropTypes.string,
  handleSocketClick: PropTypes.func.isRequired,
  handleCableClick: PropTypes.func.isRequired
}
