import { CABLE_MAP } from '../kabelsalatConstants'
import { getMessyPath } from '../kabelsalatUtils'
import type { FC } from 'react'
import type { CableId } from '../kabelsalatConstants'

import type { SocketId } from '../../../types/kabelsalat'

/**
 * Props for the Connection Path component.
 */
export type ConnectionPathProps = {
  sockId: SocketId
  cabId: CableId
  isPowerConnected: boolean
  socketOrder: SocketId[]
}

/**
 * Renders the Connection Path scene from sockId, cabId, isPowerConnected, and socketOrder.
 * @param props - Socket/cable ids, power state, and socket order for one rendered connection path.
 * @returns The rendered Connection Path UI.
 */
export const ConnectionPath: FC<ConnectionPathProps> = ({
  sockId,
  cabId,
  isPowerConnected,
  socketOrder
}) => {
  const cable = CABLE_MAP[cabId]

  if (!cable) {
    return null
  }

  const isActive = isPowerConnected || cabId === 'iec'
  const cableColor = isActive ? cable.color : 'var(--color-concrete-gray)'

  return (
    <path
      d={getMessyPath(cabId, sockId, socketOrder)}
      fill='none'
      stroke={cableColor}
      strokeWidth='12'
      strokeLinecap='round'
      className='motion-safe:animate-[dash_0.6s_ease-out_forwards] motion-reduce:[stroke-dashoffset:0]'
      strokeDasharray='1500'
      strokeDashoffset='1500'
      style={{
        filter: isActive
          ? `drop-shadow(0 5px 10px ${cable.color})`
          : `drop-shadow(0 10px 10px var(--color-shadow-black))`
      }}
    />
  )
}
