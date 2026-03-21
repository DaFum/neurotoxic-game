// (#1) Actual Updates: Extracted PixiJS app destruction and teardown logic from BaseStageController into a separate utility file to reduce its complexity.
// (#2) Next Steps: Continue abstracting generic application lifecycle code to keep stage controllers lean and focused only on gameplay.
// (#3) Found Errors + Solutions: Handled references to the logger utility to ensure error logging remains fully functional.

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

function destroyApp(app) {
  if (typeof app.destroy !== 'function') return false

  try {
    app.destroy(
      { removeView: true },
      { children: true, texture: true, textureSource: true }
    )
    return true
  } catch (destroyError) {
    if (!isBenignDestroyError(destroyError)) {
      throw destroyError
    }
    // Fall through to partial-init fallback for known races.
    return false
  }
}

function fallbackDestroyStage(app) {
  app.stage?.destroy?.({
    children: true,
    texture: true,
    textureSource: true
  })
}

function fallbackDestroyRenderer(app) {
  app.renderer?.destroy?.({ removeView: true })
}

function fallbackRemoveCanvas(app) {
  let canvas = null
  try {
    canvas = app.canvas
  } catch (_e) {
    // Ignore - app getter can throw after failed/partial teardown.
  }
  if (canvas?.parentNode) {
    canvas.parentNode.removeChild(canvas)
  }
}

function fallbackDestroy(app) {
  fallbackDestroyStage(app)
  fallbackDestroyRenderer(app)
  fallbackRemoveCanvas(app)
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
export function destroyPixiApp(app, tickerHandler, contextName = 'PixiAppTeardown') {
  if (!app) return

  try {
    removeAppTicker(app, tickerHandler)

    // Stop ResizePlugin loops before app teardown to prevent resize-on-destroy races.
    teardownResizePlugin(app)

    // PixiJS v8 destroy signature: destroy(rendererDestroyOptions, options)
    if (destroyApp(app)) return

    // Fallback for partially initialized apps.
    fallbackDestroy(app)
  } catch (error) {
    handleDestroyError(error, contextName)
  }
}
