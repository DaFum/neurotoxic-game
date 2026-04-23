import { useEffect, useRef, type MutableRefObject, type Dispatch, type SetStateAction } from 'react'
import { SOCKET_DEFS } from '../constants'

export const useKabelsalatTimer = (
  connections: Record<string, string>,
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
    if (
      !finishedRef.current &&
      Object.keys(connections).length === Object.keys(SOCKET_DEFS).length
    ) {
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
