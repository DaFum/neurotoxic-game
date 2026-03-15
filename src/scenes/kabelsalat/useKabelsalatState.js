import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../../context/GameState.jsx'
import { GAME_PHASES } from '../../context/gameConstants.js'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen.js'
import { loadTexture } from '../../components/stage/utils.js'
import { logger } from '../../utils/logger.js'
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
  const [lightningSeeds, setLightningSeeds] = useState([])
  const [bgTextureUrl, setBgTextureUrl] = useState(null)

  const timerRef = useRef(null)
  const finishedRef = useRef(false)
  const isWinningRef = useRef(false)
  const shockTimeoutRef = useRef(null)
  const transitionedRef = useRef(false)

  // Lightning Seeds
  useEffect(() => {
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setLightningSeeds(prev => {
      if (isShocked && prev.length === 0) return generateLightningSeeds()
      if (!isShocked && prev.length > 0) return []
      return prev
    })
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

  // End Game Effects
  useEffect(() => {
    if (isPoweredOn && !transitionedRef.current) {
      transitionedRef.current = true
      const timer = setTimeout(() => {
        try {
          completeKabelsalatMinigame({ isPoweredOn: true, timeLeft })
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
                changeScene(GAME_PHASES.GIG)
              } catch (_e) {
                // Ignore fallback error
              }
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
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [isPoweredOn, timeLeft, completeKabelsalatMinigame, changeScene])

  useEffect(() => {
    if (isGameOver && !transitionedRef.current) {
      transitionedRef.current = true
      const timer = setTimeout(() => {
        try {
          completeKabelsalatMinigame({ isPoweredOn: false, timeLeft: 0 })
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
                changeScene(GAME_PHASES.GIG)
              } catch (_e) {
                // Ignore fallback error
              }
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
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [isGameOver, completeKabelsalatMinigame, changeScene])

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
    if (isPoweredOn || isGameOver || isShocked || isWinningRef.current) return

    const interval = setInterval(() => {
      setSocketOrder(prevOrder => {
        const unconnected = prevOrder.filter(id => !connections[id])
        if (unconnected.length <= 1) return prevOrder

        const shuffled = [...unconnected].sort(() => Math.random() - 0.5)

        let shuffleIndex = 0
        return prevOrder.map(id => {
          if (connections[id]) return id
          return shuffled[shuffleIndex++]
        })
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [connections, isPoweredOn, isGameOver, isShocked])

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

      // Optimization: Avoid Object.values/Object.keys inside the hot handler
      let isConnected = false
      for (const key in connections) {
        if (connections[key] === cableId) {
          isConnected = true
          break
        }
      }

      if (isConnected) {
        setConnections(prev => {
          const newConn = { ...prev }
          let socketIdToRemove
          for (const key in newConn) {
            if (newConn[key] === cableId) {
              socketIdToRemove = key
              break
            }
          }
          if (socketIdToRemove) {
            delete newConn[socketIdToRemove]
          }
          return newConn
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
