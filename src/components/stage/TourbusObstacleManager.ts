import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { EffectManager } from './EffectManager'
import type { TourbusObstacle } from '../../types/tourbus'

/**
 * State shape for Tourbus Render.
 */
export type TourbusRenderState = {
  /** The list of obstacles to render during the tourbus sequence. */
  obstacles: TourbusObstacle[]
}

/**
 * Manages Tourbus Obstacle rendering resources and state.
 */
export class TourbusObstacleManager {
  container: Container
  effectManager: EffectManager
  textures: {
    rock: Texture | null
    barrier: Texture | null
    fuel: Texture | null
    voidHazard: Texture | null
  }
  colors: {
    warningYellow: number
    bloodRed: number
    toxicGreen: number
    voidPurple: number
  }
  obstacleMap: Map<
    string | number,
    (Sprite | Graphics) & { hasExploded?: boolean }
  >
  currentIds: Set<string | number>

  /**
   * Initializes the obstacle manager with rendering containers and cached assets.
   *
   * @param container - The PixiJS container to hold all obstacle sprites.
   * @param effectManager - The effect manager for triggering collision particles.
   * @param textures - The dictionary of preloaded PixiJS textures for hazards.
   * @param colors - The dictionary of cached CSS tokens mapped to PixiJS numeric colors.
   */
  constructor(
    container: Container,
    effectManager: EffectManager,
    textures: {
      rock: Texture | null
      barrier: Texture | null
      fuel: Texture | null
      voidHazard: Texture | null
    },
    colors: {
      warningYellow: number
      bloodRed: number
      toxicGreen: number
      voidPurple: number
    }
  ) {
    this.container = container
    this.effectManager = effectManager
    this.textures = textures
    this.colors = colors

    this.obstacleMap = new Map()
    this.currentIds = new Set()
  }

  /**
   * Synchronizes the rendering layer with the latest logical obstacle state.
   *
   * @param state - The current render state containing active obstacles.
   * @param height - The total height of the rendering stage.
   * @param laneWidth - The width of a single movement lane.
   */
  updateObstacles(
    state: TourbusRenderState,
    height: number,
    laneWidth: number
  ) {
    this.currentIds.clear()

    for (let i = 0, len = state.obstacles.length; i < len; i++) {
      const obs = state.obstacles[i]
      if (!obs) continue
      this.currentIds.add(obs.id)
      let sprite = this.obstacleMap.get(obs.id)

      if (!sprite) {
        // Choose texture
        let tex = null
        if (obs.type === 'FUEL') {
          tex = this.textures.fuel
        } else if (obs.type === 'OBSTACLE') {
          // Use id to pseudo-randomly determine which obstacle graphic to show
          // keeping it deterministic so it doesn't flicker between frames
          tex =
            String(obs.id).charCodeAt(0) % 2 === 0
              ? this.textures.rock
              : this.textures.barrier
        } else if (obs.type === 'VOID_HAZARD') {
          tex = this.textures.voidHazard
        }

        if (tex) {
          sprite = new Sprite(tex)
          sprite.anchor.set(0.5)
          // Scale to fit lane width AND a max height
          const targetW = laneWidth * 0.4
          const targetH = height * 0.15
          const scale = Math.min(targetW / tex.width, targetH / tex.height)
          sprite.scale.set(scale)
        } else {
          sprite = new Graphics()
          if (obs.type === 'FUEL') {
            sprite.circle(0, 0, 20)
            sprite.fill(this.colors.warningYellow)
          } else if (obs.type === 'OBSTACLE') {
            sprite.rect(-25, -25, 50, 50)
            sprite.fill(this.colors.bloodRed)
          } else if (obs.type === 'VOID_HAZARD') {
            // A distorted shape or polygon for the void hazard
            sprite.moveTo(0, -30)
            sprite.lineTo(25, 0)
            sprite.lineTo(15, 30)
            sprite.lineTo(-15, 30)
            sprite.lineTo(-25, 0)
            sprite.closePath()
            sprite.fill(this.colors.voidPurple)
          }
        }

        // Custom property to track explosion state
        sprite.hasExploded = false

        this.container.addChild(sprite)
        this.obstacleMap.set(obs.id, sprite)
      } else if (!obs.collided) {
        sprite.hasExploded = false
        sprite.alpha = 1
      }
      if (!sprite) continue

      // Update position
      const x = obs.lane * laneWidth + laneWidth / 2
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
          } else if (obs.type === 'VOID_HAZARD') {
            this.effectManager.spawnHitEffect(x, y, this.colors.voidPurple)
          }
        }
      } else {
        sprite.hasExploded = false
        sprite.alpha = 1
      }
    }
  }

  /**
   * Prunes destroyed or out-of-bounds obstacles from the rendering layer.
   *
   * @remarks
   * Iterates directly over Map keys without allocating `[id, sprite]` entry tuples,
   * fetching `.get(id)` only for stale obstacles that require cleanup.
   */
  cleanupObstacles() {
    // ⚡ BOLT OPTIMIZATION: Iterating map keys directly and calling .get(id) only when an obstacle is stale (`!this.currentIds.has(id)`)
    // What: Replaced per-frame `Map.prototype.forEach` callback invocation loop with a direct `for...of` keys loop.
    // Why: Eliminates callback invocation frame overhead and skips map value lookups for active obstacles every 60 FPS tick.
    // Impact: Reduces frame update time and eliminates function invocation overhead during Tourbus minigame rendering.
    if (this.obstacleMap && this.obstacleMap.size > 0) {
      for (const id of this.obstacleMap.keys()) {
        if (!this.currentIds.has(id)) {
          const sprite = this.obstacleMap.get(id)
          if (sprite) sprite.destroy()
          this.obstacleMap.delete(id)
        }
      }
    }
  }

  /**
   * Destroys all sprites and clears memory maps during component teardown.
   */
  dispose() {
    if (this.obstacleMap) {
      for (const sprite of this.obstacleMap.values()) {
        sprite.destroy()
      }
      this.obstacleMap.clear()
    }
    if (this.currentIds) {
      this.currentIds.clear()
    }
  }
}
