import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { BaseStageController } from './BaseStageController'
import { RoadieTrafficManager } from './RoadieTrafficManager'
import { RoadiePlayerManager } from './RoadiePlayerManager'
import {
  ROADIE_GRID_WIDTH,
  ROADIE_GRID_HEIGHT
} from '../../hooks/minigames/constants'
import { EffectManager } from './EffectManager'
import { getPixiColorFromToken, loadTextures } from './utils'
import { logger } from '../../utils/logger'
import { IMG_PROMPTS, getGenImageUrl } from '../../utils/imageGen'
import { handleError, GameError } from '../../utils/errorHandler'
import { hashString } from '../../utils/stringUtils'

class RoadieStageController extends BaseStageController {
  effectManager: EffectManager | null
  textures: {
    roadie: import('pixi.js').Texture | null
    cars: import('pixi.js').Texture[]
    items: Record<string, import('pixi.js').Texture | undefined>
  }
  colors: {
    bloodRed: number
    starWhite: number
    toxicGreen: number
    roadColor: number
    grassColor: number
    venueColor: number
  }
  bgGraphics: Graphics | null
  trafficManager: RoadieTrafficManager | null
  playerManager: RoadiePlayerManager | null

  constructor(params: any) {
    super(params)
    this.effectManager = null
    this.trafficManager = null
    this.playerManager = null

    this.textures = {
      roadie: null,
      cars: [],
      items: {}
    }
    this.colors = {
      bloodRed: getPixiColorFromToken('--blood-red'),
      starWhite: getPixiColorFromToken('--star-white'),
      toxicGreen: getPixiColorFromToken('--toxic-green'),
      roadColor: getPixiColorFromToken('--void-black'),
      grassColor: getPixiColorFromToken('--roadie-grass'),
      venueColor: getPixiColorFromToken('--roadie-venue-blue')
    }
  }

  async setup() {
    // Draw Background Grid (Static)
    this.drawBackground()

    // Effect Manager
    this.effectManager = new EffectManager(this.app, this.container)
    this.effectManager.init()

    // Load Assets concurrently
    await Promise.all([this.loadAssets(), this.effectManager.loadAssets()])
    if (this.isDisposed) return

    const screenW = this.app.screen.width
    const screenH = this.app.screen.height
    const cellW = screenW / ROADIE_GRID_WIDTH
    const cellH = screenH / ROADIE_GRID_HEIGHT

    this.playerManager = new RoadiePlayerManager(this.textures, this.colors)
    this.playerManager.setup(this.container, cellW, cellH)
    if (this.effectManager) {
      this.playerManager.setEffectManager(this.effectManager)
    }

    this.trafficManager = new RoadieTrafficManager(this.container, this.textures, this.colors)
  }

  async loadAssets() {
    try {
      // URLs
      const urls = {
        roadie: getGenImageUrl(IMG_PROMPTS.MINIGAME_ROADIE_IDLE),
        carA: getGenImageUrl(IMG_PROMPTS.MINIGAME_CAR_A),
        carB: getGenImageUrl(IMG_PROMPTS.MINIGAME_CAR_B),
        carC: getGenImageUrl(IMG_PROMPTS.MINIGAME_CAR_C),
        amp: getGenImageUrl(IMG_PROMPTS.MINIGAME_ITEM_AMP),
        drums: getGenImageUrl(IMG_PROMPTS.MINIGAME_ITEM_DRUMS),
        guitar: getGenImageUrl(IMG_PROMPTS.MINIGAME_ITEM_GUITAR)
      }

      const loaded = (await loadTextures(urls, undefined)) as Record<
        keyof typeof urls,
        import('pixi.js').Texture | null
      >

      if (this.isDisposed) return

      this.textures.roadie = loaded.roadie
      const cars = []
      if (loaded.carA) cars.push(loaded.carA)
      if (loaded.carB) cars.push(loaded.carB)
      if (loaded.carC) cars.push(loaded.carC)
      this.textures.cars = cars
      this.textures.items = {
        AMP: loaded.amp,
        DRUMS: loaded.drums,
        GUITAR: loaded.guitar
      }
    } catch (e) {
      handleError(
        new GameError('Asset load failed', {
          context: { originalError: e instanceof Error ? e : String(e) }
        })
      )
    }
  }

  draw() {
    this.drawBackground()
  }

  drawBackground() {
    if (this.bgGraphics) {
      this.container.removeChild(this.bgGraphics)
      this.bgGraphics.destroy()
    }

    const g = new Graphics()
    this.bgGraphics = g

    // Use screen width for better drawing
    const width = this.app ? this.app.screen.width : 2000
    const height = this.app ? this.app.screen.height : 600
    const cellH = height / ROADIE_GRID_HEIGHT // dynamic height

    // Start zone (row 0)
    g.rect(0, 0, width, cellH)
    g.fill(this.colors.grassColor)

    // Road
    g.rect(0, cellH, width, cellH * 6)
    g.fill(this.colors.roadColor)

    // Venue zone (row 7)
    g.rect(0, cellH * 7, width, cellH)
    g.fill(this.colors.venueColor)

    // Stripes
    for (let r = 2; r <= 6; r++) {
      for (let x = 0; x < width; x += 100) {
        g.rect(x, r * cellH - 2, 60, 4)
        g.fill(this.colors.starWhite)
      }
    }

    // Add at index 0 (bottom)
    this.container.addChildAt(g, 0)
  }

  update(dt: any) {
    if (this.isDisposed || !this.app || !this.playerManager?.playerContainer) return

    if (this.effectManager) this.effectManager.update(dt)

    if (!this.gameStateRef.current) return
    const state = this.gameStateRef.current

    if (!state.playerPos) return

    const screenW = this.app.screen.width
    const screenH = this.app.screen.height
    const cellW = screenW / ROADIE_GRID_WIDTH
    const cellH = screenH / ROADIE_GRID_HEIGHT

    if (this.playerManager) {
      this.playerManager.updatePlayerPosition(state, cellW, cellH)
      this.playerManager.updateCarryingVisuals(state, cellW, cellH)
      this.playerManager.checkDamageTriggers(state, this.isDisposed)
    }

    if (this.trafficManager) {
      this.trafficManager.renderTraffic(state, cellW, cellH)
      this.trafficManager.cleanupTraffic()
    }
  }

  dispose() {
    if (this.playerManager) {
      this.playerManager.dispose()
      this.playerManager = null
    }

    if (this.trafficManager) {
      this.trafficManager.dispose()
      this.trafficManager = null
    }

    if (this.effectManager) {
      this.effectManager.dispose()
      this.effectManager = null
    }

    super.dispose()
  }
}

export const createRoadieStageController = (params: any) =>
  new RoadieStageController(params)
