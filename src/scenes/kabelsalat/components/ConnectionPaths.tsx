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
 * Draws all currently connected Kabelsalat cable paths.
 * @param props - Connection map, power state, and socket order for all rendered paths.
 */
export const ConnectionPaths = ({
  connections,
  isPowerConnected,
  socketOrder
}: ConnectionPathsProps) => {
  const paths = []
  for (const sockId in connections) {
    if (!Object.hasOwn(connections, sockId)) continue

    // Memory rule: safe typing for indexing
    const cabId = connections[sockId as keyof typeof connections]
    if (!cabId) continue

    paths.push(
      <ConnectionPath
        key={sockId}
        sockId={sockId as SocketId}
        cabId={cabId as CableId}
        isPowerConnected={isPowerConnected}
        socketOrder={socketOrder}
      />
    )
  }

  return <>{paths}</>
}
