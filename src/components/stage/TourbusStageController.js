
import * as PIXI from 'pixi.js'
import { BaseStageController } from './BaseStageController'
import { EffectManager } from './EffectManager'
import { getPixiColorFromToken, loadTexture } from './utils'
import { logger } from '../../utils/logger'
import { IMG_PROMPTS, getGenImageUrl } from '../../utils/imageGen'
import { LANE_COUNT, BUS_Y_PERCENT, BUS_HEIGHT_PERCENT } from '../../hooks/minigames/useTourbusLogic'

class TourbusStageController extends BaseStageController {
  constructor(params) {
    super(params)
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

  async setup() {
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

  draw() {
      this.drawRoad()
  }

  drawRoad() {
    const width = this.app.screen.width
    const height = this.app.screen.height
    this.laneWidth = width / LANE_COUNT

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
        for (let i = 1; i < LANE_COUNT; i++) {
            const line = new PIXI.Graphics()
            line.rect(i * this.laneWidth - 2, 0, 4, height)
            line.fill({ color: getPixiColorFromToken('--ash-gray'), alpha: 0.3 })
            this.roadContainer.addChild(line)
        }
    }
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
      // Visual height slightly larger than collision box for aesthetics
      const targetH = height * ((BUS_HEIGHT_PERCENT + 5) / 100)
      const texW = this.busSprite.texture?.width || this.busSprite.width || 60
      const texH = this.busSprite.texture?.height || this.busSprite.height || 80
      const busScale = Math.min(targetW / texW, targetH / texH)
      this.busSprite.scale.set(busScale)

      this.container.addChild(this.busSprite)
  }

  update(dt) {
    if (this.effectManager) this.effectManager.update(dt)

    const state = this.gameStateRef.current
    if (!state) return

    const height = this.app.screen.height

    // Scroll Road
    if (this.roadStripes) {
        // Speed is relative units per ms.
        // Let's say speed 0.05 => 50 units per sec.
        // We need pixel speed.
        // Height is 100 units. So 1 unit = height/100 pixels.
        const pixelSpeed = state.speed * (height / 100) * dt
        this.roadStripes.tilePosition.y += pixelSpeed
    }

    // Update Bus Position (Lerp for smoothness)
    if (this.busSprite) {
      const targetX = (state.busLane * this.laneWidth) + (this.laneWidth / 2)

      // Frame-independent Lerp
      // Using exponential decay: lerp(a, b, 1 - exp(-decay * dt))
      // Decay factor ~10 for snappy movement
      const dtSeconds = dt / 1000
      const lerpFactor = 1 - Math.exp(-10 * dtSeconds)

      this.busSprite.x += (targetX - this.busSprite.x) * lerpFactor
      // Position bottom of bus at bottom of collision box
      this.busSprite.y = height * ((BUS_Y_PERCENT + BUS_HEIGHT_PERCENT) / 100)

      // Wobble effect based on speed (use ticker.lastTime instead of Date.now() for consistency)
      // Since we don't have ticker.lastTime passed in update(dt), we use a fallback or add it to Base
      // For now, assume simple wobble
      this.busSprite.rotation = Math.sin(Date.now() / 100) * 0.05
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
    super.dispose()

    if (this.effectManager) {
        this.effectManager.dispose()
        this.effectManager = null
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
