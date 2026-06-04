import { ConnectionPath } from './ConnectionPath.tsx'
import type { ConnectionPathProps } from './ConnectionPath.tsx'
import type { SocketId } from '../../../types/kabelsalat'

type CableId = ConnectionPathProps['cabId']

type ConnectionPathsProps = {
  connections: Partial<Record<SocketId, CableId>>
  isPowerConnected: boolean
  socketOrder: SocketId[]
}

/**
 * Renders the Connection Paths scene from connections, isPowerConnected, and socketOrder.
 * @param props - Connection map, power state, and socket order for all rendered paths.
 * @returns The rendered Connection Paths UI.
 */
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
