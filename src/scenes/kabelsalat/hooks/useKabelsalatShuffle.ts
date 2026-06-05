import {
  useEffect,
  type MutableRefObject,
  type Dispatch,
  type SetStateAction,
  useMemo
} from 'react'
import { INITIAL_SOCKET_ORDER } from '../kabelsalatConstants'
import type { CableId } from '../kabelsalatConstants'
import type { SocketId } from '../../../types/kabelsalat'
import { getSafeRandom } from '../../../utils/crypto'
import { shuffleInPlace } from '../../../utils/shuffleUtils'

/**
 * Shuffles unconnected Kabelsalat sockets while preserving already connected positions and cleaning up scheduled updates.
 * @param isPoweredOn - Suspends reshuffling after successful wiring.
 * @param isGameOver - Suspends reshuffling after terminal overlay state.
 * @param isShocked - Suspends reshuffling during shock recovery.
 * @param connections - Current cable-to-socket connection map.
 * @param isWinningRef - Ref that guards one-shot win transitions.
 * @param setSocketOrder - Setter receiving the next socket order.
 */
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
        shuffleInPlace(shuffled, randomFn)

        let shuffleIndex = 0
        const newOrder = [...prevOrder]
        for (let i = 0; i < prevOrder.length; i++) {
          const id = prevOrder[i]
          if (id === undefined) continue
          if (connections[id]) {
            newOrder[i] = id
          } else {
            newOrder[i] = shuffled[shuffleIndex++] ?? id
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
