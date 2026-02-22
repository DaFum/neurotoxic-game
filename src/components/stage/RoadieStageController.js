
import * as PIXI from 'pixi.js'
import { logger } from '../../utils/logger'
import { getPixiColorFromToken } from '../stage/utils'
import { IMG_PROMPTS, getGenImageUrl } from '../../utils/imageGen'
import { EffectManager } from './EffectManager'

const CELL_SIZE = 60

export class RoadieStageController {
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
                antialias: true
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

            // Player Sprite
            if (this.textures.roadie) {
                this.playerSprite = new PIXI.Sprite(this.textures.roadie)
                this.playerSprite.anchor.set(0.5)
                this.playerSprite.scale.set(0.5) // Adjust scale to fit cell
            } else {
                this.playerSprite = new PIXI.Graphics()
                this.playerSprite.circle(0, 0, 20)
                // getPixiColorFromToken('--toxic-green') or token value
                const toxicGreen = getPixiColorFromToken('--toxic-green')
                this.playerSprite.fill(toxicGreen)
            }
            this.playerContainer.addChild(this.playerSprite)

            // Item Sprite (Placeholder for now, visible only when carrying)
            this.itemSprite = new PIXI.Sprite()
            this.itemSprite.anchor.set(0.5)
            this.itemSprite.y = -15 // Above head
            this.itemSprite.visible = false
            this.itemSprite.scale.set(0.4)
            this.playerContainer.addChild(this.itemSprite)

            window.addEventListener('resize', this.handleResize)
            this.app.ticker.add(this.handleTicker)

        } catch (e) {
            logger.error('RoadieStageController', 'Init Failed', e)
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
          await Promise.all(keys.map(k => PIXI.Assets.load(urls[k]).then(t => loaded[k] = t)))

          this.textures.roadie = loaded.roadie
          this.textures.cars = [loaded.carA, loaded.carB, loaded.carC]
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
      const roadColor = getPixiColorFromToken('--void-black')
      const grassColor = getPixiColorFromToken('--roadie-grass') || getPixiColorFromToken('--toxic-green') // Fallback
      const venueColor = getPixiColorFromToken('--roadie-venue-blue') || getPixiColorFromToken('--blood-red') // Fallback token
      const stripeColor = getPixiColorFromToken('--star-white')

      // Use screen width for better drawing
      const width = this.app ? this.app.screen.width : 2000
      const height = this.app ? this.app.screen.height : 600
      const cellH = height / 8 // dynamic height

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
      const cellW = screenW / 12 // GRID_WIDTH is 12
      const cellH = screenH / 8 // GRID_HEIGHT is 8

      // Update Player Position
      this.playerContainer.x = (state.playerPos.x + 0.5) * cellW
      this.playerContainer.y = (state.playerPos.y + 0.5) * cellH

      // Visuals: Carrying
      if (state.carrying) {
          this.itemSprite.visible = true
          // Set texture based on type
          const tex = this.textures.items[state.carrying.type]
          if (tex) this.itemSprite.texture = tex
          else this.itemSprite.texture = PIXI.Texture.WHITE // Fallback
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
              if (this.playerSprite && !this.isDisposed) this.playerSprite.tint = 0xFFFFFF
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

                  // Scale to fit car.width (1.5 cells)
                  // Texture width might vary. Target width = 1.5 * cellW
                  // But let's just create it and scale later
              } else {
                  sprite = new PIXI.Graphics()
                  sprite.rect(-30, -20, 60, 40)
                  sprite.fill(0xFF0000)
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

          // Adjust Scale if texture
          if (sprite instanceof PIXI.Sprite) {
              // Target width = car.width * cellW
              const targetW = car.width * cellW
              const scale = targetW / sprite.texture.width
              sprite.scale.set(Math.abs(scale) * Math.sign(sprite.scale.x), Math.abs(scale))
          } else {
              sprite.width = car.width * cellW
              sprite.height = cellH * 0.8
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

      if (this.effectManager) {
          this.effectManager.dispose()
          this.effectManager = null
      }

      if (this.app) {
          try {
            this.app.ticker.remove(this.handleTicker)
            this.app.destroy({ removeView: true, children: true, texture: true })
          } catch (e) {
            logger.warn('RoadieStageController', 'Destroy failed', e)
          }
          this.app = null
      }
  }
}

export const createRoadieStageController = params => new RoadieStageController(params)
