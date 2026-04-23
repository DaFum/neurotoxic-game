import { destroyPixiApp } from './pixiAppTeardown'

export const checkLifecycleRace = (
  app: any,
  currentApp: any,
  isDisposed: boolean,
  handleTicker: any,
  contextName: string
): boolean => {
  if (isDisposed || currentApp !== app) {
    destroyPixiApp(app, handleTicker, contextName)
    return true
  }
  return false
}

export const isLifecycleRaceError = (
  e: any,
  app: any,
  currentApp: any,
  isDisposed: boolean
): boolean => {
  if (isDisposed || currentApp !== app) return true
  const message = e ? String(e.message || e) : ''
  return message.includes('updateLocalTransform')
}
