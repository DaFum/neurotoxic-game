/** Utility for robust PixiJS application teardown. */
import { logger } from '../../utils/logger'

/**
 * Internal structural typing for a PixiJS application instance containing destroyable components.
 *
 * @remarks
 * Defines optional teardown methods and properties expected during the application destruction lifecycle.
 */
type DestroyableApp = {
  _cancelResize?: (() => void) | null
  resizeTo?: unknown
  resize?: (() => void) | null
  render?: (() => void) | null
  queueResize?: (() => void) | null
  destroy?: (rendererOptions?: unknown, destroyOptions?: unknown) => void
  stage?: {
    destroy?: (options?: {
      children?: boolean
      texture?: boolean
      textureSource?: boolean
    }) => void
  } | null
  renderer?: {
    destroy?: (options?: unknown) => void
    render?: (() => void) | null
  } | null
  canvas?: {
    parentNode?: { removeChild: (node: unknown) => void } | null
  } | null
  ticker?: { remove?: (...args: unknown[]) => void } | null
}

/**
 * Type guard for evaluating generic error objects.
 *
 * @param value - The unknown value to evaluate.
 * @returns A boolean indicating whether the value is an object containing an optional message property.
 */
const isErrorWithMessage = (
  value: unknown
): value is { message?: string | undefined } =>
  typeof value === 'object' && value !== null

/**
 * Evaluates acceptable teardown errors that can safely be ignored.
 *
 * @param error - The error to evaluate.
 * @returns A boolean indicating whether the error matches known benign phrases.
 */
function isBenignDestroyError(error: unknown): boolean {
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

/**
 * Executes a callback and suppresses synchronous errors.
 *
 * @param fn - The function to execute.
 */
function safeIgnore(fn: () => void): void {
  try {
    fn()
  } catch {
    // Ignore plugin teardown races
  }
}

/**
 * Safely removes resize event listeners and properties from the application instance.
 *
 * @param app - The PixiJS application instance.
 */
function teardownResizePlugin(app: DestroyableApp): void {
  safeIgnore(() => {
    if (typeof app._cancelResize === 'function') {
      app._cancelResize()
    }
  })

  safeIgnore(() => {
    if ('resizeTo' in app) {
      app.resizeTo = null
    }
  })

  safeIgnore(() => {
    if (
      typeof globalThis?.removeEventListener === 'function' &&
      typeof app.queueResize === 'function'
    ) {
      globalThis.removeEventListener('resize', app.queueResize)
    }
  })

  if (typeof app._cancelResize !== 'function') {
    app._cancelResize = () => {}
  }
}

/**
 * Nullifies pending render and resize loops to prevent execution during teardown.
 *
 * @param app - The PixiJS application instance.
 */
function teardownQueuedRenderCallbacks(app: DestroyableApp): void {
  if (typeof app.resize === 'function') {
    app.resize = () => {}
  }
  if (typeof app.render === 'function') {
    app.render = () => {}
  }
  if (typeof app.renderer?.render === 'function') {
    app.renderer.render = () => {}
  }
}

/**
 * Attempts primary application destruction via the native PixiJS destroy method.
 *
 * @param app - The PixiJS application instance.
 * @param contextName - The logging context string.
 * @returns A boolean indicating whether native destruction was successful.
 */
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

/**
 * Safely performs a recursive stage cleanup if native destruction fails.
 *
 * @param app - The PixiJS application instance.
 * @param contextName - The logging context string.
 */
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

/**
 * Safely removes the renderer and view if native destruction fails.
 *
 * @param app - The PixiJS application instance.
 * @param contextName - The logging context string.
 */
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

/**
 * Defensively detaches the canvas element from the DOM if native destruction fails.
 *
 * @param app - The PixiJS application instance.
 * @param contextName - The logging context string.
 */
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

/**
 * Executes the aggregate fallback sequence when native destruction fails.
 *
 * @param app - The PixiJS application instance.
 * @param contextName - The logging context string.
 */
function fallbackDestroy(app: DestroyableApp, contextName: string): void {
  fallbackDestroyStage(app, contextName)
  fallbackDestroyRenderer(app, contextName)
  fallbackRemoveCanvas(app, contextName)
}

/**
 * Safely removes a ticker callback from the application ticker loop.
 *
 * @param app - The PixiJS application instance.
 * @param tickerHandler - The ticker callback handler to remove.
 */
function removeAppTicker(app: DestroyableApp, tickerHandler?: unknown): void {
  if (typeof tickerHandler === 'function') {
    app.ticker?.remove?.(tickerHandler)
  }
}

/**
 * Delegates non-benign teardown errors to the logger.
 *
 * @param error - The encountered error during teardown.
 * @param contextName - The logging context string.
 */
function handleDestroyError(error: unknown, contextName: string): void {
  if (!isBenignDestroyError(error)) {
    logger.warn(contextName, 'Destroy failed', error)
  }
}

/**
 * Destroys a Pixi application instance and cleans up associated resources.
 * @param app - Pixi application instance being checked or destroyed.
 * @param tickerHandler - Ticker callback to remove during Pixi teardown.
 * @param contextName - Logging context used for lifecycle diagnostics.
 */
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
    teardownQueuedRenderCallbacks(typedApp)
  } catch (error) {
    handleDestroyError(error, contextName)
  }

  if (!destroyApp(typedApp, contextName)) {
    fallbackDestroy(typedApp, contextName)
  }
}
