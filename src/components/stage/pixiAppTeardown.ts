// @ts-nocheck
/** Utility for robust PixiJS application teardown. */
import { logger } from '../../utils/logger'

export function isBenignDestroyError(error) {
  const message = String(error?.message || error || '')
  const benignPhrases = [
    "reading '_cancelResize'",
    "reading 'destroy'",
    "reading 'canvas'",
    'updateLocalTransform'
  ]
  return benignPhrases.some(phrase => message.includes(phrase))
}

function teardownCancelResize(app) {
  try {
    if (typeof app._cancelResize === 'function') {
      app._cancelResize()
    }
  } catch (_e) {
    // Ignore plugin teardown races
  }
}

function teardownResizeTo(app) {
  try {
    if ('resizeTo' in app) {
      app.resizeTo = null
    }
  } catch (_e) {
    // Ignore plugin teardown races
  }
}

function teardownQueueResize(app) {
  try {
    if (
      typeof globalThis?.removeEventListener === 'function' &&
      typeof app.queueResize === 'function'
    ) {
      globalThis.removeEventListener('resize', app.queueResize)
    }
  } catch (_e) {
    // Ignore plugin teardown races
  }
}

function teardownResizePlugin(app) {
  teardownCancelResize(app)
  teardownResizeTo(app)
  teardownQueueResize(app)

  if (typeof app._cancelResize !== 'function') {
    app._cancelResize = () => {}
  }
}

function destroyApp(app, contextName) {
  if (typeof app.destroy !== 'function') return false

  try {
    app.destroy(
      { removeView: true },
      { children: true, texture: true, textureSource: true }
    )
    return true
  } catch (destroyError) {
    handleDestroyError(destroyError, contextName)
    // Fall through to partial-init fallback for known races.
    return false
  }
}

function fallbackDestroyStage(app, contextName) {
  try {
    app.stage?.destroy?.({
      children: true,
      texture: true,
      textureSource: true
    })
  } catch (e) {
    handleDestroyError(e, contextName)
  }
}

function fallbackDestroyRenderer(app, contextName) {
  try {
    app.renderer?.destroy?.({ removeView: true })
  } catch (e) {
    handleDestroyError(e, contextName)
  }
}

function fallbackRemoveCanvas(app, contextName) {
  let canvas = null
  try {
    canvas = app.canvas
  } catch (e) {
    handleDestroyError(e, contextName)
  }
  try {
    if (canvas?.parentNode) {
      canvas.parentNode.removeChild(canvas)
    }
  } catch (e) {
    handleDestroyError(e, contextName)
  }
}

function fallbackDestroy(app, contextName) {
  fallbackDestroyStage(app, contextName)
  fallbackDestroyRenderer(app, contextName)
  fallbackRemoveCanvas(app, contextName)
}

function removeAppTicker(app, tickerHandler) {
  if (tickerHandler) {
    app.ticker?.remove?.(tickerHandler)
  }
}

function handleDestroyError(error, contextName) {
  if (!isBenignDestroyError(error)) {
    logger.warn(contextName, 'Destroy failed', error)
  }
}

/**
 * Robustly tears down and destroys a Pixi Application.
 * Handles race conditions, plugin errors, and partial initialization states.
 *
 * @param {import('pixi.js').Application} app - The Pixi Application to destroy.
 * @param {Function} tickerHandler - Optional reference to a ticker function to remove before destroy.
 * @param {string} contextName - The name of the class or context destroying the app, used for logging.
 */
export function destroyPixiApp(
  app,
  tickerHandler,
  contextName = 'PixiAppTeardown'
) {
  if (!app) return

  try {
    removeAppTicker(app, tickerHandler)
  } catch (e) {
    handleDestroyError(e, contextName)
  }

  try {
    // Stop ResizePlugin loops before app teardown to prevent resize-on-destroy races.
    teardownResizePlugin(app)
  } catch (e) {
    handleDestroyError(e, contextName)
  }

  // PixiJS v8 destroy signature: destroy(rendererDestroyOptions, options)
  if (!destroyApp(app, contextName)) {
    // Fallback for partially initialized apps.
    fallbackDestroy(app, contextName)
  }
}
