import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { logger } from '../../utils/logger'
import { hashString } from '../../utils/stringUtils'

export class RoadieTrafficManager {
  container: Container
  textures: {
    cars: import('pixi.js').Texture[]
  }
  colors: {
    bloodRed: number
  }
  carSprites: Map<string | number, Sprite | Graphics>
  currentIds: Set<string | number>

  constructor(
    container: Container,
    textures: { cars: import('pixi.js').Texture[] },
    colors: { bloodRed: number }
  ) {
    this.container = container
    this.textures = textures
    this.colors = colors
    this.carSprites = new Map()
    this.currentIds = new Set() // Reuse Set to avoid GC
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
      ;(sprite as any).isSprite = true
      sprite.anchor.set(0.5)
    } else {
      sprite = new Graphics()
      ;(sprite as Graphics).rect(-30, -20, 60, 40)
      ;(sprite as Graphics).fill(this.colors.bloodRed)
    }

    this.container.addChild(sprite)
    this.carSprites.set(car.id, sprite)
    return sprite
  }

  renderTraffic(state: any, cellW: any, cellH: any) {
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
      if ((sprite as any).isSprite && (sprite as Sprite).texture?.width > 0) {
        const texSprite = sprite as Sprite
        const targetW = car.width * cellW
        const targetH = cellH * 0.7
        const scale = Math.min(
          targetW / texSprite.texture.width,
          targetH / texSprite.texture.height
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

  cleanupTraffic() {
    if (this.carSprites && this.carSprites.size > 0) {
      for (const id of this.carSprites.keys()) {
        if (!this.currentIds.has(id)) {
          const sprite = this.carSprites.get(id)
          if (!sprite) continue

          try {
            this.container.removeChild(sprite)
          } catch (error) {
            logger.error(
              'RoadieTrafficManager',
              `Error removing sprite from container for id ${id}:`,
              error
            )
          }

          try {
            sprite.destroy()
          } catch (error) {
            logger.error(
              'RoadieTrafficManager',
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
    // Clean up car sprites explicitly
    if (this.carSprites) {
      for (const sprite of this.carSprites.values()) {
        sprite.destroy()
      }
      this.carSprites.clear()
    }
  }
}
