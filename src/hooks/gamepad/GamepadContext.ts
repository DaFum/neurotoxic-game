import { createContext, use, useEffect, useRef } from 'react'
import type { GamepadController, GamepadHandlers } from '../../types/gamepad'
export type { GamepadHandlers, GamepadController } from '../../types/gamepad'

type Options = {
  enabled?: boolean
  kind?: 'gameplay' | 'scene'
  consumes?: readonly number[]
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
