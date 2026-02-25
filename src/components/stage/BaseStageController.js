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

  async init(options = {}) {
    this.isDisposed = false
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      try {
        const container = this.containerRef.current
        if (!container) {
          this.initPromise = null
          return
        }

        this.app = new PIXI.Application()
        await this.app.init({
          backgroundAlpha: 0,
          resizeTo: container,
          antialias: true,
          resolution: getOptimalResolution(),
          autoDensity: true,
          ...options
        })

        if (this.isDisposed || !this.app) {
          this.dispose()
          return
        }

        container.appendChild(this.app.canvas)
        this.container = new PIXI.Container()
        this.app.stage.addChild(this.container)

        // Subclass logic goes here
        await this.setup()

        if (this.isDisposed) return

        if (typeof ResizeObserver !== 'undefined') {
          this.resizeObserver = new ResizeObserver(() => this.handleResize())
          this.resizeObserver.observe(container)
        } else {
          window.addEventListener('resize', this.handleResize)
          this._usingWindowResize = true
        }
        this.app.ticker.add(this.handleTicker)
      } catch (e) {
        logger.error(this.constructor.name, 'Init Failed', e)
        this.dispose()
      }
    })()
    return this.initPromise
  }

  // Abstract methods to be overridden
  async setup() {}
  update(dt) {}
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
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    if (this._usingWindowResize) {
      window.removeEventListener('resize', this.handleResize)
      this._usingWindowResize = false
    }

    if (this.app) {
      try {
        this.app.ticker?.remove(this.handleTicker)
        this.app.destroy({
          removeView: true,
          children: true,
          texture: true,
          textureSource: true
        })
      } catch (e) {
        logger.warn(this.constructor.name, 'Destroy failed', e)
      }
      this.app = null
    }
  }
}
