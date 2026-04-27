/*
 * (#1) Actual Updates: Extracted SocketItem component to improve maintainability.


 */
import PropTypes from 'prop-types'
import type { FC } from 'react'
import { SocketItem } from './SocketItem.tsx'
import type { CableId } from '../constants'
import type { SocketId } from '../../../types/kabelsalat'

interface SocketListProps {
  t: (key: string, options?: unknown) => string
  socketOrder: SocketId[]
  connections: Partial<Record<SocketId, CableId>>
  isPowerConnected: boolean
  selectedCable?: CableId | null
  isGameOver: boolean
  handleSocketClick: (id: SocketId) => void
}

export const SocketList: FC<SocketListProps> = ({
  t,
  socketOrder,
  connections,
  isPowerConnected,
  selectedCable,
  isGameOver,
  handleSocketClick
}) => {
  return (
    <>
      {socketOrder.map((socketId, index) => (
        <SocketItem
          key={socketId}
          t={t}
          socketId={socketId}
          index={index}
          connections={connections}
          isPowerConnected={isPowerConnected}
          selectedCable={selectedCable}
          isGameOver={isGameOver}
          handleSocketClick={handleSocketClick}
        />
      ))}
    </>
  )
}

SocketList.propTypes = {
  t: PropTypes.func.isRequired,
  socketOrder: PropTypes.arrayOf(PropTypes.string).isRequired,
  connections: PropTypes.objectOf(PropTypes.string).isRequired,
  isPowerConnected: PropTypes.bool.isRequired,
  selectedCable: PropTypes.string,
  isGameOver: PropTypes.bool.isRequired,
  handleSocketClick: PropTypes.func.isRequired
}
