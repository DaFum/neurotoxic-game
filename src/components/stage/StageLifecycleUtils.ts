import { destroyPixiApp } from './pixiAppTeardown'

export const checkLifecycleRace = (
  app: import("pixi.js").Application,
  currentApp: import("pixi.js").Application,
  isDisposed: boolean,
  handleTicker: unknown,
  contextName: string
): boolean => {
  if (isDisposed || currentApp !== app) {
    destroyPixiApp(app, handleTicker, contextName)
    return true
  }
  return false
}

export const isLifecycleRaceError = (
  e: unknown,
  app: import("pixi.js").Application,
  currentApp: import("pixi.js").Application,
  isDisposed: boolean
): boolean => {
  if (isDisposed || currentApp !== app) return true
  const message = e ? String(e.message || e) : ''
  return message.includes('updateLocalTransform')
}
