import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import type { FC } from 'react'
import { PlugGraphics } from './PlugGraphics.tsx'
import { SocketGraphics } from './SocketGraphics.tsx'
import { SOCKET_DEFS, SLOT_XS, CABLE_MAP } from '../constants'

interface SocketItemProps {
  t: (key: string, options?: unknown) => string
  socketId: keyof typeof SOCKET_DEFS
  index: number
  connections: Partial<Record<keyof typeof SOCKET_DEFS, string>>
  isPowerConnected: boolean
  selectedCable?: string | null
  isGameOver: boolean
  handleSocketClick: (id: keyof typeof SOCKET_DEFS) => void
}

const SocketItemComponent: FC<SocketItemProps> = ({
  t,
  socketId,
  index,
  connections,
  isPowerConnected,
  selectedCable,
  isGameOver,
  handleSocketClick
}) => {
  const socket = SOCKET_DEFS[socketId]
  const x = SLOT_XS[index]
  const y = 120

  const isConnected = !!connections[socketId]
  const cableId = connections[socketId]
  const connectedCable =
    isConnected && typeof cableId === 'string'
      ? ((CABLE_MAP[cableId] as { type: string; color: string } | undefined) ??
        null)
      : null
  const showColor = isPowerConnected
  const socketDisplayColor = showColor ? socket.color : 'var(--color-ash-gray)'

  const isInteractive = !isConnected && !!selectedCable && !isGameOver

  const onClickHandler = useCallback(() => {
    if (!isInteractive) return
    handleSocketClick(socketId)
  }, [handleSocketClick, socketId, isInteractive])

  const onKeyDownHandler = useCallback(
    (e: React.KeyboardEvent<SVGElement>) => {
      if (!isInteractive) return
      const key = e.key
      if (key === 'Enter' || key === ' ') {
        e.preventDefault()
        handleSocketClick(socketId)
      }
    },
    [handleSocketClick, socketId, isInteractive]
  )

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={isInteractive ? onClickHandler : undefined}
      onKeyDown={isInteractive ? onKeyDownHandler : undefined}
      role='button'
      tabIndex={isInteractive ? 0 : -1}
      className={`transition-transform duration-500 ease-in-out ${isInteractive ? 'cursor-pointer group' : 'outline-hidden'}`}
      style={{ color: socketDisplayColor }}
      aria-label={t('ui:minigames.kabelsalat.a11y.socket', {
        label: t(socket.labelKey)
      })}
    >
      {selectedCable && !isConnected && !isGameOver && (
        <circle
          cx='0'
          cy='0'
          r='45'
          fill='currentColor'
          fillOpacity='0.05'
          stroke='currentColor'
          strokeWidth='1'
          strokeDasharray='4 8'
          className='animate-[spin_4s_linear_infinite] group-hover:fill-opacity-20'
        />
      )}

      <rect
        x='-35'
        y='-35'
        width='70'
        height='70'
        fill='var(--color-void-black)'
        stroke='var(--color-concrete-gray)'
        strokeWidth='1'
        rx='4'
      />

      <SocketGraphics type={socket.type} />

      <circle
        cx='-25'
        cy='-25'
        r='4'
        fill={
          isConnected && showColor
            ? 'var(--color-success-green)'
            : 'var(--color-shadow-black)'
        }
        style={{
          filter:
            isConnected && showColor
              ? 'drop-shadow(0 0 5px var(--color-success-green))'
              : 'none'
        }}
      />

      <text
        x='0'
        y='-45'
        fill={showColor ? 'currentColor' : 'var(--color-ash-gray)'}
        opacity={showColor ? 1 : 0.5}
        fontSize='12'
        textAnchor='middle'
        className='font-mono font-bold tracking-widest'
      >
        {t(socket.labelKey)}
      </text>

      {isConnected && connectedCable && (
        <g
          style={{
            color: showColor
              ? connectedCable.color
              : 'var(--color-concrete-gray)'
          }}
        >
          <PlugGraphics type={connectedCable.type} />
        </g>
      )}
    </g>
  )
}

export const SocketItem = React.memo(SocketItemComponent)
SocketItem.displayName = 'SocketItem'

SocketItem.propTypes = {
  t: PropTypes.func.isRequired,
  socketId: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  connections: PropTypes.objectOf(PropTypes.string).isRequired,
  isPowerConnected: PropTypes.bool.isRequired,
  selectedCable: PropTypes.string,
  isGameOver: PropTypes.bool.isRequired,
  handleSocketClick: PropTypes.func.isRequired
}
