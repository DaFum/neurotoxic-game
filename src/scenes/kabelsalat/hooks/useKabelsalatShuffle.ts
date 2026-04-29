import {
  useEffect,
  type MutableRefObject,
  type Dispatch,
  type SetStateAction,
  useMemo
} from 'react'
import { INITIAL_SOCKET_ORDER } from '../constants'
import type { CableId } from '../constants'
import type { SocketId } from '../../../types/kabelsalat'
import { getSafeRandom } from '../../../utils/crypto'

export const useKabelsalatShuffle = (
  isPoweredOn: boolean,
  isGameOver: boolean,
  isShocked: boolean,
  connections: Partial<Record<SocketId, CableId>>,
  isWinningRef: MutableRefObject<boolean>,
  setSocketOrder: Dispatch<SetStateAction<SocketId[]>>
) => {
  const unconnectedIds = useMemo(() => {
    return INITIAL_SOCKET_ORDER.filter(id => !connections[id])
  }, [connections])

  const randomFn = getSafeRandom

  // Shuffle sockets
  useEffect(() => {
    if (
      isPoweredOn ||
      isGameOver ||
      isShocked ||
      isWinningRef.current ||
      unconnectedIds.length <= 1
    ) {
      return
    }

    const interval = setInterval(() => {
      setSocketOrder(prevOrder => {
        const shuffled = [...unconnectedIds]

        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(randomFn() * (i + 1))
          ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }

        let shuffleIndex = 0
        const newOrder = new Array(prevOrder.length)
        for (let i = 0; i < prevOrder.length; i++) {
          const id = prevOrder[i]
          if (connections[id]) {
            newOrder[i] = id
          } else {
            newOrder[i] = shuffled[shuffleIndex++]
          }
        }
        return newOrder
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [
    isPoweredOn,
    isGameOver,
    isShocked,
    unconnectedIds,
    connections,
    isWinningRef,
    randomFn,
    setSocketOrder
  ])
}
