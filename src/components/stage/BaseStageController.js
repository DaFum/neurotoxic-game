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
    return (
      message.includes("reading '_cancelResize'") ||
      message.includes("reading 'destroy'") ||
      message.includes("reading 'canvas'") ||
      message.includes('updateLocalTransform')
    )
  }

  destroyPixiApp(app) {
    if (!app) return

    try {
      app.ticker?.remove?.(this.handleTicker)

      // Stop ResizePlugin loops before app teardown to prevent resize-on-destroy races.
      try {
        if (typeof app._cancelResize === 'function') {
          app._cancelResize()
        }
      } catch (_e) {
        // Ignore plugin teardown races
      }

      try {
        if ('resizeTo' in app) {
          app.resizeTo = null
        }
      } catch (_e) {
        // Ignore plugin teardown races
      }

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

      if (typeof app._cancelResize !== 'function') {
        app._cancelResize = () => {}
      }

      // PixiJS v8 destroy signature: destroy(rendererDestroyOptions, options)
      if (typeof app.destroy === 'function') {
        try {
          app.destroy(
            { removeView: true },
            { children: true, texture: true, textureSource: true }
          )
          return
        } catch (destroyError) {
          if (!this.isBenignDestroyError(destroyError)) {
            throw destroyError
          }
          // Fall through to partial-init fallback for known races.
        }
      }

      // Fallback for partially initialized apps.
      app.stage?.destroy?.({
        children: true,
        texture: true,
        textureSource: true
      })
      app.renderer?.destroy?.({ removeView: true })
      let canvas = null
      try {
        canvas = app.canvas
      } catch (_e) {
        // Ignore - app getter can throw after failed/partial teardown.
      }
      if (canvas?.parentNode) {
        canvas.parentNode.removeChild(canvas)
      }
    } catch (error) {
      if (!this.isBenignDestroyError(error)) {
        logger.warn(this.constructor.name, 'Destroy failed', error)
      }
    }
  }

  async init(options = {}) {
    this.isDisposed = false
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
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

        if (this.isDisposed || this.app !== app) {
          if (this.app === app) this.app = null
          this.destroyPixiApp(app)
          return
        }

        container.appendChild(app.canvas)
        this.container = new PIXI.Container()
        app.stage.addChild(this.container)

        // Subclass logic goes here
        await this.setup()

        if (this.isDisposed || this.app !== app) {
          if (this.app === app) this.app = null
          this.destroyPixiApp(app)
          return
        }

        if (typeof ResizeObserver !== 'undefined') {
          this.resizeObserver = new ResizeObserver(() => this.handleResize())
          this.resizeObserver.observe(container)
        } else {
          window.addEventListener('resize', this.handleResize)
          this._usingWindowResize = true
        }
        app.ticker.add(this.handleTicker)
      } catch (e) {
        const message = String(e?.message || e || '')
        const isLifecycleRace =
          this.isDisposed ||
          this.app !== app ||
          message.includes('updateLocalTransform')
        const shouldRethrow = !isLifecycleRace

        if (shouldRethrow) {
          logger.error(this.constructor.name, 'Init Failed', e)
        }

        // Ensure callers can retry init() after a failed attempt.
        this.initPromise = null
        this.isDisposed = true

        // Route teardown through dispose() so subclass cleanup always runs.
        // This restores the previous contract where init failures trigger full disposal.
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
        } finally {
          this.initPromise = null
        }

        if (shouldRethrow) {
          throw e
        }
      }
    })()
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
