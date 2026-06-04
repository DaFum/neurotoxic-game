import { useMemo } from 'react'
import { CABLES } from '../kabelsalatConstants'
import { CableItem } from './CableItem.tsx'
import type { TFunction } from 'i18next'

import type { CableId } from '../kabelsalatConstants'
import type { SocketId } from '../../../types/kabelsalat'

type CableListProps = {
  t: TFunction
  connections: Partial<Record<SocketId, CableId>>
  selectedCable?: CableId | null
  isShocked: boolean
  isGameOver: boolean
  handleCableClick: (id: CableId) => void
}

/**
 * Renders the Cable List scene.
 * @param props - Translator, connection map, selected cable, shock/game-over state, and cable-click handler.
 */
export const CableList = ({
  t,
  connections,
  selectedCable,
  isShocked,
  isGameOver,
  handleCableClick
}: CableListProps) => {
  // Bolt: Memoize connected cable IDs to avoid allocating Sets on every render.
  // Also avoid Object.values(connections).filter(...) to prevent intermediate array allocation overhead.
  const connectedCableIds = useMemo(() => {
    const set = new Set<CableId>()
    for (const key in connections) {
      if (Object.hasOwn(connections, key)) {
        const connection = connections[key as SocketId]
        if (connection != null) {
          set.add(connection)
        }
      }
    }
    return set
  }, [connections])

  return (
    <>
      {CABLES.map(cable => {
        const isConnected = connectedCableIds.has(cable.id)
        const isSelected = selectedCable === cable.id

        return (
          <CableItem
            key={cable.id}
            t={t}
            cable={cable}
            isConnected={isConnected}
            isSelected={isSelected}
            isShocked={isShocked}
            isGameOver={isGameOver}
            handleCableClick={handleCableClick}
          />
        )
      })}
    </>
  )
}
