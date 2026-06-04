import { destroyPixiApp } from './pixiAppTeardown'
import type { Application } from 'pixi.js'

/**
 * Checks whether a lifecycle race should be ignored during teardown.
 * @param app - Pixi application instance being checked or destroyed.
 * @param currentApp - Currently active Pixi application instance.
 * @param isDisposed - Whether disposed is active.
 * @param handleTicker - Ticker callback registered with the Pixi application.
 * @param contextName - Logging context used for lifecycle diagnostics.
 * @returns Computed result.
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
 * Checks whether an error came from a known lifecycle race.
 * @param e - Candidate error value to classify.
 * @param app - Pixi application instance being checked or destroyed.
 * @param currentApp - Currently active Pixi application instance.
 * @param isDisposed - Whether disposed is active.
 * @returns Computed result.
 */
export const isLifecycleRaceError = (
  e: unknown,
  app: Application | null,
  currentApp: Application | null,
  isDisposed: boolean
): boolean => {
  if (isDisposed || currentApp !== app) return true
  const message = e ? (e instanceof Error ? e.message : String(e)) : ''
  return message.includes('updateLocalTransform')
}
