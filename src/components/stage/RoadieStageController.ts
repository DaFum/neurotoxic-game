import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { BaseStageController } from './BaseStageController'
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
  playerContainer: Container | null
  playerSprite: Sprite | Graphics | null
  itemSprite: Sprite | null
  carSprites: Map<string | number, Sprite | Graphics> | null
  currentIds: Set<string | number>
  effectManager: EffectManager | null
  _flashTimeout: ReturnType<typeof setTimeout> | null
  lastDamage: number
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

  constructor(params: any) {
    super(params)
    this.playerContainer = null
    this.playerSprite = null
    this.itemSprite = null
    this.carSprites = new Map()
    this.currentIds = new Set() // Reuse Set to avoid GC
    this.effectManager = null

    this._flashTimeout = null
    this.lastDamage = 0
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

    // Player Container (Groups body + item)
    this.playerContainer = new Container()
    this.container.addChild(this.playerContainer)

    // Compute cell dimensions for sprite sizing
    const screenW = this.app.screen.width
    const screenH = this.app.screen.height
    const cellW = screenW / ROADIE_GRID_WIDTH
    const cellH = screenH / ROADIE_GRID_HEIGHT

    // Player Sprite
    if (this.textures.roadie) {
      this.playerSprite = new Sprite(this.textures.roadie)
      this.playerSprite.anchor.set(0.5)
      // Scale to fit ~1 cell
      const playerScale =
        Math.min(
          cellW / this.textures.roadie.width,
          cellH / this.textures.roadie.height
        ) * 0.8
      this.playerSprite.scale.set(playerScale)
    } else {
      this.playerSprite = new Graphics()
      this.playerSprite.circle(0, 0, 20)
      this.playerSprite.fill(this.colors.toxicGreen)
    }
    this.playerContainer.addChild(this.playerSprite)

    // Item Sprite (Placeholder for now, visible only when carrying)
    this.itemSprite = new Sprite()
    this.itemSprite.anchor.set(0.5)
    this.itemSprite.y = -(cellH * 0.3) // Above head
    this.itemSprite.visible = false
    this.playerContainer.addChild(this.itemSprite)
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
    if (this.isDisposed || !this.app || !this.playerContainer) return

    if (this.effectManager) this.effectManager.update(dt)

    if (!this.gameStateRef.current) return
    const state = this.gameStateRef.current

    if (!state.playerPos) return

    const screenW = this.app.screen.width
    const screenH = this.app.screen.height
    const cellW = screenW / ROADIE_GRID_WIDTH
    const cellH = screenH / ROADIE_GRID_HEIGHT

    this._updatePlayerPosition(state, cellW, cellH)
    this._updateCarryingVisuals(state, cellW, cellH)
    this._checkDamageTriggers(state)
    this._renderTraffic(state, cellW, cellH)
    this._cleanupTraffic()
  }

  _updatePlayerPosition(state: any, cellW: any, cellH: any) {
    if (this.playerContainer) {
      this.playerContainer.x = (state.playerPos.x + 0.5) * cellW
      this.playerContainer.y = (state.playerPos.y + 0.5) * cellH
    }
  }

  _updateCarryingVisuals(state: any, cellW: any, cellH: any) {
    if (this.itemSprite && this.textures.items) {
      if (state.carrying) {
        this.itemSprite.visible = true
        // Set texture based on type
        const tex = this.textures.items[state.carrying.type]
        if (tex && tex.width > 0 && tex.height > 0) {
          this.itemSprite.texture = tex
          // Scale item to fit ~0.6 of a cell
          const itemScale =
            Math.min(cellW / tex.width, cellH / tex.height) * 0.6
          this.itemSprite.scale.set(itemScale)
        } else {
          this.itemSprite.texture = Texture.WHITE
          this.itemSprite.scale.set(0.3)
        }
      } else {
        this.itemSprite.visible = false
      }
    }
  }

  _checkDamageTriggers(state: any) {
    if (state.equipmentDamage > this.lastDamage) {
      // Trigger Hit Effect
      const redColor = this.colors.bloodRed
      if (this.effectManager) {
        this.effectManager.spawnHitEffect(
          this.playerContainer.x,
          this.playerContainer.y,
          redColor
        )
      }
      this.lastDamage = state.equipmentDamage

      // Flash player
      if (this.playerSprite) {
        this.playerSprite.tint = redColor
        if (this._flashTimeout) clearTimeout(this._flashTimeout)
        this._flashTimeout = setTimeout(() => {
          if (this.playerSprite && !this.isDisposed)
            this.playerSprite.tint = this.colors.starWhite
          this._flashTimeout = null
        }, 200)
      }
    }
  }

  _getOrCreateCarSprite(car: any) {
    let sprite = this.carSprites.get(car.id)
    if (sprite) return sprite

    if (this.textures.cars.length > 0) {
      let textureHash = car.textureHash
      if (!Number.isFinite(textureHash)) {
        textureHash = hashString(
          String(car.id ?? `car_${car.row}_${car.speed}`)
        )
      }
      const texIndex =
        Math.floor(Math.abs(textureHash)) % this.textures.cars.length
      sprite = new Sprite(this.textures.cars[texIndex])
      sprite.isSprite = true
      sprite.anchor.set(0.5)
    } else {
      sprite = new Graphics()
      sprite.rect(-30, -20, 60, 40)
      sprite.fill(this.colors.bloodRed)
    }

    this.container.addChild(sprite)
    this.carSprites.set(car.id, sprite)
    return sprite
  }

  _renderTraffic(state: any, cellW: any, cellH: any) {
    if (!Array.isArray(state.traffic)) return

    this.currentIds.clear()
    for (const car of state.traffic) {
      this.currentIds.add(car.id)
      const sprite = this._getOrCreateCarSprite(car)

      sprite.x = (car.x + car.width / 2) * cellW
      sprite.y = (car.row + 0.5) * cellH

      // Flip if moving left
      if (car.speed < 0) {
        sprite.scale.x = -Math.abs(sprite.scale.x)
      } else {
        sprite.scale.x = Math.abs(sprite.scale.x)
      }

      // Adjust Scale if texture — constrain both width AND height
      if (sprite.isSprite && sprite.texture?.width > 0) {
        const targetW = car.width * cellW
        const targetH = cellH * 0.7
        const scale = Math.min(
          targetW / sprite.texture.width,
          targetH / sprite.texture.height
        )
        sprite.scale.set(
          Math.abs(scale) * Math.sign(sprite.scale.x),
          Math.abs(scale)
        )
      } else {
        // Fallback or Graphics
        sprite.width = car.width * cellW
        sprite.height = cellH * 0.7
      }
    }
  }

  _cleanupTraffic() {
    if (this.carSprites && this.carSprites.size > 0) {
      for (const id of this.carSprites.keys()) {
        if (!this.currentIds.has(id)) {
          const sprite = this.carSprites.get(id)
          try {
            this.container.removeChild(sprite)
          } catch (error) {
            logger.error(
              'RoadieStageController',
              `Error removing sprite from container for id ${id}:`,
              error
            )
          }

          try {
            sprite.destroy()
          } catch (error) {
            logger.error(
              'RoadieStageController',
              `Error destroying sprite for id ${id}:`,
              error
            )
          } finally {
            this.carSprites.delete(id)
          }
        }
      }
    }
  }

  dispose() {
    if (this._flashTimeout) {
      clearTimeout(this._flashTimeout)
      this._flashTimeout = null
    }

    // Clean up car sprites explicitly
    if (this.carSprites) {
      for (const sprite of this.carSprites.values()) {
        sprite.destroy()
      }
      this.carSprites.clear()
      this.carSprites = null
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
