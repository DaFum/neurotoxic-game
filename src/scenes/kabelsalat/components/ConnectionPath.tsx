import { CABLE_MAP } from '../constants'
import { getMessyPath } from '../utils'
import PropTypes from 'prop-types'
import type { FC } from 'react'

import type { SocketId, CableId } from '../../../types/kabelsalat'

export type ConnectionPathProps = {
  sockId: SocketId
  cabId: CableId
  isPowerConnected: boolean
  socketOrder: SocketId[]
}

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
}
ConnectionPath.propTypes = {
  sockId: PropTypes.string.isRequired,
  cabId: PropTypes.string.isRequired,
  isPowerConnected: PropTypes.bool.isRequired,
  socketOrder: PropTypes.arrayOf(PropTypes.string).isRequired
}
