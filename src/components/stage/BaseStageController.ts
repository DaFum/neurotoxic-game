import { Application, Container } from 'pixi.js'
import { logger } from '../../utils/logger'
import { getOptimalResolution } from './utils'
import { destroyPixiApp } from './pixiAppTeardown'
import { StageResizeHandler } from './StageResizeHandler'
import { checkLifecycleRace, isLifecycleRaceError } from './StageLifecycleUtils'

export class BaseStageController {
  [key: string]: unknown

  containerRef: import('react').RefObject<HTMLElement | null>
  gameStateRef: import('react').RefObject<unknown>
  updateRef: import('react').MutableRefObject<((dt: number) => void) | null>
  app: Application | null
  isDisposed: boolean
  constructor({ containerRef, gameStateRef, updateRef }: any) {
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

    // Sub-components
    this.resizeHandler = new StageResizeHandler(this.handleResize)
  }

  cleanupHostResizeListeners() {
    this.resizeHandler.cleanup()
  }

  _checkLifecycleRace(app: any) {
    const isRace = checkLifecycleRace(
      app,
      this.app,
      this.isDisposed,
      this.handleTicker,
      this.constructor.name
    )
    if (isRace && this.app === app) this.app = null
    return isRace
  }

  _setupResizeListeners(container: any) {
    this.resizeHandler.setup(container)
  }

  _isLifecycleRaceError(e: any, app: any) {
    return isLifecycleRaceError(e, app, this.app, this.isDisposed)
  }

  _executeDisposeWithFallback(app: any) {
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
      destroyPixiApp(app, this.handleTicker, this.constructor.name)
    }
  }

  _handleInitError(e: any, app: any) {
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

  async _performInit(options: any) {
    let app = null
    try {
      const container = this.containerRef.current
      if (!container) {
        this.initPromise = null
        return
      }

      app = new Application()
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
      this.container = new Container()
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
  update(_dt: any) {}
  draw() {}

  handleResize() {
    if (!this.app) return
    this.draw()
  }

  handleTicker(ticker: any) {
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
      destroyPixiApp(app, this.handleTicker, this.constructor.name)
    }
  }
}
