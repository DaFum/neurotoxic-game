
import * as PIXI from 'pixi.js'
import { GRID_WIDTH, GRID_HEIGHT } from '../../hooks/minigames/constants'
import { EffectManager } from './EffectManager'
import { logger } from '../../utils/logger'
import { getPixiColorFromToken, loadTexture, getOptimalResolution } from './utils'
import { IMG_PROMPTS, getGenImageUrl } from '../../utils/imageGen'

class RoadieStageController {
  constructor({ containerRef, gameStateRef, updateRef, statsRef }) {
    this.containerRef = containerRef
    this.gameStateRef = gameStateRef
    this.updateRef = updateRef
    this.statsRef = statsRef
    this.app = null
    this.container = null
    this.playerContainer = null
    this.playerSprite = null
    this.itemSprite = null
    this.carSprites = new Map()
    this.effectManager = null
    this.isDisposed = false
    this.initPromise = null
    this.handleTicker = this.handleTicker.bind(this)
    this.handleResize = this.handleResize.bind(this)

    this._flashTimeout = null
    this.lastDamage = 0
    this.textures = {
        roadie: null,
        cars: [],
        items: {}
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
                resolution: getOptimalResolution(),
                autoDensity: true
            })

            if (this.isDisposed) {
                this.dispose()
                return
            }

            container.appendChild(this.app.canvas)
            this.container = new PIXI.Container()
            this.app.stage.addChild(this.container)

            // Draw Background Grid (Static)
            this.drawBackground()

            // Effect Manager
            this.effectManager = new EffectManager(this.app, this.container)
            this.effectManager.init()

            // Load Assets
            await this.loadAssets()
            await this.effectManager.loadAssets()

            // Player Container (Groups body + item)
            this.playerContainer = new PIXI.Container()
            this.container.addChild(this.playerContainer)

            // Compute cell dimensions for sprite sizing
            const screenW = this.app.screen.width
            const screenH = this.app.screen.height
            const cellW = screenW / GRID_WIDTH
            const cellH = screenH / GRID_HEIGHT

            // Player Sprite
            if (this.textures.roadie) {
                this.playerSprite = new PIXI.Sprite(this.textures.roadie)
                this.playerSprite.anchor.set(0.5)
                // Scale to fit ~1 cell
                const playerScale = Math.min(cellW / this.textures.roadie.width, cellH / this.textures.roadie.height) * 0.8
                this.playerSprite.scale.set(playerScale)
            } else {
                this.playerSprite = new PIXI.Graphics()
                this.playerSprite.circle(0, 0, 20)
                const toxicGreen = getPixiColorFromToken('--toxic-green')
                this.playerSprite.fill(toxicGreen)
            }
            this.playerContainer.addChild(this.playerSprite)

            // Item Sprite (Placeholder for now, visible only when carrying)
            this.itemSprite = new PIXI.Sprite()
            this.itemSprite.anchor.set(0.5)
            this.itemSprite.y = -(cellH * 0.3) // Above head
            this.itemSprite.visible = false
            this.playerContainer.addChild(this.itemSprite)

            window.addEventListener('resize', this.handleResize)
            this.app.ticker.add(this.handleTicker)

        } catch (e) {
            logger.error('RoadieStageController', 'Init Failed', e)
            this.dispose()
        }
    })()
    return this.initPromise
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


          const loaded = {}
          const keys = Object.keys(urls)
          const results = await Promise.allSettled(keys.map(k => loadTexture(urls[k]).then(t => ({ key: k, texture: t }))))

          results.forEach(res => {
              if (res.status === 'fulfilled' && res.value && res.value.texture) {
                  loaded[res.value.key] = res.value.texture
              }
          })

          this.textures.roadie = loaded.roadie
          this.textures.cars = [loaded.carA, loaded.carB, loaded.carC].filter(Boolean)
          this.textures.items = {
              'AMP': loaded.amp,
              'DRUMS': loaded.drums,
              'GUITAR': loaded.guitar
          }
      } catch (e) {
          logger.warn('RoadieStageController', 'Asset load failed', e)
      }
  }

  drawBackground() {
      // Clear previous background (assuming it's the first child or search for it)
      // Since container only has background + playerContainer + carSprites, and background is first.
      // But clearing all children destroys playerContainer.
      // I should store bg reference.
      if (this.bgGraphics) {
          this.container.removeChild(this.bgGraphics)
          this.bgGraphics.destroy()
      }

      const g = new PIXI.Graphics()
      this.bgGraphics = g
      const roadColor = getPixiColorFromToken('--void-black') || 0x000000
      const grassColor = getPixiColorFromToken('--roadie-grass') || getPixiColorFromToken('--toxic-green') || 0x00FF41
      const venueColor = getPixiColorFromToken('--roadie-venue-blue') || getPixiColorFromToken('--blood-red') || 0xCC0000
      const stripeColor = getPixiColorFromToken('--star-white') || 0xFFFFFF

      // Use screen width for better drawing
      const width = this.app ? this.app.screen.width : 2000
      const height = this.app ? this.app.screen.height : 600
      const cellH = height / GRID_HEIGHT // dynamic height

      // Start zone (row 0)
      g.rect(0, 0, width, cellH)
      g.fill(grassColor)

      // Road
      g.rect(0, cellH, width, cellH * 6)
      g.fill(roadColor)

      // Venue zone (row 7)
      g.rect(0, cellH * 7, width, cellH)
      g.fill(venueColor)

      // Stripes
      for (let r=2; r<=6; r++) {
         for (let x=0; x<width; x+=100) {
             g.rect(x, r * cellH - 2, 60, 4)
             g.fill(stripeColor)
         }
      }

      // Add at index 0 (bottom)
      this.container.addChildAt(g, 0)
  }

  handleResize() {
      if (!this.app) return
      this.drawBackground()
  }

  handleTicker(ticker) {
      if (this.isDisposed) return
      if (this.updateRef.current) this.updateRef.current(ticker.deltaMS)

      if (this.effectManager) this.effectManager.update(ticker.deltaMS)

      const state = this.gameStateRef.current
      if (!state) return

      const screenW = this.app.screen.width
      const screenH = this.app.screen.height
      const cellW = screenW / GRID_WIDTH
      const cellH = screenH / GRID_HEIGHT

      // Update Player Position
      this.playerContainer.x = (state.playerPos.x + 0.5) * cellW
      this.playerContainer.y = (state.playerPos.y + 0.5) * cellH

      // Visuals: Carrying
      if (state.carrying) {
          this.itemSprite.visible = true
          // Set texture based on type
          const tex = this.textures.items[state.carrying.type]
          if (tex) {
              this.itemSprite.texture = tex
              // Scale item to fit ~0.6 of a cell
              const itemScale = Math.min(cellW / tex.width, cellH / tex.height) * 0.6
              this.itemSprite.scale.set(itemScale)
          } else {
              this.itemSprite.texture = PIXI.Texture.WHITE
              this.itemSprite.scale.set(0.3)
          }
      } else {
          this.itemSprite.visible = false
      }

      // Check Damage trigger
      if (state.equipmentDamage > this.lastDamage) {
          // Trigger Hit Effect
          const redColor = getPixiColorFromToken('--blood-red')
          this.effectManager.spawnHitEffect(this.playerContainer.x, this.playerContainer.y, redColor)
          this.lastDamage = state.equipmentDamage

          // Flash player
          this.playerSprite.tint = redColor
          if (this._flashTimeout) clearTimeout(this._flashTimeout)
          this._flashTimeout = setTimeout(() => {
              if (this.playerSprite && !this.isDisposed) this.playerSprite.tint = getPixiColorFromToken('--star-white')
              this._flashTimeout = null
          }, 200)
      }

      // Render Traffic
      const currentIds = new Set()
      state.traffic.forEach(car => {
          currentIds.add(car.id)
          let sprite = this.carSprites.get(car.id)
          if (!sprite) {
              // Pick random car texture based on hash of ID or random
              if (this.textures.cars.length > 0) {
                  const texIndex = Math.floor(Math.random() * this.textures.cars.length)
                  sprite = new PIXI.Sprite(this.textures.cars[texIndex])
                  sprite.anchor.set(0.5)
              } else {
                  sprite = new PIXI.Graphics()
                  sprite.rect(-30, -20, 60, 40)
                  sprite.fill(getPixiColorFromToken('--blood-red'))
              }
              this.container.addChild(sprite)
              this.carSprites.set(car.id, sprite)
          }

          sprite.x = (car.x + car.width/2) * cellW
          sprite.y = (car.row + 0.5) * cellH

          // Flip if moving left
          if (car.speed < 0) {
              sprite.scale.x = -Math.abs(sprite.scale.x)
          } else {
              sprite.scale.x = Math.abs(sprite.scale.x)
          }

          // Adjust Scale if texture — constrain both width AND height
          if (sprite instanceof PIXI.Sprite && sprite.texture?.width > 0) {
              const targetW = car.width * cellW
              const targetH = cellH * 0.7
              const scale = Math.min(targetW / sprite.texture.width, targetH / sprite.texture.height)
              sprite.scale.set(Math.abs(scale) * Math.sign(sprite.scale.x), Math.abs(scale))
          } else {
              // Fallback or Graphics
              sprite.width = car.width * cellW
              sprite.height = cellH * 0.7
          }
      })

      // Cleanup
      for (const [id, sprite] of this.carSprites.entries()) {
          if (!currentIds.has(id)) {
              this.container.removeChild(sprite)
              sprite.destroy()
              this.carSprites.delete(id)
          }
      }
  }

  dispose() {
      this.isDisposed = true
      window.removeEventListener('resize', this.handleResize)
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

      if (this.app) {
          try {
            this.app.ticker?.remove(this.handleTicker)
            // v8 signature: destroy(rendererOptions, destroyOptions)
            this.app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true })
          } catch (e) {
            logger.warn('RoadieStageController', 'Destroy failed', e)
          }
          this.app = null
      }
  }
}

export const createRoadieStageController = params => new RoadieStageController(params)
