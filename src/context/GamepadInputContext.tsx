/**
 * Central Gamepad Input Context & Provider.
 * Manages central RAF loop, priority chain routing, spatial navigation,
 * device connection lifecycle, and source-aware updates.
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  type ReactNode
} from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from './GameState'
import {
  getSafeGamepads,
  normalizeGamepad,
  mergeNormalizedGamepads,
  applyRadialDeadzone,
  evaluateDirectionHysteresis,
  ArmedEdges,
  DirectionRepeater,
  detectLayoutFamily,
  BUTTON_CONFIRM,
  BUTTON_BACK,
  BUTTON_HELP,
  BUTTON_START,
  BUTTON_DPAD_UP,
  BUTTON_DPAD_DOWN,
  BUTTON_DPAD_LEFT,
  BUTTON_DPAD_RIGHT,
  AXIS_LEFT_X,
  AXIS_LEFT_Y,
  RESERVED_START_BUTTON,
  type NormalizedGamepad,
  type DirectionName,
  type LayoutFamily
} from '../utils/gamepad'
import {
  useActiveInputSource,
  setActiveInputSource
} from '../utils/gamepad/inputSourceStore'
import {
  hasActiveModal,
  closeTopmostModal
} from '../ui/shared/useModalBehavior'
import {
  getSpatialNextTarget,
  getInitialFocusTarget
} from '../utils/gamepad/spatialNavigation'
import {
  startHold,
  stopActiveHold,
  getDeadmanHold
} from '../utils/gamepad/holdRegistry'
import { GamepadTextEntry } from '../components/gamepad/GamepadTextEntry'

export interface GamepadActionHandlers {
  onBack?: () => boolean | void
  onMenu?: () => boolean | void
  onLane?: (laneIndex: number, isPressed: boolean) => boolean | void
  onDirection?: (direction: DirectionName, isRepeat: boolean) => boolean | void
  onHelp?: () => boolean | void
  onDisconnect?: () => void
}

export interface GamepadActionOptions {
  enabled?: boolean
  consumes?: boolean
  priority?: number
}

interface ConsumerRegistration {
  id: symbol
  handlers: GamepadActionHandlers
  options: GamepadActionOptions
  heldLanes: Set<number>
}

interface GamepadContextValue {
  connectedPads: NormalizedGamepad[]
  activeLayoutFamily: LayoutFamily
  isCapturingBinding: boolean
  startBindingCapture: (onCaptured: (buttonIndex: number) => void) => void
  cancelBindingCapture: () => void
  registerHandlers: (
    handlers: GamepadActionHandlers,
    options?: GamepadActionOptions
  ) => () => void
}

const GamepadContext = createContext<GamepadContextValue | null>(null)

export function useGamepadInputOptional(): GamepadContextValue | null {
  return useContext(GamepadContext)
}

export function useGamepadInput(): GamepadContextValue {
  const ctx = useGamepadInputOptional()
  if (!ctx) {
    throw new Error('useGamepadInput must be used within GamepadInputProvider')
  }
  return ctx
}

export function useGamepadActions(
  handlers: GamepadActionHandlers,
  options: GamepadActionOptions = {}
): void {
  const ctx = useGamepadInputOptional()
  const handlersRef = useRef(handlers)
  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    if (!ctx) return
    return ctx.registerHandlers(
      {
        onBack: () => handlersRef.current.onBack?.(),
        onMenu: () => handlersRef.current.onMenu?.(),
        onLane: (lane, pressed) => handlersRef.current.onLane?.(lane, pressed),
        onDirection: (dir, repeat) =>
          handlersRef.current.onDirection?.(dir, repeat),
        onHelp: () => handlersRef.current.onHelp?.(),
        onDisconnect: () => handlersRef.current.onDisconnect?.()
      },
      options
    )
  }, [ctx, options.enabled, options.priority, options.consumes])
}

export const GamepadInputProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation()
  const { addToast } = useGameActions()
  const gamepadLaneBindings = useGameSelector(
    state => state.settings.gamepadLaneBindings
  )

  const [connectedPads, setConnectedPads] = useState<NormalizedGamepad[]>([])
  const [activeLayoutFamily, setActiveLayoutFamily] =
    useState<LayoutFamily>('xbox')

  // Capture mode state for rebinding
  const [captureCallback, setCaptureCallback] = useState<
    ((btnIndex: number) => void) | null
  >(null)
  const isCapturingBinding = captureCallback !== null

  // Text entry modal state
  const [textEntryState, setTextEntryState] = useState<{
    isOpen: boolean
    initialValue: string
    maxLength?: number
    targetInput: HTMLInputElement | HTMLTextAreaElement | null
  }>({
    isOpen: false,
    initialValue: '',
    targetInput: null
  })

  const consumersRef = useRef<ConsumerRegistration[]>([])
  const armedEdgesRef = useRef(new ArmedEdges())
  const repeaterRef = useRef(new DirectionRepeater())
  const currentDirectionRef = useRef<DirectionName | null>(null)
  const knownPadsMapRef = useRef<Map<number, string>>(new Map())
  const activeHoldButtonRef = useRef<HTMLButtonElement | null>(null)

  const activeInputSource = useActiveInputSource()

  const startBindingCapture = useCallback(
    (onCaptured: (buttonIndex: number) => void) => {
      armedEdgesRef.current.disarmAll()
      setCaptureCallback(() => onCaptured)
    },
    []
  )

  const cancelBindingCapture = useCallback(() => {
    setCaptureCallback(null)
  }, [])

  const registerHandlers = useCallback(
    (handlers: GamepadActionHandlers, options: GamepadActionOptions = {}) => {
      const reg: ConsumerRegistration = {
        id: Symbol('consumer'),
        handlers,
        options: { enabled: true, consumes: true, priority: 10, ...options },
        heldLanes: new Set()
      }
      armedEdgesRef.current.disarmAll()
      consumersRef.current.push(reg)
      consumersRef.current.sort(
        (a, b) => (b.options.priority ?? 10) - (a.options.priority ?? 10)
      )

      return () => {
        // Deliver pending releases on unregistration
        if (reg.heldLanes.size > 0) {
          for (const lane of reg.heldLanes) {
            reg.handlers.onLane?.(lane, false)
          }
          reg.heldLanes.clear()
        }
        const idx = consumersRef.current.findIndex(c => c.id === reg.id)
        if (idx !== -1) {
          consumersRef.current.splice(idx, 1)
        }
      }
    },
    []
  )

  // Device discovery & connection handler
  const syncDevices = useCallback(() => {
    const rawPads = getSafeGamepads()
    const normalized: NormalizedGamepad[] = []
    const knownMap = knownPadsMapRef.current

    for (const raw of rawPads) {
      if (!raw) continue
      const pad = normalizeGamepad(raw)
      if (pad && pad.connected) {
        normalized.push(pad)
        if (!knownMap.has(pad.index)) {
          // New connection / reconnection
          const isReconnect = knownMap.size > 0
          knownMap.set(pad.index, pad.id)
          const family = detectLayoutFamily(pad.id)
          setActiveLayoutFamily(family)

          const connMsg = isReconnect
            ? t('controller.reconnected', {
                name: pad.id,
                defaultValue: `Controller reconnected: ${pad.id}`
              })
            : t('controller.connected', {
                name: pad.id,
                defaultValue: `Controller connected: ${pad.id}`
              })
          addToast(connMsg, 'info')

          if (pad.mapping !== 'standard') {
            addToast(
              t('controller.nonStandardMapping', {
                defaultValue: 'Non-standard controller mapping detected'
              }),
              'warning'
            )
          }
        }
      }
    }

    // Check for disconnects
    for (const [index, padId] of Array.from(knownMap.entries())) {
      const stillPresent = normalized.some(p => p.index === index)
      if (!stillPresent) {
        knownMap.delete(index)
        addToast(
          t('controller.disconnected', {
            name: padId,
            defaultValue: `Controller disconnected: ${padId}`
          }),
          'warning'
        )
        // Notify disconnect handlers
        for (const consumer of consumersRef.current) {
          if (consumer.options.enabled !== false) {
            consumer.handlers.onDisconnect?.()
          }
        }
      }
    }

    setConnectedPads(prev => {
      if (
        prev.length === normalized.length &&
        prev.every(
          (p, i) =>
            p.index === normalized[i]?.index && p.id === normalized[i]?.id
        )
      ) {
        return prev
      }
      return normalized
    })
    return normalized
  }, [addToast, t])

  useEffect(() => {
    syncDevices()

    const onConnect = () => syncDevices()
    const onDisconnect = () => {
      syncDevices()
      // Release active holds on disconnect
      stopActiveHold()
      if (activeHoldButtonRef.current) {
        activeHoldButtonRef.current = null
      }
    }

    window.addEventListener('gamepadconnected', onConnect)
    window.addEventListener('gamepaddisconnected', onDisconnect)

    return () => {
      window.removeEventListener('gamepadconnected', onConnect)
      window.removeEventListener('gamepaddisconnected', onDisconnect)
    }
  }, [syncDevices])

  // Polling RAF loop
  useEffect(() => {
    let animationFrameId: number | null = null
    let isMounted = true

    const tick = (timestamp: number) => {
      if (!isMounted) return

      if (document.hidden) {
        if (isMounted) animationFrameId = requestAnimationFrame(tick)
        return
      }

      const rawPads = getSafeGamepads()
      const normalizedPads = rawPads
        .map(normalizeGamepad)
        .filter((p): p is NormalizedGamepad => Boolean(p && p.connected))

      if (normalizedPads.length === 0) {
        animationFrameId = null
        return
      }

      const merged = mergeNormalizedGamepads(normalizedPads)

      // Check if any button or axis was used to switch active input source to 'gamepad'
      const hasGamepadActivity =
        merged.buttons.some(b => b.pressed) ||
        merged.axes.some(a => Math.abs(a) > 0.3)

      if (hasGamepadActivity && activeInputSource !== 'gamepad') {
        setActiveInputSource('gamepad')
      }

      // Handle Directional Navigation & Hysteresis
      const deadzoneRes = applyRadialDeadzone(
        merged.axes[AXIS_LEFT_X] ?? 0,
        merged.axes[AXIS_LEFT_Y] ?? 0,
        0.25
      )

      let axisDir: DirectionName | null = evaluateDirectionHysteresis(
        deadzoneRes.x,
        deadzoneRes.y,
        currentDirectionRef.current
      )

      // D-Pad override if active
      if (merged.buttons[BUTTON_DPAD_UP]?.pressed) axisDir = 'up'
      else if (merged.buttons[BUTTON_DPAD_DOWN]?.pressed) axisDir = 'down'
      else if (merged.buttons[BUTTON_DPAD_LEFT]?.pressed) axisDir = 'left'
      else if (merged.buttons[BUTTON_DPAD_RIGHT]?.pressed) axisDir = 'right'

      currentDirectionRef.current = axisDir

      const repeatResult = repeaterRef.current.update(axisDir, timestamp)

      if (repeatResult && repeatResult.direction) {
        const { direction, isRepeat } = repeatResult
        let consumed = false

        // Route direction through consumer priority chain
        for (const consumer of consumersRef.current) {
          if (consumer.options.enabled === false) continue
          if (consumer.handlers.onDirection) {
            const handled = consumer.handlers.onDirection(direction, isRepeat)
            if (handled || consumer.options.consumes) {
              consumed = true
              break
            }
          }
        }

        // Spatial UI Navigation fallback if not consumed
        if (!consumed) {
          const activeEl = document.activeElement as HTMLElement | null
          if (activeEl && activeEl !== document.body) {
            if (activeEl instanceof HTMLInputElement && activeEl.type === 'range') {
              if (direction === 'left') {
                activeEl.stepDown()
                activeEl.dispatchEvent(new Event('input', { bubbles: true }))
                activeEl.dispatchEvent(new Event('change', { bubbles: true }))
              } else if (direction === 'right') {
                activeEl.stepUp()
                activeEl.dispatchEvent(new Event('input', { bubbles: true }))
                activeEl.dispatchEvent(new Event('change', { bubbles: true }))
              } else {
                const next = getSpatialNextTarget(activeEl, direction)
                next?.focus()
              }
            } else if (activeEl instanceof HTMLSelectElement) {
              if (direction === 'left') {
                if (activeEl.selectedIndex > 0) {
                  activeEl.selectedIndex -= 1
                  activeEl.dispatchEvent(new Event('change', { bubbles: true }))
                }
              } else if (direction === 'right') {
                if (activeEl.selectedIndex < activeEl.options.length - 1) {
                  activeEl.selectedIndex += 1
                  activeEl.dispatchEvent(new Event('change', { bubbles: true }))
                }
              } else {
                const next = getSpatialNextTarget(activeEl, direction)
                next?.focus()
              }
            } else if (activeEl.getAttribute('role') === 'tab') {
              if (direction === 'left' || direction === 'right') {
                const key = direction === 'left' ? 'ArrowLeft' : 'ArrowRight'
                activeEl.dispatchEvent(
                  new KeyboardEvent('keydown', { key, bubbles: true })
                )
              } else {
                const next = getSpatialNextTarget(activeEl, direction)
                next?.focus()
              }
            } else {
              const next = getSpatialNextTarget(activeEl, direction)
              next?.focus()
            }
          } else {
            const initTarget = getInitialFocusTarget()
            initTarget?.focus()
          }
        }
      }

      // Process Button Edges
      const modalActive = hasActiveModal()
      const armed = armedEdgesRef.current

      for (let btnIdx = 0; btnIdx < merged.buttons.length; btnIdx++) {
        const btnState = merged.buttons[btnIdx]
        const isPressed = Boolean(btnState?.pressed)
        const { pressEdge, releaseEdge } = armed.processInput(btnIdx, isPressed)

        // Capture Mode Rebinding check
        if (pressEdge && captureCallback) {
          if (btnIdx !== RESERVED_START_BUTTON) {
            const cb = captureCallback
            setCaptureCallback(null)
            cb(btnIdx)
          }
          continue
        }

        // Check Lane Bindings (Guitar, Drums, Bass)
        const laneIdx = gamepadLaneBindings.indexOf(btnIdx)
        if (laneIdx !== -1) {
          if (modalActive) {
            // While modal is active, send gameplay adapters ONLY release edges
            if (releaseEdge) {
              for (const consumer of consumersRef.current) {
                if (consumer.options.enabled !== false && consumer.handlers.onLane) {
                  if (consumer.heldLanes.has(laneIdx)) {
                    consumer.handlers.onLane(laneIdx, false)
                    consumer.heldLanes.delete(laneIdx)
                  }
                }
              }
            }
          } else {
            if (pressEdge || releaseEdge) {
              for (const consumer of consumersRef.current) {
                if (consumer.options.enabled !== false && consumer.handlers.onLane) {
                  const handled = consumer.handlers.onLane(laneIdx, isPressed)
                  if (isPressed) consumer.heldLanes.add(laneIdx)
                  else consumer.heldLanes.delete(laneIdx)
                  if (handled || consumer.options.consumes) break
                }
              }
            }
          }
        }

        // Button 0 (Confirm)
        if (btnIdx === BUTTON_CONFIRM) {
          if (pressEdge) {
            const activeEl = document.activeElement as HTMLElement | null
            if (activeEl) {
              // 1. Check DeadmanButton hold registry
              if (activeEl instanceof HTMLButtonElement) {
                const hold = getDeadmanHold(activeEl)
                if (hold) {
                  startHold(activeEl)
                  activeHoldButtonRef.current = activeEl
                } else {
                  activeEl.click()
                }
              } else if (
                activeEl instanceof HTMLInputElement ||
                activeEl instanceof HTMLTextAreaElement
              ) {
                if (
                  activeEl.type === 'text' ||
                  activeEl.type === 'search' ||
                  activeEl.tagName === 'TEXTAREA'
                ) {
                  setTextEntryState({
                    isOpen: true,
                    initialValue: activeEl.value,
                    maxLength: activeEl.maxLength > 0 ? activeEl.maxLength : 50,
                    targetInput: activeEl
                  })
                } else {
                  activeEl.click()
                }
              } else {
                activeEl.click()
              }
            } else {
              const initTarget = getInitialFocusTarget()
              initTarget?.focus()
            }
          } else if (releaseEdge) {
            stopActiveHold()
            activeHoldButtonRef.current = null
          }
        }

        // Button 1 (Back)
        if (btnIdx === BUTTON_BACK) {
          if (pressEdge) {
            let handled = false
            for (const consumer of consumersRef.current) {
              if (consumer.options.enabled !== false && consumer.handlers.onBack) {
                const res = consumer.handlers.onBack()
                if (res || consumer.options.consumes) {
                  handled = true
                  break
                }
              }
            }
            if (!handled && modalActive) {
              closeTopmostModal()
            }
          }
        }

        // Button 8 (Help)
        if (btnIdx === BUTTON_HELP) {
          if (pressEdge && !modalActive) {
            for (const consumer of consumersRef.current) {
              if (consumer.options.enabled !== false && consumer.handlers.onHelp) {
                const res = consumer.handlers.onHelp()
                if (res || consumer.options.consumes) break
              }
            }
          }
        }

        // Button 9 (Start / Menu)
        if (btnIdx === BUTTON_START) {
          if (pressEdge) {
            let handled = false
            for (const consumer of consumersRef.current) {
              if (consumer.options.enabled !== false && consumer.handlers.onMenu) {
                const res = consumer.handlers.onMenu()
                if (res || consumer.options.consumes) {
                  handled = true
                  break
                }
              }
            }
            if (!handled) {
              if (modalActive) {
                closeTopmostModal()
              }
            }
          }
        }
      }

      if (isMounted) {
        animationFrameId = requestAnimationFrame(tick)
      }
    }

    if (connectedPads.length > 0) {
      animationFrameId = requestAnimationFrame(tick)
    }

    const onBlurOrHide = () => {
      stopActiveHold()
      activeHoldButtonRef.current = null
      repeaterRef.current.reset()
      armedEdgesRef.current.disarmAll()

      // Deliver releases to all consumers holding lanes
      for (const consumer of consumersRef.current) {
        if (consumer.heldLanes.size > 0) {
          for (const lane of consumer.heldLanes) {
            consumer.handlers.onLane?.(lane, false)
          }
          consumer.heldLanes.clear()
        }
      }
    }

    window.addEventListener('blur', onBlurOrHide)
    document.addEventListener('visibilitychange', onBlurOrHide)

    return () => {
      isMounted = false
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
      window.removeEventListener('blur', onBlurOrHide)
      document.removeEventListener('visibilitychange', onBlurOrHide)
      onBlurOrHide()
    }
  }, [
    connectedPads.length,
    activeInputSource,
    gamepadLaneBindings,
    captureCallback,
    t
  ])

  const contextValue = useMemo<GamepadContextValue>(
    () => ({
      connectedPads,
      activeLayoutFamily,
      isCapturingBinding,
      startBindingCapture,
      cancelBindingCapture,
      registerHandlers
    }),
    [
      connectedPads,
      activeLayoutFamily,
      isCapturingBinding,
      startBindingCapture,
      cancelBindingCapture,
      registerHandlers
    ]
  )

  return (
    <GamepadContext.Provider value={contextValue}>
      {children}
      <GamepadTextEntry
        isOpen={textEntryState.isOpen}
        initialValue={textEntryState.initialValue}
        maxLength={textEntryState.maxLength}
        targetInput={textEntryState.targetInput}
        onClose={() =>
          setTextEntryState(prev => ({ ...prev, isOpen: false }))
        }
      />
    </GamepadContext.Provider>
  )
}
