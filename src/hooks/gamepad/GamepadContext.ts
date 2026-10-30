import { createContext, use, useEffect, useRef } from 'react'
import type { Direction, LayoutFamily } from '../../utils/gamepad/logic'

export type GamepadHandlers = {
  onButton?: (button: number, pressed: boolean) => void
  onLane?: (index: number, pressed: boolean) => void
  onBack?: () => void
  onMenu?: () => void
  onHelp?: () => void
  onDirection?: (direction: Direction) => void
  onDisconnect?: () => void
}
type Options = {
  enabled?: boolean
  kind?: 'gameplay' | 'scene'
  consumes?: readonly number[]
}
export type GamepadConsumer = {
  handlers: { current: GamepadHandlers }
  kind: 'gameplay' | 'scene'
  consumes: readonly number[]
}
export type GamepadDevice = {
  index: number
  id: string
  standard: boolean
  family: LayoutFamily
}
export type GamepadStatus = { available: boolean; devices: GamepadDevice[] }
export type GamepadController = {
  register: (consumer: GamepadConsumer) => () => void
  capture: (callback: (button: number) => void) => () => void
  status: GamepadStatus
  bindings: readonly [number, number, number]
}
export const GamepadContext = createContext<GamepadController | null>(null)

export function useGamepadActions(
  handlers: GamepadHandlers,
  options: Options = {}
): void {
  const context = use(GamepadContext)
  const register = context?.register
  const handlersRef = useRef(handlers)
  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])
  const key = (options.consumes ?? []).join(',')
  useEffect(() => {
    if (!register || options.enabled === false) return
    return register({
      handlers: handlersRef,
      kind: options.kind ?? 'scene',
      consumes: key ? key.split(',').map(Number) : []
    })
  }, [register, options.enabled, options.kind, key])
}
export function useGamepadController() {
  return use(GamepadContext)
}
