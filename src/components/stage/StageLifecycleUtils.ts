import { destroyPixiApp } from './pixiAppTeardown'
import type { Application } from 'pixi.js'

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
