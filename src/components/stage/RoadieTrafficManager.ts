import { Container, Graphics, Sprite } from 'pixi.js'
import { logger } from '../../utils/logger'
import { hash31 } from '../../utils/stringUtils'
import { finiteNumberOr } from '../../utils/finiteNumber'

/**
 * Represents a runtime vehicle obstacle tracked by the Roadie traffic manager.
 *
 * @remarks
 * This type defines the properties of a vehicle obstacle moving across the screen,
 * including its identifier, positional data, movement speed, and a required texture hash.
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

type RoadieSpriteMember = Sprite & { isSprite: true }
type RoadieGraphicsMember = Graphics & { isSprite: false }
type RoadieCarDisplayObject = RoadieSpriteMember | RoadieGraphicsMember

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
  carSprites: Map<string | number, RoadieCarDisplayObject>
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
  _getOrCreateCarSprite(car: RoadieCar): RoadieCarDisplayObject {
    let sprite = this.carSprites.get(car.id)
    if (sprite) return sprite

    if (this.textures.cars.length > 0) {
      const textureHash = finiteNumberOr(
        car.textureHash,
        hash31(String(car.id ?? `car_${car.row}_${car.speed}`))
      )
      const texIndex =
        Math.floor(Math.abs(textureHash)) % this.textures.cars.length
      const texture = this.textures.cars[texIndex]
      if (!texture) {
        const gfx = new Graphics() as RoadieGraphicsMember
        gfx.rect(-30, -20, 60, 40)
        gfx.fill(this.colors.bloodRed)
        gfx.isSprite = false
        sprite = gfx
      } else {
        const sp = new Sprite(texture) as RoadieSpriteMember
        sp.anchor.set(0.5)
        sp.isSprite = true
        sprite = sp
      }
    } else {
      const gfx = new Graphics() as RoadieGraphicsMember
      gfx.rect(-30, -20, 60, 40)
      gfx.fill(this.colors.bloodRed)
      gfx.isSprite = false
      sprite = gfx
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
    // ⚡ BOLT OPTIMIZATION: Removed unnecessary runtime type validation and object allocation inside the hot path.
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
      // ⚡ BOLT OPTIMIZATION: Read discriminated `isSprite` boolean property instead of walking prototype chain via `instanceof Sprite`.
      // What: Replaced `sprite instanceof Sprite` prototype chain traversal with direct `isSprite` check in 60 FPS update loop.
      // Why: `instanceof` prototype chain traversal across PixiJS display objects on every frame creates measurable execution overhead.
      // Impact: Eliminates prototype chain lookups for all active traffic car display objects in 60 FPS update loop.
      if (sprite.isSprite && sprite.texture?.width > 0) {
        const targetW = carWidth * cellW
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
    // ⚡ BOLT OPTIMIZATION: Iterating keys and fetching .get(id) only on the stale branch (`!this.currentIds.has(id)`)
    // avoids allocating/destructuring [id, sprite] entry tuples for active car sprites on normal 60 FPS frames.
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
