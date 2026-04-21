/*
 * (#1) Actual Updates: Refactored ConnectionPaths to use the newly extracted ConnectionPath sub-component.


 */
import PropTypes from 'prop-types'
import { ConnectionPath } from './ConnectionPath.tsx'
import type { ConnectionPathProps } from './ConnectionPath.tsx'

type SocketId = ConnectionPathProps['sockId']
type CableId = ConnectionPathProps['cabId']

type ConnectionPathsProps = {
  connections: Partial<Record<SocketId, CableId>>
  isPowerConnected: boolean
  socketOrder: SocketId[]
}

export const ConnectionPaths = ({
  connections,
  isPowerConnected,
  socketOrder
}: ConnectionPathsProps) => {
  return (
    <>
      {Object.entries(connections).map(([sockId, cabId]) => {
        if (!cabId) return null
        const s = sockId as SocketId
        return (
          <ConnectionPath
            key={s}
            sockId={s}
            cabId={cabId as CableId}
            isPowerConnected={isPowerConnected}
            socketOrder={socketOrder}
          />
        )
      })}
    </>
  )
}
;(ConnectionPaths as any).propTypes = {
  connections: PropTypes.objectOf(PropTypes.string).isRequired,
  isPowerConnected: PropTypes.bool.isRequired,
  socketOrder: PropTypes.arrayOf(PropTypes.string).isRequired
}
