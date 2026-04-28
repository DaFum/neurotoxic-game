import { CABLES } from '../constants'
import PropTypes from 'prop-types'
import { CableItem } from './CableItem.tsx'
import type { TFunction } from 'i18next'

import type { CableId } from '../constants'
import type { SocketId } from '../../../types/kabelsalat'

type CableListProps = {
  t: TFunction
  connections: Partial<Record<SocketId, CableId>>
  selectedCable?: CableId | null
  isShocked: boolean
  isGameOver: boolean
  handleCableClick: (id: CableId) => void
}

export const CableList = ({
  t,
  connections,
  selectedCable,
  isShocked,
  isGameOver,
  handleCableClick
}: CableListProps) => {
  const connectedCableIds = new Set<CableId>(
    Object.values(connections).filter(
      (connection): connection is CableId => connection != null
    )
  )

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

CableList.propTypes = {
  t: PropTypes.func.isRequired,
  connections: PropTypes.objectOf(PropTypes.string).isRequired,
  selectedCable: PropTypes.string,
  isShocked: PropTypes.bool.isRequired,
  isGameOver: PropTypes.bool.isRequired,
  handleCableClick: PropTypes.func.isRequired
}
