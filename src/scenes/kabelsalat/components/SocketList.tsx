import type { FC } from 'react'
import type { TFunction } from 'i18next'
import { SocketItem } from './SocketItem.tsx'
import type { CableId } from '../kabelsalatConstants'
import type { SocketId } from '../../../types/kabelsalat'

interface SocketListProps {
  t: TFunction
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
