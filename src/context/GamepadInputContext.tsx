import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from './GameState'
import { GamepadContext } from '../hooks/gamepad/GamepadContext'
import type {
  GamepadConsumer,
  GamepadStatus
} from '../hooks/gamepad/GamepadContext'
import { DEFAULT_GAMEPAD_LANE_BINDINGS } from '../utils/gamepad/constants'
import { GAMEPAD_BUTTON } from '../utils/gamepad/constants'
import {
  createButtonEdges,
  createDirectionRepeater,
  directionFromStick,
  filterStick,
  getLayoutFamily,
  mergeGamepads,
  normalizeGamepad,
  readGamepads
} from '../utils/gamepad/logic'
import type { Direction, GamepadSnapshot } from '../utils/gamepad/logic'
import {
  getActiveInputSource,
  setActiveInputSource
} from '../utils/gamepad/inputSource'
import {
  activateGamepadElement,
  moveGamepadFocus
} from '../utils/gamepad/navigation'
import {
  closeTopmostModal,
  getActiveFocusScope,
  hasActiveModal
} from '../ui/shared/useModalBehavior'
import { GamepadTextEntry } from '../ui/shared/GamepadTextEntry'

export function GamepadInputProvider({ children }: { children: ReactNode }) {
  const { addToast } = useGameActions()
  const bindings =
    useGameSelector(state => state.settings?.gamepadLaneBindings) ??
    DEFAULT_GAMEPAD_LANE_BINDINGS
  const { t } = useTranslation('ui')
  const toastRef = useRef(addToast)
  const tRef = useRef(t)
  useEffect(() => {
    toastRef.current = addToast
    tRef.current = t
  }, [addToast, t])
  const [status, setStatus] = useState<GamepadStatus>({
    available: true,
    devices: []
  })
  const [textTarget, setTextTarget] = useState<
    HTMLInputElement | HTMLTextAreaElement | null
  >(null)
  const consumersRef = useRef<GamepadConsumer[]>([])
  const captureRef = useRef<((button: number) => void) | null>(null)
  const edgesRef = useRef(createButtonEdges())
  const releasesRef = useRef(new Map<number, () => void>())
  const snapshotsRef = useRef(new Map<number, GamepadSnapshot>())
  const repeatRef = useRef(createDirectionRepeater())
  const directionRef = useRef<Direction | null>(null)
  const activeHoldScopeRef = useRef<HTMLElement | null>(null)
  const activeHoldElementRef = useRef<HTMLElement | null>(null)
  const directionArmedRef = useRef(false)
  const reset = useCallback(() => {
    for (const release of releasesRef.current.values()) release()
    releasesRef.current.clear()
    edgesRef.current.rearm()
    repeatRef.current(null, 0)
    directionRef.current = null
    activeHoldScopeRef.current = null
    activeHoldElementRef.current = null
    directionArmedRef.current = false
  }, [])
  const register = useCallback(
    (consumer: GamepadConsumer) => {
      reset()
      edgesRef.current.update(mergeGamepads([...snapshotsRef.current.values()]))
      consumersRef.current.push(consumer)
      return () => {
        reset()
        consumersRef.current = consumersRef.current.filter(
          item => item !== consumer
        )
      }
    },
    [reset]
  )
  const capture = useCallback(
    (callback: (button: number) => void) => {
      reset()
      edgesRef.current.update(mergeGamepads([...snapshotsRef.current.values()]))
      captureRef.current = callback
      return () => {
        if (captureRef.current === callback) {
          captureRef.current = null
          reset()
        }
      }
    },
    [reset]
  )
  const context = useMemo(
    () => ({ register, capture, status, bindings }),
    [register, capture, status, bindings]
  )

  useEffect(() => {
    let raf: number | null = null
    let focused = true
    let disposed = false
    const seen = new Set<string>()
    let statusKey = ''
    const updateStatus = (available: boolean, pads: GamepadSnapshot[]) => {
      const devices = pads.map(pad => ({
        index: pad.index,
        id: pad.id,
        standard: pad.standard,
        family: getLayoutFamily(pad.id)
      }))
      const key = JSON.stringify([available, devices])
      if (key !== statusKey) {
        statusKey = key
        setStatus({ available, devices })
      }
    }
    const notify = (key: string, fallback: string, id: string) =>
      toastRef.current(
        tRef.current(`ui:controller.${key}`, { defaultValue: fallback, id }),
        'info'
      )
    const route = (button: number, pressed: boolean) => {
      if (!pressed) {
        releasesRef.current.get(button)?.()
        releasesRef.current.delete(button)
        return
      }
      setActiveInputSource('gamepad')
      if (captureRef.current) {
        captureRef.current(button)
        return
      }
      const scope = getActiveFocusScope()
      if (hasActiveModal()) {
        if (button === GAMEPAD_BUTTON.EAST) closeTopmostModal()
        else if (
          button === GAMEPAD_BUTTON.START &&
          scope[0]?.hasAttribute('data-gamepad-pause')
        )
          closeTopmostModal()
        else if (button === GAMEPAD_BUTTON.SOUTH) {
          const focusedElement = document.activeElement
          if (
            !(
              focusedElement instanceof HTMLElement ||
              focusedElement instanceof SVGElement
            ) ||
            !scope.some(root => root.contains(focusedElement))
          )
            return
          if (
            (focusedElement instanceof HTMLInputElement &&
              ['text', 'search', 'email', 'url', 'tel'].includes(
                focusedElement.type
              )) ||
            focusedElement instanceof HTMLTextAreaElement
          )
            setTextTarget(focusedElement)
          else {
            const stop = activateGamepadElement(focusedElement as HTMLElement)
            if (stop) {
              releasesRef.current.set(button, stop)
              activeHoldScopeRef.current = scope[0] ?? null
              activeHoldElementRef.current = focusedElement as HTMLElement
            }
          }
        }
        return
      }
      const ordered = [...consumersRef.current].reverse()
      const consumer = ordered.find(
        item => item.kind === 'gameplay' && item.consumes.includes(button)
      )
      const onButton = consumer?.handlers.current.onButton
      const onLane = consumer?.handlers.current.onLane
      if (
        consumer &&
        button === GAMEPAD_BUTTON.START &&
        consumer.handlers.current.onMenu
      ) {
        consumer.handlers.current.onMenu()
        return
      }
      if (
        consumer &&
        button === GAMEPAD_BUTTON.EAST &&
        consumer.handlers.current.onBack
      ) {
        consumer.handlers.current.onBack()
        return
      }
      if (onButton) {
        onButton(button, true)
        releasesRef.current.set(button, () => onButton(button, false))
        return
      }
      if (consumer && onLane) {
        const lane = consumer.consumes.indexOf(button)
        onLane(lane, true)
        releasesRef.current.set(button, () => onLane(lane, false))
        return
      }
      const scene = ordered.find(
        item =>
          item.kind === 'scene' &&
          (button === GAMEPAD_BUTTON.EAST
            ? item.handlers.current.onBack
            : button === GAMEPAD_BUTTON.START
              ? item.handlers.current.onMenu
              : button === GAMEPAD_BUTTON.BACK
                ? item.handlers.current.onHelp
                : false)
      )
      if (button === GAMEPAD_BUTTON.EAST) scene?.handlers.current.onBack?.()
      else if (button === GAMEPAD_BUTTON.START)
        scene?.handlers.current.onMenu?.()
      else if (button === GAMEPAD_BUTTON.BACK)
        scene?.handlers.current.onHelp?.()
      else if (button === GAMEPAD_BUTTON.SOUTH) {
        const element = document.activeElement
        if (
          !(element instanceof HTMLElement || element instanceof SVGElement) ||
          !scope.some(root => root.contains(element))
        )
          return
        if (
          (element instanceof HTMLInputElement &&
            ['text', 'search', 'email', 'url', 'tel'].includes(element.type)) ||
          element instanceof HTMLTextAreaElement
        )
          setTextTarget(element)
        else {
          const stop = activateGamepadElement(element as HTMLElement)
          if (stop) {
            releasesRef.current.set(button, stop)
            activeHoldScopeRef.current = scope[0] ?? null
            activeHoldElementRef.current = element as HTMLElement
          }
        }
      }
    }
    const poll = (now: number) => {
      raf = null
      if (disposed || !focused || document.hidden) return
      const result = readGamepads(navigator)
      const next = new Map<number, GamepadSnapshot>()
      for (const pad of result.pads)
        next.set(
          pad.index,
          normalizeGamepad(pad, snapshotsRef.current.get(pad.index))
        )
      const disconnected: GamepadSnapshot[] = []
      for (const [index, pad] of snapshotsRef.current)
        if (!next.has(index)) {
          disconnected.push(pad)
          notify('disconnected', 'Controller disconnected: {{id}}', pad.id)
        }
      for (const [index, pad] of next)
        if (!snapshotsRef.current.has(index)) {
          notify(
            seen.has(pad.id) ? 'reconnected' : 'connected',
            'Controller connected: {{id}}',
            pad.id
          )
          if (!pad.standard)
            notify(
              'nonStandard',
              'Controller mapping is non-standard; buttons may differ.',
              pad.id
            )
          seen.add(pad.id)
        }
      snapshotsRef.current = next
      const pads = [...next.values()]
      updateStatus(result.available, pads)
      const merged = mergeGamepads(pads)
      for (const edge of edgesRef.current.update(merged))
        route(edge.button, edge.pressed)
      if (disconnected.length && next.size === 0)
        for (const consumer of consumersRef.current)
          consumer.handlers.current.onDisconnect?.()
      const scope = getActiveFocusScope()
      if (
        activeHoldScopeRef.current &&
        (activeHoldScopeRef.current !== scope[0] ||
          document.activeElement !== activeHoldElementRef.current)
      ) {
        releasesRef.current.get(GAMEPAD_BUTTON.SOUTH)?.()
        releasesRef.current.delete(GAMEPAD_BUTTON.SOUTH)
        activeHoldScopeRef.current = null
        activeHoldElementRef.current = null
      }
      let nextDirection: Direction | null = null
      const buttonForNavigation = (button: number) =>
        merged[button] &&
        (hasActiveModal() ||
          !consumersRef.current.some(
            consumer =>
              consumer.kind === 'gameplay' && consumer.consumes.includes(button)
          ))
      if (buttonForNavigation(GAMEPAD_BUTTON.UP)) nextDirection = 'up'
      else if (buttonForNavigation(GAMEPAD_BUTTON.DOWN)) nextDirection = 'down'
      else if (buttonForNavigation(GAMEPAD_BUTTON.LEFT)) nextDirection = 'left'
      else if (buttonForNavigation(GAMEPAD_BUTTON.RIGHT))
        nextDirection = 'right'
      if (!nextDirection)
        for (const pad of pads) {
          const candidate = directionFromStick(
            filterStick(pad.stick),
            directionRef.current
          )
          if (candidate) {
            nextDirection = candidate
            break
          }
        }
      if (!nextDirection) directionArmedRef.current = true
      if (!directionArmedRef.current) nextDirection = null
      if (nextDirection && nextDirection !== directionRef.current)
        setActiveInputSource('gamepad')
      directionRef.current = nextDirection
      const repeated = repeatRef.current(nextDirection, now)
      if (repeated && !captureRef.current) {
        const ordered = [...consumersRef.current].reverse()
        const consumer =
          !hasActiveModal() &&
          (ordered.find(
            item =>
              item.kind === 'gameplay' && item.handlers.current.onDirection
          ) ??
            ordered.find(
              item => item.kind === 'scene' && item.handlers.current.onDirection
            ))
        if (consumer) consumer.handlers.current.onDirection?.(repeated)
        else moveGamepadFocus(repeated, scope)
      }
      if (pads.length) raf = requestAnimationFrame(poll)
    }
    const start = () => {
      if (raf === null && focused && !document.hidden)
        raf = requestAnimationFrame(poll)
    }
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf)
      raf = null
      reset()
    }
    const blur = () => {
      focused = false
      stop()
    }
    const focus = () => {
      focused = true
      edgesRef.current.rearm()
      start()
    }
    const visibility = () => {
      if (document.hidden) stop()
      else {
        edgesRef.current.rearm()
        start()
      }
    }
    const connected = () => start()
    const keyboard = (event: KeyboardEvent) => {
      if (event.isTrusted) setActiveInputSource('keyboard')
    }
    const pointer = (event: PointerEvent) =>
      setActiveInputSource(event.pointerType === 'touch' ? 'touch' : 'pointer')
    window.addEventListener('gamepadconnected', connected)
    window.addEventListener('gamepaddisconnected', connected)
    window.addEventListener('blur', blur)
    window.addEventListener('focus', focus)
    window.addEventListener('keydown', keyboard)
    window.addEventListener('pointerdown', pointer)
    document.addEventListener('visibilitychange', visibility)
    document.documentElement.dataset.inputSource = getActiveInputSource()
    poll(performance.now())
    return () => {
      disposed = true
      stop()
      snapshotsRef.current.clear()
      window.removeEventListener('gamepadconnected', connected)
      window.removeEventListener('gamepaddisconnected', connected)
      window.removeEventListener('blur', blur)
      window.removeEventListener('focus', focus)
      window.removeEventListener('keydown', keyboard)
      window.removeEventListener('pointerdown', pointer)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [reset])
  return (
    <GamepadContext value={context}>
      {children}
      {textTarget && (
        <GamepadTextEntry
          target={textTarget}
          onClose={() => setTextTarget(null)}
        />
      )}
    </GamepadContext>
  )
}
