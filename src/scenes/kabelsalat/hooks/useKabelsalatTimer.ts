import {
  useEffect,
  useRef,
  type MutableRefObject,
  type Dispatch,
  type SetStateAction
} from 'react'
import { SOCKET_DEFS } from '../kabelsalatConstants'
import type { CableId } from '../kabelsalatConstants'

const SOCKET_COUNT = Object.keys(SOCKET_DEFS).length
import type { SocketId } from '../../../types/kabelsalat'

/**
 * Runs the Kabelsalat countdown and mutates supplied state setters when time expires or wiring completes.
 * @param connections - Current cable-to-socket connection map.
 * @param isPoweredOn - Stops the countdown after successful wiring.
 * @param isGameOver - Stops the countdown after timeout or completion.
 * @param isWinningRef - Ref that guards one-shot win transitions.
 * @param setTimeLeft - Setter decremented once per second.
 * @param setIsPoweredOn - Setter used when every socket is wired.
 * @param setIsGameOver - Setter used when time expires.
 */
export const useKabelsalatTimer = (
  connections: Partial<Record<SocketId, CableId>>,
  isPoweredOn: boolean,
  isGameOver: boolean,
  isWinningRef: MutableRefObject<boolean>,
  setTimeLeft: Dispatch<SetStateAction<number>>,
  setIsPoweredOn: Dispatch<SetStateAction<boolean>>,
  setIsGameOver: Dispatch<SetStateAction<boolean>>
) => {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const finishedRef = useRef(false)

  // Timer Logic
  useEffect(() => {
    if (
      !isPoweredOn &&
      !isGameOver &&
      !isWinningRef.current &&
      !finishedRef.current
    ) {
      timerRef.current = setInterval(() => {
        if (finishedRef.current || isWinningRef.current) {
          if (timerRef.current) clearInterval(timerRef.current)
          return
        }

        setTimeLeft(prev => {
          const nextTimeLeft = Math.max(0, prev - 1)
          if (nextTimeLeft <= 0) {
            if (timerRef.current) clearInterval(timerRef.current)
            finishedRef.current = true
            setIsGameOver(true)
            return 0
          }
          return nextTimeLeft
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPoweredOn, isGameOver, isWinningRef, setIsGameOver, setTimeLeft])

  // Process success scenario
  useEffect(() => {
    if (finishedRef.current) return

    let connectionCount = 0
    for (const key in connections) {
      if (
        Object.hasOwn(connections, key) &&
        connections[key as keyof typeof connections] != null
      ) {
        connectionCount++
      }
    }

    if (connectionCount === SOCKET_COUNT) {
      if (timerRef.current) clearInterval(timerRef.current)
      isWinningRef.current = true

      const animTimer = setTimeout(() => {
        if (!finishedRef.current) {
          setIsPoweredOn(true)
        }
      }, 600)
      return () => clearTimeout(animTimer)
    }
  }, [connections, isWinningRef, setIsPoweredOn])

  return { finishedRef }
}
