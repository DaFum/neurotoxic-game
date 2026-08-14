import { Container, Graphics, Sprite } from 'pixi.js'
import { logger } from '../../utils/logger'
import { hashString } from '../../utils/stringUtils'
import { finiteNumberOr } from '../../utils/finiteNumber'

/**
 * Represents a runtime vehicle obstacle tracked by the Roadie traffic manager.
 *
 * @remarks
 * This type defines the properties of a vehicle obstacle moving across the screen,
 * including its identifier, positional data, movement speed, and an optional texture hash.
 */
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

/**
 * Manages Roadie traffic rendering resources and state.
 *
 * @remarks
 * Handles the creation, rendering, pooling, and cleanup of vehicle sprites
 * based on the current traffic state during gameplay. It tracks active vehicles
 * by their identifiers and dynamically adjusts their positions and scales.
 */
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

  /**
   * Initializes the RoadieTrafficManager with its container, textures, and color configuration.
   *
   * @param container - The PixiJS container where car sprites will be added
   * @param textures - The collection of available car textures
   * @param colors - The color configurations, including the blood red fallback color
   */
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

  /**
   * Retrieves an existing sprite for a car or creates a new one if it does not exist.
   *
   * @remarks
   * When creating a new sprite, this method will attempt to assign a texture based on
   * a consistent hash derived from the car's state. If no textures are available, it falls
   * back to rendering a red rectangular graphic.
   *
   * @param car - The vehicle state data used to derive the sprite
   * @returns The newly created or existing sprite or graphics instance
   */
  _getOrCreateCarSprite(car: RoadieCar) {
    let sprite = this.carSprites.get(car.id)
    if (sprite) return sprite

    if (this.textures.cars.length > 0) {
      const textureHash = finiteNumberOr(
        car.textureHash,
        hashString(String(car.id ?? `car_${car.row}_${car.speed}`))
      )
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

  /**
   * Updates and renders all active traffic vehicles based on the current state.
   *
   * @remarks
   * This method synchronizes the visual sprites with the logical traffic state, creating
   * new sprites as needed, updating their positions and scaling based on the grid cell dimensions,
   * and flipping them horizontally depending on their movement direction.
   *
   * @param state - The current traffic state containing an array of active vehicles
   * @param cellW - The calculated width of a single grid cell
   * @param cellH - The calculated height of a single grid cell
   */
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

  /**
   * Removes and destroys any vehicle sprites that are no longer present in the active state.
   *
   * @remarks
   * Compares the set of currently tracked sprite IDs against the IDs encountered
   * during the last render pass, safely destroying unneeded sprites to free memory.
   */
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

  /**
   * Performs a complete teardown of the traffic manager.
   *
   * @remarks
   * Destroys all remaining car sprites and clears the tracked sprite map to release resources.
   */
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
