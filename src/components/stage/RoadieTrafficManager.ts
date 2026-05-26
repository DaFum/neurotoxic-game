import { Container, Graphics, Sprite } from 'pixi.js'
import { logger } from '../../utils/logger'
import { hashString } from '../../utils/stringUtils'

export type RoadieCar = {
  id: string | number
  x: number
  width: number
  row: number
  speed: number
  textureHash?: number
}

type RoadieTrafficState = {
  traffic?: RoadieCar[]
}

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

  _getOrCreateCarSprite(car: RoadieCar) {
    let sprite = this.carSprites.get(car.id)
    if (sprite) return sprite

    if (this.textures.cars.length > 0) {
      const textureHash =
        typeof car.textureHash === 'number' && Number.isFinite(car.textureHash)
          ? car.textureHash
          : hashString(String(car.id ?? `car_${car.row}_${car.speed}`))
      const texIndex =
        Math.floor(Math.abs(textureHash)) % this.textures.cars.length
      const texture = this.textures.cars[texIndex]
      if (!texture) {
        sprite = new Graphics()
        ;(sprite as Graphics).rect(-30, -20, 60, 40)
        ;(sprite as Graphics).fill(this.colors.bloodRed)
      } else {
        sprite = new Sprite(texture)

        sprite.anchor.set(0.5)
      }
    } else {
      sprite = new Graphics()
      ;(sprite as Graphics).rect(-30, -20, 60, 40)
      ;(sprite as Graphics).fill(this.colors.bloodRed)
    }

    this.container.addChild(sprite)
    this.carSprites.set(car.id, sprite)
    return sprite
  }

  renderTraffic(state: RoadieTrafficState, cellW: number, cellH: number) {
    if (!Array.isArray(state.traffic)) {
      this.currentIds.clear()
      this.cleanupTraffic()
      return
    }

    this.currentIds.clear()
    // ⚡ Bolt: Removed unnecessary runtime type validation and object allocation inside the hot path.
    // Traffic array is guaranteed to be well-typed RoadieCar objects from the game logic state.
    for (const car of state.traffic) {
      if (!car) continue
      const carId = car.id
      const carX = car.x
      const carWidth = car.width
      const carRow = car.row
      const carSpeed = car.speed

      this.currentIds.add(carId)
      const sprite = this._getOrCreateCarSprite(car)

      sprite.x = (carX + carWidth / 2) * cellW
      sprite.y = (carRow + 0.5) * cellH

      // Flip if moving left
      if (carSpeed < 0) {
        sprite.scale.x = -Math.abs(sprite.scale.x)
      } else {
        sprite.scale.x = Math.abs(sprite.scale.x)
      }

      // Adjust Scale if texture — constrain both width AND height
      if (sprite instanceof Sprite && (sprite as Sprite).texture?.width > 0) {
        const texSprite = sprite as Sprite
        const targetW = carWidth * cellW
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
        sprite.width = carWidth * cellW
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
