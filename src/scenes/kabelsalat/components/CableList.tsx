import { CABLES } from '../constants'
import PropTypes from 'prop-types'
import { CableItem } from './CableItem.tsx'
import type { TFunction } from 'i18next'

import type { SocketId } from '../../../types/kabelsalat'

type CableListProps = {
  t: TFunction
  connections: Partial<Record<SocketId, string>>
  selectedCable?: string | null
  isShocked: boolean
  isGameOver: boolean
  handleCableClick: (id: string) => void
}

export const CableList = ({
  t,
  connections,
  selectedCable,
  isShocked,
  isGameOver,
  handleCableClick
}: CableListProps) => {
  const connectedCableIds = new Set(
    Object.values(connections).filter(Boolean) as string[]
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
