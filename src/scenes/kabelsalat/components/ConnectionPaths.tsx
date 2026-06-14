import type { JSX } from 'react'
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
  const paths: JSX.Element[] = []
  for (const sockId in connections) {
    if (!Object.hasOwn(connections, sockId)) continue

    const s = sockId as SocketId
    const cabId = connections[s]
    if (!cabId) continue

    paths.push(
      <ConnectionPath
        key={s}
        sockId={s}
        cabId={cabId}
        isPowerConnected={isPowerConnected}
        socketOrder={socketOrder}
      />
    )
  }

  return <>{paths}</>
}
