import * as PIXI from 'pixi.js'
import { logger } from '../../utils/logger'
import { getOptimalResolution } from './utils'

export class BaseStageController {
  constructor({ containerRef, gameStateRef, updateRef }) {
    this.containerRef = containerRef
    this.gameStateRef = gameStateRef
    this.updateRef = updateRef
    this.app = null
    this.isDisposed = false
    this.initPromise = null
    this.container = null

    // Bind methods
    this.handleTicker = this.handleTicker.bind(this)
    this.handleResize = this.handleResize.bind(this)
  }

  cleanupHostResizeListeners() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    if (this._usingWindowResize) {
      window.removeEventListener('resize', this.handleResize)
      this._usingWindowResize = false
    }
  }

  isBenignDestroyError(error) {
    const message = String(error?.message || error || '')
    const benignPhrases = [
      "reading '_cancelResize'",
      "reading 'destroy'",
      "reading 'canvas'",
      'updateLocalTransform'
    ]
    return benignPhrases.some(phrase => message.includes(phrase))
  }

  _teardownCancelResize(app) {
    try {
      if (typeof app._cancelResize === 'function') {
        app._cancelResize()
      }
    } catch (_e) {
      // Ignore plugin teardown races
    }
  }

  _teardownResizeTo(app) {
    try {
      if ('resizeTo' in app) {
        app.resizeTo = null
      }
    } catch (_e) {
      // Ignore plugin teardown races
    }
  }

  _teardownQueueResize(app) {
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

  _teardownResizePlugin(app) {
    this._teardownCancelResize(app)
    this._teardownResizeTo(app)
    this._teardownQueueResize(app)

    if (typeof app._cancelResize !== 'function') {
      app._cancelResize = () => {}
    }
  }

  _destroyApp(app) {
    if (typeof app.destroy !== 'function') return false

    try {
      app.destroy(
        { removeView: true },
        { children: true, texture: true, textureSource: true }
      )
      return true
    } catch (destroyError) {
      if (!this.isBenignDestroyError(destroyError)) {
        throw destroyError
      }
      // Fall through to partial-init fallback for known races.
      return false
    }
  }

  _fallbackDestroyStage(app) {
    app.stage?.destroy?.({
      children: true,
      texture: true,
      textureSource: true
    })
  }

  _fallbackDestroyRenderer(app) {
    app.renderer?.destroy?.({ removeView: true })
  }

  _fallbackRemoveCanvas(app) {
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

  _fallbackDestroy(app) {
    this._fallbackDestroyStage(app)
    this._fallbackDestroyRenderer(app)
    this._fallbackRemoveCanvas(app)
  }

  _removeAppTicker(app) {
    app.ticker?.remove?.(this.handleTicker)
  }

  _handleDestroyError(error) {
    if (!this.isBenignDestroyError(error)) {
      logger.warn(this.constructor.name, 'Destroy failed', error)
    }
  }

  destroyPixiApp(app) {
    if (!app) return

    try {
      this._removeAppTicker(app)

      // Stop ResizePlugin loops before app teardown to prevent resize-on-destroy races.
      this._teardownResizePlugin(app)

      // PixiJS v8 destroy signature: destroy(rendererDestroyOptions, options)
      if (this._destroyApp(app)) return

      // Fallback for partially initialized apps.
      this._fallbackDestroy(app)
    } catch (error) {
      this._handleDestroyError(error)
    }
  }

  _checkLifecycleRace(app) {
    if (this.isDisposed || this.app !== app) {
      if (this.app === app) this.app = null
      this.destroyPixiApp(app)
      return true
    }
    return false
  }

  _setupResizeListeners(container) {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.handleResize())
      this.resizeObserver.observe(container)
    } else {
      window.addEventListener('resize', this.handleResize)
      this._usingWindowResize = true
    }
  }

  _isLifecycleRaceError(e, app) {
    if (this.isDisposed || this.app !== app) return true
    const message = e ? String(e.message || e) : ''
    return message.includes('updateLocalTransform')
  }

  _executeDisposeWithFallback(app) {
    try {
      this.dispose()
    } catch (disposeError) {
      logger.warn(
        this.constructor.name,
        'Dispose failed during init',
        disposeError
      )
      this.cleanupHostResizeListeners()
      if (this.app === app) this.app = null
      this.destroyPixiApp(app)
    }
  }

  _handleInitError(e, app) {
    const isLifecycleRace = this._isLifecycleRaceError(e, app)
    const shouldRethrow = !isLifecycleRace

    if (shouldRethrow) {
      logger.error(this.constructor.name, 'Init Failed', e)
    }

    // Ensure callers can retry init() after a failed attempt.
    this.initPromise = null
    this.isDisposed = true

    // Route teardown through dispose() so subclass cleanup always runs.
    // This restores the previous contract where init failures trigger full disposal.
    this._executeDisposeWithFallback(app)
    this.initPromise = null

    if (shouldRethrow) {
      throw e
    }
  }

  async _performInit(options) {
    let app = null
    try {
      const container = this.containerRef.current
      if (!container) {
        this.initPromise = null
        return
      }

      app = new PIXI.Application()
      this.app = app
      await app.init({
        backgroundAlpha: 0,
        resizeTo: container,
        antialias: true,
        resolution: getOptimalResolution(),
        autoDensity: true,
        ...options
      })

      if (this._checkLifecycleRace(app)) return

      container.appendChild(app.canvas)
      this.container = new PIXI.Container()
      app.stage.addChild(this.container)

      // Subclass logic goes here
      await this.setup()

      if (this._checkLifecycleRace(app)) return

      this._setupResizeListeners(container)
      app.ticker.add(this.handleTicker)
    } catch (e) {
      this._handleInitError(e, app)
    }
  }

  async init(options = {}) {
    this.isDisposed = false
    if (this.initPromise) return this.initPromise

    this.initPromise = this._performInit(options)
    return this.initPromise
  }

  // Abstract methods to be overridden
  async setup() {}
  update(_dt) {}
  draw() {}

  handleResize() {
    if (!this.app) return
    this.draw()
  }

  handleTicker(ticker) {
    if (this.isDisposed) return
    if (this.updateRef.current) this.updateRef.current(ticker.deltaMS)

    this.update(ticker.deltaMS)
  }

  dispose() {
    this.isDisposed = true
    this.initPromise = null
    this.cleanupHostResizeListeners()
    this.container = null

    if (this.app) {
      const app = this.app
      this.app = null
      this.destroyPixiApp(app)
    }
  }
}
