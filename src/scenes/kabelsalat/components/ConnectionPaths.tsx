import type { JSX } from 'react'
import { ConnectionPath } from './ConnectionPath.tsx'
import type { SocketId } from '../../../types/kabelsalat'
import type { CableId } from '../kabelsalatConstants'

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
  // Iterate the typed socketOrder (SocketId[]) rather than `for...in` over the
  // connections record, which would widen keys to `string` and require a cast.
  for (const sockId of socketOrder) {
    const cabId = connections[sockId]
    if (!cabId) continue

    paths.push(
      <ConnectionPath
        key={sockId}
        sockId={sockId}
        cabId={cabId}
        isPowerConnected={isPowerConnected}
        socketOrder={socketOrder}
      />
    )
  }

  return <>{paths}</>
}
