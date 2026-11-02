import { destroyPixiApp } from './pixiAppTeardown'
import type { Application } from 'pixi.js'

/**
 * Checks whether a lifecycle race should be ignored during teardown.
 * @param app - Pixi application instance being checked or destroyed.
 * @param currentApp - Currently active Pixi application instance.
 * @param isDisposed - Whether the controller has been disposed.
 * @param handleTicker - Ticker callback registered with the Pixi application.
 * @param contextName - Logging context used for lifecycle diagnostics.
 * @returns `true` if a lifecycle race was detected and teardown was triggered; `false` otherwise.
 */
export const checkLifecycleRace = (
  app: Application | null,
  currentApp: Application | null,
  isDisposed: boolean,
  handleTicker: unknown,
  contextName: string
): boolean => {
  if (isDisposed || currentApp !== app) {
    if (app) destroyPixiApp(app, handleTicker, contextName)
    return true
  }
  return false
}

/**
 * Checks whether an init error came from a lifecycle race.
 *
 * @remarks
 * Only the controller's teardown state decides: an error is a race when the
 * controller was disposed or its app was replaced while init was in flight.
 * The error text is never consulted, so a live controller's real failure
 * (even one mentioning `updateLocalTransform`) is reported, not swallowed.
 *
 * @param app - Pixi application instance being checked or destroyed.
 * @param currentApp - Currently active Pixi application instance.
 * @param isDisposed - Whether the controller has been disposed.
 * @returns `true` if the controller is tearing down or disposed; `false` otherwise.
 */
export const isLifecycleRaceError = (
  app: Application | null,
  currentApp: Application | null,
  isDisposed: boolean
): boolean => isDisposed || currentApp !== app
