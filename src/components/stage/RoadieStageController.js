
import * as PIXI from 'pixi.js'
import { logger } from '../../utils/logger'
import { getPixiColorFromToken } from '../stage/utils'

const CELL_SIZE = 60

export class RoadieStageController {
  constructor({ containerRef, gameStateRef, updateRef, statsRef }) {
    this.containerRef = containerRef
    this.gameStateRef = gameStateRef
    this.updateRef = updateRef
    this.statsRef = statsRef
    this.app = null
    this.container = null
    this.playerSprite = null
    this.carSprites = new Map()
    this.isDisposed = false
    this.initPromise = null
    this.handleTicker = this.handleTicker.bind(this)
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

            // Player Sprite
            this.playerSprite = new PIXI.Graphics()
            this.playerSprite.circle(0, 0, 20)
            this.playerSprite.fill(0x00FF00)
            this.container.addChild(this.playerSprite)

            this.app.ticker.add(this.handleTicker)

        } catch (e) {
            logger.error('RoadieStageController', 'Init Failed', e)
        }
    })()
    return this.initPromise
  }

  drawBackground() {
      const g = new PIXI.Graphics()
      // Draw road rows
      // Rows 1-6 are road.
      const roadColor = getPixiColorFromToken('--void-black') || 0x333333
      const grassColor = 0x224422

      // Start zone (row 0)
      g.rect(0, 0, 8000, CELL_SIZE) // Wide rect to cover screen width
      g.fill(grassColor)

      // Road
      g.rect(0, CELL_SIZE, 8000, CELL_SIZE * 6)
      g.fill(roadColor)

      // Venue zone (row 7)
      g.rect(0, CELL_SIZE * 7, 8000, CELL_SIZE)
      g.fill(0x4444FF) // Blue zone

      // Stripes
      for (let r=2; r<=6; r++) {
         for (let x=0; x<2000; x+=100) {
             g.rect(x, r * CELL_SIZE - 2, 60, 4)
             g.fill(0xFFFFFF)
         }
      }

      this.container.addChild(g)
  }

  handleTicker(ticker) {
      if (this.isDisposed) return
      if (this.updateRef.current) this.updateRef.current(ticker.deltaMS)

      const state = this.gameStateRef.current
      if (!state) return

      // Update Player
      // scale coordinates to screen? or fixed grid?
      // Let's assume fixed grid for now, or scale based on screen width.
      // 12x8 grid.
      const screenW = this.app.screen.width
      const screenH = this.app.screen.height
      const cellW = screenW / 12
      const cellH = screenH / 8

      this.playerSprite.x = (state.playerPos.x + 0.5) * cellW
      this.playerSprite.y = (state.playerPos.y + 0.5) * cellH

      // Change player color if carrying
      if (state.carrying) {
          this.playerSprite.tint = 0xFFA500 // Orange
      } else {
          this.playerSprite.tint = 0x00FF00 // Green
      }

      // Render Traffic
      const currentIds = new Set()
      state.traffic.forEach(car => {
          currentIds.add(car.id)
          let sprite = this.carSprites.get(car.id)
          if (!sprite) {
              sprite = new PIXI.Graphics()
              sprite.rect(0, 0, car.width * cellW, cellH * 0.8)
              sprite.fill(0xFF0000)
              this.container.addChild(sprite)
              this.carSprites.set(car.id, sprite)
          }

          sprite.x = car.x * cellW
          sprite.y = car.row * cellH + (cellH * 0.1)
          sprite.width = car.width * cellW // Ensure width scales
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
      if (this.app) {
          this.app.destroy(true, { children: true })
          this.app = null
      }
  }
}

export const createRoadieStageController = params => new RoadieStageController(params)
