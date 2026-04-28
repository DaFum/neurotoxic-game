/** Utility for robust PixiJS application teardown. */
import { logger } from '../../utils/logger'

type DestroyableApp = {
  _cancelResize?: (() => void) | null
  resizeTo?: unknown
  queueResize?: (() => void) | null
  destroy?: (rendererOptions?: unknown, destroyOptions?: unknown) => void
  stage?: {
    destroy?: (options?: {
      children?: boolean
      texture?: boolean
      textureSource?: boolean
    }) => void
  } | null
  renderer?: { destroy?: (options?: unknown) => void } | null
  canvas?: {
    parentNode?: { removeChild: (node: unknown) => void } | null
  } | null
  ticker?: { remove?: (...args: unknown[]) => void } | null
}

const isErrorWithMessage = (
  value: unknown
): value is { message?: string | undefined } =>
  typeof value === 'object' && value !== null

export function isBenignDestroyError(error: unknown): boolean {
  const errorMessage =
    isErrorWithMessage(error) && typeof error.message === 'string'
      ? error.message
      : ''
  const message = String(errorMessage || error || '')
  const benignPhrases = [
    "reading '_cancelResize'",
    "reading 'destroy'",
    "reading 'canvas'",
    'updateLocalTransform'
  ]
  return benignPhrases.some(phrase => message.includes(phrase))
}

function teardownCancelResize(app: DestroyableApp): void {
  try {
    if (typeof app._cancelResize === 'function') {
      app._cancelResize()
    }
  } catch {
    // Ignore plugin teardown races
  }
}

function teardownResizeTo(app: DestroyableApp): void {
  try {
    if ('resizeTo' in app) {
      app.resizeTo = null
    }
  } catch {
    // Ignore plugin teardown races
  }
}

function teardownQueueResize(app: DestroyableApp): void {
  try {
    if (
      typeof globalThis?.removeEventListener === 'function' &&
      typeof app.queueResize === 'function'
    ) {
      globalThis.removeEventListener('resize', app.queueResize)
    }
  } catch {
    // Ignore plugin teardown races
  }
}

function teardownResizePlugin(app: DestroyableApp): void {
  teardownCancelResize(app)
  teardownResizeTo(app)
  teardownQueueResize(app)

  if (typeof app._cancelResize !== 'function') {
    app._cancelResize = () => {}
  }
}

function destroyApp(app: DestroyableApp, contextName: string): boolean {
  if (typeof app.destroy !== 'function') return false

  try {
    app.destroy(
      { removeView: true },
      { children: true, texture: true, textureSource: true }
    )
    return true
  } catch (destroyError) {
    handleDestroyError(destroyError, contextName)
    return false
  }
}

function fallbackDestroyStage(app: DestroyableApp, contextName: string): void {
  try {
    app.stage?.destroy?.({
      children: true,
      texture: true,
      textureSource: true
    })
  } catch (error) {
    handleDestroyError(error, contextName)
  }
}

function fallbackDestroyRenderer(
  app: DestroyableApp,
  contextName: string
): void {
  try {
    app.renderer?.destroy?.({ removeView: true })
  } catch (error) {
    handleDestroyError(error, contextName)
  }
}

function fallbackRemoveCanvas(app: DestroyableApp, contextName: string): void {
  let canvas: DestroyableApp['canvas'] = null
  try {
    canvas = app.canvas ?? null
  } catch (error) {
    handleDestroyError(error, contextName)
  }
  try {
    if (canvas?.parentNode) {
      canvas.parentNode.removeChild(canvas)
    }
  } catch (error) {
    handleDestroyError(error, contextName)
  }
}

function fallbackDestroy(app: DestroyableApp, contextName: string): void {
  fallbackDestroyStage(app, contextName)
  fallbackDestroyRenderer(app, contextName)
  fallbackRemoveCanvas(app, contextName)
}

function removeAppTicker(app: DestroyableApp, tickerHandler?: unknown): void {
  if (typeof tickerHandler === 'function') {
    app.ticker?.remove?.(tickerHandler)
  }
}

function handleDestroyError(error: unknown, contextName: string): void {
  if (!isBenignDestroyError(error)) {
    logger.warn(contextName, 'Destroy failed', error)
  }
}

export function destroyPixiApp(
  app: unknown,
  tickerHandler?: unknown,
  contextName = 'PixiAppTeardown'
): void {
  if (!app || typeof app !== 'object') return
  const typedApp = app as DestroyableApp

  try {
    removeAppTicker(typedApp, tickerHandler)
  } catch (error) {
    handleDestroyError(error, contextName)
  }

  try {
    teardownResizePlugin(typedApp)
  } catch (error) {
    handleDestroyError(error, contextName)
  }

  if (!destroyApp(typedApp, contextName)) {
    fallbackDestroy(typedApp, contextName)
  }
}
