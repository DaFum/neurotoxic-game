// TODO: Extract complex UI sub-components into standalone files for better maintainability
import { SOCKET_DEFS, SLOT_XS, CABLE_MAP } from '../constants.js'
import { PlugGraphics } from './PlugGraphics.jsx'
import { SocketGraphics } from './SocketGraphics.jsx'

export const SocketList = ({
  t,
  socketOrder,
  connections,
  isPowerConnected,
  selectedCable,
  isGameOver,
  handleSocketClick
}) => {
  return (
    <>
      {socketOrder.map((socketId, index) => {
        const socket = SOCKET_DEFS[socketId]
        const x = SLOT_XS[index]
        const y = 120

        const isConnected = !!connections[socketId]
        const connectedCable = isConnected
          ? CABLE_MAP[connections[socketId]]
          : null
        const showColor = isPowerConnected
        const socketDisplayColor = showColor
          ? socket.color
          : 'var(--color-ash-gray)'

        return (
          <g
            key={socketId}
            transform={`translate(${x}, ${y})`}
            onClick={() => handleSocketClick(socketId)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleSocketClick(socketId)
              }
            }}
            role='button'
            tabIndex={!isConnected && selectedCable && !isGameOver ? 0 : -1}
            className={`transition-transform duration-500 ease-in-out ${!isConnected && selectedCable && !isGameOver ? 'cursor-pointer group' : 'outline-hidden'}`}
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

            {isConnected && (
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
      })}
    </>
  )
}
