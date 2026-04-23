import { useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { generateLightningSeeds } from './utils'
import { INITIAL_SOCKET_ORDER, TIME_LIMIT } from './constants'
import { useKabelsalatBackground } from './hooks/useKabelsalatBackground'
import { useKabelsalatTimer } from './hooks/useKabelsalatTimer'
import { useKabelsalatShuffle } from './hooks/useKabelsalatShuffle'
import { useKabelsalatInteractions } from './hooks/useKabelsalatInteractions'
import { useKabelsalatGameEnd } from './hooks/useKabelsalatGameEnd'

export const useKabelsalatState = () => {
  const { t } = useTranslation(['ui'])

  // Core State
  const [selectedCable, setSelectedCable] = useState<string | null>(null)
  const [connections, setConnections] = useState<Record<string, string>>({})
  const [isShocked, setIsShocked] = useState(false)
  const [faultReason, setFaultReason] = useState('')
  const [isPoweredOn, setIsPoweredOn] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [isGameOver, setIsGameOver] = useState(false)
  const [socketOrder, setSocketOrder] = useState<string[]>(INITIAL_SOCKET_ORDER)

  const isWinningRef = useRef(false)

  // 1. Background
  const bgTextureUrl = useKabelsalatBackground()

  // 2. Timer
  useKabelsalatTimer(
    connections,
    isPoweredOn,
    isGameOver,
    isWinningRef,
    setTimeLeft,
    setIsPoweredOn,
    setIsGameOver
  )

  // 3. Game End
  useKabelsalatGameEnd(isPoweredOn, isGameOver, timeLeft)

  // 4. Shuffle
  useKabelsalatShuffle(
    isPoweredOn,
    isGameOver,
    isShocked,
    connections,
    isWinningRef,
    setSocketOrder
  )

  // 5. Interactions
  const { handleCableClick, handleSocketClick } = useKabelsalatInteractions(
    t,
    isPoweredOn,
    isGameOver,
    isWinningRef,
    selectedCable,
    setSelectedCable,
    connections,
    setConnections,
    isShocked,
    setIsShocked,
    setFaultReason
  )

  // Lightning Seeds
  const lightningSeeds = useMemo(() => {
    if (isShocked) return generateLightningSeeds()
    return []
  }, [isShocked])

  return {
    t,
    selectedCable,
    connections,
    isShocked,
    faultReason,
    isPoweredOn,
    timeLeft,
    isGameOver,
    socketOrder,
    lightningSeeds,
    bgTextureUrl,
    handleCableClick,
    handleSocketClick,
    isPowerConnected: !!connections['power']
  }
}
