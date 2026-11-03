import { createContext, use, useEffect, useRef } from 'react'
import type { GamepadController, GamepadHandlers } from '../../types/gamepad'
export type { GamepadHandlers, GamepadController } from '../../types/gamepad'

/**
 * Configuration options for registering gamepad handlers.
 */
type Options = {
  /**
   * Determines if the registered handlers are currently active and listening for inputs.
   */
  enabled?: boolean
  /**
   * The classification level of the actions, which dictates focus priority handling.
   */
  kind?: 'gameplay' | 'scene'
  /**
   * Specific key codes or inputs that should be intercepted, preventing default spatial navigation.
   */
  consumes?: readonly number[]
}

/**
 * Context providing the active gamepad controller layer to the React tree.
 */
export const GamepadContext = createContext<GamepadController | null>(null)

/**
 * Registers an ephemeral set of controller handlers for the current component lifecycle.
 * @param handlers - A record mapping standard actions to handler callbacks.
 * @param options - Optional configuration overriding default registration behaviors.
 */
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

/**
 * Retrieves the nearest gamepad controller from context.
 * @returns The controller instance, or null if the app is outside a gamepad provider.
 */
export function useGamepadController() {
  return use(GamepadContext)
}
