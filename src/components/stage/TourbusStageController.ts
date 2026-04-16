// @ts-nocheck
// TODO: Review this file
import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js'
import { BaseStageController } from './BaseStageController'
import { EffectManager } from './EffectManager'
import { getPixiColorFromToken, loadTextures } from './utils'
import { logger } from '../../utils/logger'
import { IMG_PROMPTS, getGenImageUrl } from '../../utils/imageGen'
import {
  TOURBUS_LANE_COUNT,
  TOURBUS_BUS_Y_PERCENT,
  TOURBUS_BUS_HEIGHT_PERCENT
} from '../../hooks/minigames/constants'

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

    // Animation state
    this.wobbleTime = 0

    // Textures
    this.textures = {
      bus: null,
      road: null,
      rock: null,
      barrier: null,
      fuel: null
    }

    this.colors = {
      warningYellow: getPixiColorFromToken('--warning-yellow'),
      bloodRed: getPixiColorFromToken('--blood-red'),
      toxicGreen: getPixiColorFromToken('--toxic-green')
    }
  }

  async setup() {
    // Setup Layers
    this.roadContainer = new Container()
    this.obstacleContainer = new Container()
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

      const loaded = await loadTextures(urls)

      const keys = Object.keys(loaded)
      for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i]
        if (loaded[key]) this.textures[key] = loaded[key]
      }
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
    this.laneWidth = width / TOURBUS_LANE_COUNT

    // Clear previous
    const children = this.roadContainer.removeChildren()
    for (let i = 0, len = children.length; i < len; i++) {
      children[i].destroy()
    }

    // Use TilingSprite if texture loaded AND source is valid, else Graphics fallback.
    // Image-element textures may have sources that crash TilingSprite (_resolution null).
    const roadTex = this.textures.road
    const isRoadTexValid = roadTex?.source && !roadTex.source.destroyed

    if (isRoadTexValid) {
      this.roadStripes = new TilingSprite({
        texture: roadTex,
        width,
        height
      })
      this.roadContainer.addChild(this.roadStripes)
    } else {
      this.roadStripes = null
      const bg = new Graphics()
      bg.rect(0, 0, width, height)
      bg.fill(getPixiColorFromToken('--void-black'))
      this.roadContainer.addChild(bg)

      // Draw lane dividers
      for (let i = 1; i < TOURBUS_LANE_COUNT; i++) {
        const line = new Graphics()
        line.rect(i * this.laneWidth - 2, 0, 4, height)
        line.fill({ color: getPixiColorFromToken('--ash-gray'), alpha: 0.3 })
        this.roadContainer.addChild(line)
      }
    }
  }

  createBus() {
    const height = this.app.screen.height

    if (this.textures.bus) {
      this.busSprite = new Sprite(this.textures.bus)
      this.busSprite.anchor.set(0.5, 1)
    } else {
      // Fallback
      const g = new Graphics()
      g.rect(-25, -80, 50, 80)
      g.fill(getPixiColorFromToken('--toxic-green'))
      this.busSprite = g
    }
    // Scale bus to fit lane width AND a max height
    const targetW = this.laneWidth * 0.6
    // Visual height slightly larger than collision box for aesthetics
    const targetH = height * ((TOURBUS_BUS_HEIGHT_PERCENT + 5) / 100)
    const texW = this.busSprite.texture?.width || this.busSprite.width || 60
    const texH = this.busSprite.texture?.height || this.busSprite.height || 80
    const busScale = Math.min(targetW / texW, targetH / texH)
    this.busSprite.scale.set(busScale)

    this.container.addChild(this.busSprite)
  }

  _updateBusPosition(state, dt, height) {
    if (this.busSprite) {
      const targetX = state.busLane * this.laneWidth + this.laneWidth / 2

      // Frame-independent Lerp
      // Using exponential decay: lerp(a, b, 1 - exp(-decay * dt))
      // Decay factor ~10 for snappy movement
      const dtSeconds = dt / 1000
      const lerpFactor = 1 - Math.exp(-10 * dtSeconds)

      this.busSprite.x += (targetX - this.busSprite.x) * lerpFactor
      // Position bottom of bus at bottom of collision box
      this.busSprite.y =
        height * ((TOURBUS_BUS_Y_PERCENT + TOURBUS_BUS_HEIGHT_PERCENT) / 100)

      // Wobble effect based on accumulated deterministic time
      // Wrap at the exact period of sin(x/100) to prevent float precision loss on long sessions
      this.wobbleTime = (this.wobbleTime + dt) % (Math.PI * 2 * 100)
      this.busSprite.rotation = Math.sin(this.wobbleTime / 100) * 0.05
    }
  }

  _updateRoadScroll(state, dt, height) {
    if (this.roadStripes) {
      // Speed is relative units per ms.
      // Let's say speed 0.05 => 50 units per sec.
      // We need pixel speed.
      // Height is 100 units. So 1 unit = height/100 pixels.
      const pixelSpeed = state.speed * (height / 100) * dt
      this.roadStripes.tilePosition.y += pixelSpeed
    }
  }

  _updateObstacles(state, height) {
    this.currentIds.clear()

    for (let i = 0, len = state.obstacles.length; i < len; i++) {
      const obs = state.obstacles[i]
      this.currentIds.add(obs.id)
      let sprite = this.obstacleMap.get(obs.id)

      if (!sprite) {
        // Choose texture
        let tex = null
        if (obs.type === 'FUEL') tex = this.textures.fuel
        else if (obs.type === 'OBSTACLE') tex = this.textures.rock // Randomize?

        if (tex) {
          sprite = new Sprite(tex)
          sprite.anchor.set(0.5)
          // Scale to fit lane width AND a max height
          const targetW = this.laneWidth * 0.4
          const targetH = height * 0.15
          const scale = Math.min(targetW / tex.width, targetH / tex.height)
          sprite.scale.set(scale)
        } else {
          sprite = new Graphics()
          if (obs.type === 'FUEL') {
            sprite.circle(0, 0, 20)
            sprite.fill(this.colors.warningYellow)
          } else {
            sprite.rect(-25, -25, 50, 50)
            sprite.fill(this.colors.bloodRed)
          }
        }

        // Custom property to track explosion state
        sprite.hasExploded = false

        this.obstacleContainer.addChild(sprite)
        this.obstacleMap.set(obs.id, sprite)
      } else if (!obs.collided) {
        sprite.hasExploded = false
        sprite.alpha = 1
      }

      // Update position
      const x = obs.lane * this.laneWidth + this.laneWidth / 2
      const y = (obs.y / 100) * height
      sprite.x = x
      sprite.y = y

      // Visual feedback for collision
      if (obs.collided) {
        sprite.alpha = 0.5

        if (!sprite.hasExploded) {
          sprite.hasExploded = true
          if (obs.type === 'OBSTACLE') {
            this.effectManager.spawnHitEffect(x, y, this.colors.bloodRed) // Red explosion
          } else if (obs.type === 'FUEL') {
            this.effectManager.spawnHitEffect(x, y, this.colors.toxicGreen) // Green sparkle
          }
        }
      } else {
        sprite.hasExploded = false
        sprite.alpha = 1
      }
    }
  }

  _cleanupObstacles() {
    // Performance optimization: Iterate over the Map's keys instead of entries to prevent
    // per-frame garbage collection pauses caused by allocating [id, sprite] arrays.
    for (const id of this.obstacleMap.keys()) {
      if (!this.currentIds.has(id)) {
        const sprite = this.obstacleMap.get(id)
        sprite.destroy() // PixiJS automatically removes from parent
        this.obstacleMap.delete(id)
      }
    }
  }

  update(dt) {
    if (this.effectManager) this.effectManager.update(dt)

    const state = this.gameStateRef.current
    if (!state) return

    const height = this.app.screen.height

    this._updateRoadScroll(state, dt, height)
    this._updateBusPosition(state, dt, height)
    this._updateObstacles(state, height)
    this._cleanupObstacles()
  }

  dispose() {
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

    super.dispose()
  }
}

export const createTourbusStageController = params =>
  new TourbusStageController(params)
