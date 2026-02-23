
import * as PIXI from 'pixi.js'
import { EffectManager } from './EffectManager'
import { getPixiColorFromToken, loadTexture } from './utils'
import { logger } from '../../utils/logger'
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
    this.handleResize = this.handleResize.bind(this)

    this.container = null
    this.busSprite = null
    this.laneWidth = 0
    this.roadContainer = null
    this.obstacleContainer = null
    this.effectManager = null
    this.roadStripes = null // TilingSprite for road

    // Performance optimization: Pre-allocate Maps/Sets
    this.obstacleMap = new Map()
    this.currentIds = new Set()

    // Textures
    this.textures = {
      bus: null,
      road: null,
      rock: null,
      barrier: null,
      fuel: null
    }
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

        // Initialize Effect Manager (on top of obstacles)
        this.effectManager = new EffectManager(this.app, this.container)
        this.effectManager.init()

        // Load Assets
        await this.loadAssets()
        await this.effectManager.loadAssets()

        // Initial Draw
        this.drawRoad()
        this.createBus()

        window.addEventListener('resize', this.handleResize)
        this.app.ticker.add(this.handleTicker)

      } catch (err) {
        logger.error('TourbusStageController', 'Init Failed', err)
        this.dispose()
      }
    })()
    return this.initPromise
  }

  async loadAssets() {
    try {
        // Generate URLs
        const urls = {
            bus: getGenImageUrl(IMG_PROMPTS.ICON_VAN),
            road: getGenImageUrl(IMG_PROMPTS.MINIGAME_ROAD),
            rock: getGenImageUrl(IMG_PROMPTS.MINIGAME_OBSTACLE_ROCK),
            barrier: getGenImageUrl(IMG_PROMPTS.MINIGAME_OBSTACLE_BARRIER),
            fuel: getGenImageUrl(IMG_PROMPTS.MINIGAME_FUEL)
        }


        // Load all concurrently
        const bundles = Object.keys(urls).map(key =>
            loadTexture(urls[key]).then(tex => {
                if (tex) this.textures[key] = tex
            })
        )

        await Promise.allSettled(bundles)

    } catch (e) {
        logger.warn('TourbusStageController', 'Failed to load assets', e)
    }
  }

  drawRoad() {
    const width = this.app.screen.width
    const height = this.app.screen.height
    this.laneWidth = width / 3

    // Clear previous
    this.roadContainer.removeChildren().forEach(c => c.destroy())

    // Use TilingSprite if texture loaded AND source is valid, else Graphics fallback.
    // Image-element textures may have sources that crash TilingSprite (_resolution null).
    const roadTex = this.textures.road
    const isRoadTexValid = roadTex?.source && !roadTex.source.destroyed

    if (isRoadTexValid) {
        this.roadStripes = new PIXI.TilingSprite({
            texture: roadTex,
            width,
            height
        })
        this.roadContainer.addChild(this.roadStripes)
    } else {
        this.roadStripes = null
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
  }

  handleResize() {
      if (!this.app) return
      // App resizes automatically via resizeTo
      // We just need to redraw road to fit new dimensions
      this.drawRoad()
  }

  createBus() {
      const height = this.app.screen.height

      if (this.textures.bus) {
          this.busSprite = new PIXI.Sprite(this.textures.bus)
          this.busSprite.anchor.set(0.5, 1)
      } else {
          // Fallback
          const g = new PIXI.Graphics()
          g.rect(-25, -80, 50, 80)
          g.fill(getPixiColorFromToken('--toxic-green'))
          this.busSprite = g
      }
      // Scale bus to fit lane width AND a max height
      const targetW = this.laneWidth * 0.6
      const targetH = height * 0.25
      const texW = this.busSprite.texture?.width || this.busSprite.width || 60
      const texH = this.busSprite.texture?.height || this.busSprite.height || 80
      const busScale = Math.min(targetW / texW, targetH / texH)
      this.busSprite.scale.set(busScale)

      this.container.addChild(this.busSprite)
  }

  handleTicker(ticker) {
    if (this.isDisposed) return
    if (this.updateRef.current) {
      this.updateRef.current(ticker.deltaMS)
    }

    // Update Effects
    if (this.effectManager) this.effectManager.update(ticker.deltaMS)

    const state = this.gameStateRef.current
    if (!state) return

    const height = this.app.screen.height

    // Scroll Road
    if (this.roadStripes) {
        // Speed is relative units per ms.
        // Let's say speed 0.05 => 50 units per sec.
        // We need pixel speed.
        // Height is 100 units. So 1 unit = height/100 pixels.
        const pixelSpeed = state.speed * (height / 100) * ticker.deltaMS
        this.roadStripes.tilePosition.y += pixelSpeed
    }

    // Update Bus Position (Lerp for smoothness)
    if (this.busSprite) {
      const targetX = (state.busLane * this.laneWidth) + (this.laneWidth / 2)

      // Frame-independent Lerp
      // Using exponential decay: lerp(a, b, 1 - exp(-decay * dt))
      // Decay factor ~10 for snappy movement
      const dtSeconds = ticker.deltaMS / 1000
      const lerpFactor = 1 - Math.exp(-10 * dtSeconds)

      this.busSprite.x += (targetX - this.busSprite.x) * lerpFactor
      this.busSprite.y = height * 0.9 // Fixed Y at 90%

      // Wobble effect based on speed (use ticker.lastTime instead of Date.now() for consistency)
      this.busSprite.rotation = Math.sin(ticker.lastTime / 100) * 0.05
    }

    // Render Obstacles
    this.currentIds.clear()

    state.obstacles.forEach(obs => {
      this.currentIds.add(obs.id)
      let sprite = this.obstacleMap.get(obs.id)

      if (!sprite) {
        // Choose texture
        let tex = null
        if (obs.type === 'FUEL') tex = this.textures.fuel
        else if (obs.type === 'OBSTACLE') tex = this.textures.rock // Randomize?

        if (tex) {
            sprite = new PIXI.Sprite(tex)
            sprite.anchor.set(0.5)
            // Scale to fit lane width AND a max height
            const targetW = this.laneWidth * 0.4
            const targetH = height * 0.15
            const scale = Math.min(targetW / tex.width, targetH / tex.height)
            sprite.scale.set(scale)
        } else {
            sprite = new PIXI.Graphics()
            if (obs.type === 'FUEL') {
               sprite.circle(0, 0, 20)
               sprite.fill(getPixiColorFromToken('--warning-yellow'))
            } else {
               sprite.rect(-25, -25, 50, 50)
               sprite.fill(getPixiColorFromToken('--blood-red'))
            }
        }

        // Custom property to track explosion state
        sprite.hasExploded = false

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

          if (!sprite.hasExploded) {
              sprite.hasExploded = true
              if (obs.type === 'OBSTACLE') {
                  this.effectManager.spawnHitEffect(x, y, getPixiColorFromToken('--blood-red')) // Red explosion
              } else if (obs.type === 'FUEL') {
                  this.effectManager.spawnHitEffect(x, y, getPixiColorFromToken('--toxic-green')) // Green sparkle
              }
          }
      }
    })

    // Cleanup removed obstacles
    for (const [id, sprite] of this.obstacleMap.entries()) {
      if (!this.currentIds.has(id)) {
        this.obstacleContainer.removeChild(sprite)
        sprite.destroy()
        this.obstacleMap.delete(id)
      }
    }
  }

  dispose() {
    this.isDisposed = true
    this.initPromise = null
    window.removeEventListener('resize', this.handleResize)

    if (this.effectManager) {
        this.effectManager.dispose()
        this.effectManager = null
    }

    if (this.app) {
      try {
        this.app.ticker?.remove(this.handleTicker)
        this.app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true })
      } catch (e) {
        logger.warn('TourbusStageController', 'Destroy failed', e)
      }
      this.app = null
    }

    // Clear maps
    if (this.obstacleMap) {
        this.obstacleMap.clear()
        this.obstacleMap = null
    }
    if (this.currentIds) {
        this.currentIds.clear()
        this.currentIds = null
    }
  }
}

export const createTourbusStageController = params => new TourbusStageController(params)
