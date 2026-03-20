// TODO: Review this file
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../../context/GameState.jsx'
import { GAME_PHASES } from '../../context/gameConstants.js'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen.js'
import { loadTexture } from '../../components/stage/utils.js'
import { logger } from '../../utils/logger.js'
import { secureRandom } from '../../utils/crypto.js'
import {
  CABLE_MAP,
  SOCKET_DEFS,
  INITIAL_SOCKET_ORDER,
  TIME_LIMIT
} from './constants.js'
import { generateLightningSeeds } from './utils.js'

export const useKabelsalatState = () => {
  const { t } = useTranslation(['ui'])
  const { completeKabelsalatMinigame, changeScene } = useGameState()

  const [selectedCable, setSelectedCable] = useState(null)
  const [connections, setConnections] = useState({})
  const [isShocked, setIsShocked] = useState(false)
  const [faultReason, setFaultReason] = useState('')
  const [isPoweredOn, setIsPoweredOn] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [isGameOver, setIsGameOver] = useState(false)
  const [socketOrder, setSocketOrder] = useState(INITIAL_SOCKET_ORDER)
  const [bgTextureUrl, setBgTextureUrl] = useState(null)

  const unconnectedIds = useMemo(() => {
    return INITIAL_SOCKET_ORDER.filter(id => !connections[id])
  }, [connections])

  const randomFnRef = useRef(Math.random)

  useEffect(() => {
    try {
      secureRandom()
      randomFnRef.current = secureRandom
    } catch (e) {
      logger.warn('secureRandom unavailable, falling back to Math.random()', e)
      randomFnRef.current = Math.random
    }
  }, [])

  const timerRef = useRef(null)
  const finishedRef = useRef(false)
  const isWinningRef = useRef(false)
  const shockTimeoutRef = useRef(null)
  const transitionedRef = useRef(false)

  // Lightning Seeds
  const lightningSeeds = useMemo(() => {
    if (isShocked) return generateLightningSeeds()
    return []
  }, [isShocked])

  // Timer Logic
  useEffect(() => {
    if (
      !isPoweredOn &&
      !isGameOver &&
      !isWinningRef.current &&
      !finishedRef.current
    ) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            if (!finishedRef.current && !isWinningRef.current) {
              finishedRef.current = true
              setIsGameOver(true)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPoweredOn, isGameOver])

  // Process success scenario
  useEffect(() => {
    if (Object.keys(connections).length === Object.keys(SOCKET_DEFS).length) {
      if (timerRef.current) clearInterval(timerRef.current)
      isWinningRef.current = true

      const animTimer = setTimeout(() => {
        setIsPoweredOn(true)
      }, 600)
      return () => clearTimeout(animTimer)
    }
  }, [connections])

  const timeLeftRef = useRef(timeLeft)
  useEffect(() => {
    timeLeftRef.current = timeLeft
  }, [timeLeft])

  const handleGameEnd = useCallback(
    (delay, isPowered) => {
      const timer = setTimeout(() => {
        try {
          completeKabelsalatMinigame({
            isPoweredOn: isPowered,
            timeLeft: isPowered ? timeLeftRef.current : 0
          })
        } catch (error) {
          import('../../utils/errorHandler.js')
            .then(({ handleError, StateError }) => {
              const wrappedError =
                error instanceof Error ? error : new Error(String(error))
              handleError(
                new StateError('Failed to complete minigame', {
                  originalError: wrappedError
                })
              )
            })
            .catch(err => {
              const fallback =
                err instanceof Error ? err : new Error(String(err))
              try {
                const fallbackStateError = new Error(
                  'Failed to complete minigame (import error)'
                )
                console.error(fallback, fallbackStateError)
              } catch (_e) {
                // Ignore fallback error
              }
            })
        } finally {
          changeScene(GAME_PHASES.GIG)
        }
      }, delay)
      return timer
    },
    [completeKabelsalatMinigame, changeScene]
  )

  // End Game Effects
  useEffect(() => {
    if (isPoweredOn && !transitionedRef.current) {
      transitionedRef.current = true
      const timer = handleGameEnd(2500, true)
      return () => clearTimeout(timer)
    }
  }, [isPoweredOn, handleGameEnd])

  useEffect(() => {
    if (isGameOver && !transitionedRef.current) {
      transitionedRef.current = true
      const timer = handleGameEnd(3500, false)
      return () => clearTimeout(timer)
    }
  }, [isGameOver, handleGameEnd])

  // Background Texture
  useEffect(() => {
    let isMounted = true
    const fetchTexture = async () => {
      let rawUrl
      try {
        rawUrl = getGenImageUrl(IMG_PROMPTS.MINIGAME_KABELSALAT_BG)
        const texture = await loadTexture(rawUrl)
        if (isMounted && texture && texture.source && texture.source.resource) {
          setBgTextureUrl(texture.source.resource.src || rawUrl)
        } else if (isMounted) {
          setBgTextureUrl(rawUrl)
        }
      } catch (err) {
        logger.warn('Failed to load Kabelsalat background texture', err)
        if (isMounted && rawUrl) {
          setBgTextureUrl(rawUrl)
        }
      }
    }
    fetchTexture()
    return () => {
      isMounted = false
    }
  }, [])

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
          const j = Math.floor(randomFnRef.current() * (i + 1))
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
  }, [isPoweredOn, isGameOver, isShocked, unconnectedIds, connections])

  // Shock Cleanup
  useEffect(() => {
    return () => {
      if (shockTimeoutRef.current) clearTimeout(shockTimeoutRef.current)
    }
  }, [])

  const triggerShock = useCallback(reason => {
    setIsShocked(true)
    setFaultReason(reason)
    setSelectedCable(null)
    setConnections({})

    if (shockTimeoutRef.current) {
      clearTimeout(shockTimeoutRef.current)
    }

    shockTimeoutRef.current = setTimeout(() => {
      setIsShocked(false)
      setFaultReason('')
      shockTimeoutRef.current = null
    }, 1200)
  }, [])

  const handleCableClick = useCallback(
    cableId => {
      if (isShocked || isPoweredOn || isGameOver) return

      // Performance: use Object iteration to find and remove connections in one pass
      let connectionSocketId
      for (const key in connections) {
        if (Object.hasOwn(connections, key) && connections[key] === cableId) {
          connectionSocketId = key
          break
        }
      }

      if (connectionSocketId) {
        setConnections(prev => {
          let socketIdToRemove
          for (const key in prev) {
            if (Object.hasOwn(prev, key) && prev[key] === cableId) {
              socketIdToRemove = key
              break
            }
          }
          if (socketIdToRemove) {
            const newConn = { ...prev }
            delete newConn[socketIdToRemove]
            return newConn
          }
          return prev
        })
        setSelectedCable(null)
        return
      }
      setSelectedCable(prev => (prev === cableId ? null : cableId))
    },
    [isShocked, isPoweredOn, isGameOver, connections]
  )

  const handleSocketClick = useCallback(
    socketId => {
      if (isShocked || isPoweredOn || isGameOver || !selectedCable) return
      if (connections[socketId]) return

      const targetSocket = SOCKET_DEFS[socketId]
      const incomingCable = CABLE_MAP[selectedCable]

      const hasPower = !!connections['power']
      const hasAmp = !!connections['amp']

      if (targetSocket.type !== incomingCable.type) {
        triggerShock(t('ui:minigames.kabelsalat.errors.wrongCable'))
        return
      }

      if (!hasPower && targetSocket.id !== 'power') {
        triggerShock(t('ui:minigames.kabelsalat.errors.noPower'))
        return
      }

      if (
        hasPower &&
        !hasAmp &&
        (targetSocket.id === 'mic' || targetSocket.id === 'synth')
      ) {
        triggerShock(t('ui:minigames.kabelsalat.errors.noAmp'))
        return
      }

      setConnections(prev => ({ ...prev, [socketId]: selectedCable }))
      setSelectedCable(null)
    },
    [
      isShocked,
      isPoweredOn,
      isGameOver,
      selectedCable,
      connections,
      triggerShock,
      t
    ]
  )

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
