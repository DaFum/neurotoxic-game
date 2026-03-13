import { CABLE_MAP } from '../constants.js'
import { getMessyPath } from '../utils.js'

export const ConnectionPaths = ({
  connections,
  isPowerConnected,
  socketOrder
}) => {
  return (
    <>
      {Object.entries(connections).map(([sockId, cabId]) => {
        const cable = CABLE_MAP[cabId]
        const isActive = isPowerConnected || cabId === 'iec'
        const cableColor = isActive ? cable.color : 'var(--color-concrete-gray)'

        return (
          <path
            key={sockId}
            d={getMessyPath(cabId, sockId, socketOrder)}
            fill='none'
            stroke={cableColor}
            strokeWidth='12'
            strokeLinecap='round'
            className='animate-[dash_0.6s_ease-out_forwards]'
            strokeDasharray='1500'
            strokeDashoffset='1500'
            style={{
              filter: isActive
                ? `drop-shadow(0 5px 10px ${cable.color})`
                : `drop-shadow(0 10px 10px var(--color-shadow-black))`
            }}
          />
        )
      })}
    </>
  )
}
