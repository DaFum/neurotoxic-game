
import * as PIXI from 'pixi.js'
import { logger } from '../../utils/logger'
import { getPixiColorFromToken } from '../stage/utils'
import { IMG_PROMPTS, getGenImageUrl } from '../../utils/imageGen'

export class TourbusStageController {
  constructor({ containerRef, gameStateRef, updateRef, statsRef }) {
    this.containerRef = containerRef
    this.gameStateRef = gameStateRef
    this.updateRef = updateRef
    this.statsRef = statsRef
    this.app = null
    this.isDisposed = false
    this.initPromise = null
    this.handleTicker = this.handleTicker.bind(this)

    this.container = null
    this.busSprite = null
    this.laneWidth = 0
    this.roadContainer = null
    this.obstacleContainer = null
    this.roadStripes = []
  }

  async init() {
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      try {
        const container = this.containerRef.current
        if (!container) return

        this.app = new PIXI.Application()
        await this.app.init({
          backgroundAlpha: 0,
          resizeTo: container,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true
        })

        if (this.isDisposed || !this.app) {
          this.dispose()
          return
        }

        container.appendChild(this.app.canvas)
        this.container = new PIXI.Container()
        this.app.stage.addChild(this.container)

        // Setup Layers
        this.roadContainer = new PIXI.Container()
        this.obstacleContainer = new PIXI.Container()
        this.container.addChild(this.roadContainer)
        this.container.addChild(this.obstacleContainer)

        // Initial Draw
        this.drawRoad()
        await this.loadAssets()

        this.app.ticker.add(this.handleTicker)

      } catch (err) {
        logger.error('TourbusStageController', 'Init Failed', err)
        this.dispose()
      }
    })()
    return this.initPromise
  }

  async loadAssets() {
    // Load Bus Sprite, etc.
    // For now, use placeholder graphics or basic shapes if assets missing
    // We can use getGenImageUrl for textures
    try {
        const vanUrl = getGenImageUrl(IMG_PROMPTS.ICON_VAN)
        const texture = await PIXI.Assets.load(vanUrl)

        this.busSprite = new PIXI.Sprite(texture)
        this.busSprite.anchor.set(0.5, 1) // Anchor bottom center
        this.busSprite.width = 60
        this.busSprite.height = 100
        this.container.addChild(this.busSprite)
    } catch (e) {
        logger.warn('TourbusStageController', 'Failed to load van asset', e)
        // Fallback: Graphics
        const g = new PIXI.Graphics()
        g.rect(-20, -50, 40, 50)
        g.fill(0xFF0000)
        this.busSprite = g
        this.container.addChild(this.busSprite)
    }
  }

  drawRoad() {
    const width = this.app.screen.width
    const height = this.app.screen.height
    this.laneWidth = width / 3

    // Draw static road background
    const bg = new PIXI.Graphics()
    bg.rect(0, 0, width, height)
    bg.fill(getPixiColorFromToken('--void-black'))
    this.roadContainer.addChild(bg)

    // Draw lane dividers
    for (let i = 1; i < 3; i++) {
      const line = new PIXI.Graphics()
      line.rect(i * this.laneWidth - 2, 0, 4, height)
      line.fill({ color: getPixiColorFromToken('--ash-gray'), alpha: 0.3 })
      this.roadContainer.addChild(line)
    }
  }

  handleTicker(ticker) {
    if (this.isDisposed) return
    if (this.updateRef.current) {
      this.updateRef.current(ticker.deltaMS)
    }

    const state = this.gameStateRef.current
    const width = this.app.screen.width
    const height = this.app.screen.height

    // Update Bus Position (Lerp for smoothness)
    if (this.busSprite) {
      const targetX = (state.busLane * this.laneWidth) + (this.laneWidth / 2)
      // Simple lerp: current + (target - current) * 0.2
      this.busSprite.x += (targetX - this.busSprite.x) * 0.2
      this.busSprite.y = height * 0.9 // Fixed Y at 90%
    }

    // Render Obstacles
    // Clear and redraw is expensive, ideally we pool sprites.
    // For MVP, we can iterate and update/create.
    // Optimization: Map id to sprite.
    if (!this.obstacleMap) this.obstacleMap = new Map()

    // Mark all as unseen
    const currentIds = new Set()

    state.obstacles.forEach(obs => {
      currentIds.add(obs.id)
      let sprite = this.obstacleMap.get(obs.id)

      if (!sprite) {
        sprite = new PIXI.Graphics()
        if (obs.type === 'FUEL') {
           sprite.circle(0, 0, 20)
           sprite.fill(0xFFFF00) // Yellow
           sprite.stroke({ width: 2, color: 0xFFFFFF })
        } else {
           sprite.rect(-25, -25, 50, 50)
           sprite.fill(0xFF0000) // Red
           sprite.stroke({ width: 2, color: 0xFFFFFF })
        }
        this.obstacleContainer.addChild(sprite)
        this.obstacleMap.set(obs.id, sprite)
      }

      // Update position
      const x = (obs.lane * this.laneWidth) + (this.laneWidth / 2)
      const y = (obs.y / 100) * height
      sprite.x = x
      sprite.y = y

      // Visual feedback for collision
      if (obs.collided) {
          sprite.alpha = 0.5
          sprite.scale.set(0.8)
      }
    })

    // Cleanup removed obstacles
    for (const [id, sprite] of this.obstacleMap.entries()) {
      if (!currentIds.has(id)) {
        this.obstacleContainer.removeChild(sprite)
        sprite.destroy()
        this.obstacleMap.delete(id)
      }
    }
  }

  dispose() {
    this.isDisposed = true
    this.initPromise = null
    if (this.app) {
      this.app.ticker.remove(this.handleTicker)
      this.app.destroy(true, { children: true })
      this.app = null
    }
    this.obstacleMap = null
  }
}

export const createTourbusStageController = params => new TourbusStageController(params)
