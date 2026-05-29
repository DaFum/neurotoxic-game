import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { EffectManager } from './EffectManager'
import type { TourbusObstacle } from '../../types/tourbus'

export type TourbusRenderState = {
  obstacles: TourbusObstacle[]
}

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

  private cleanupObstacle(
    sprite: (Sprite | Graphics) & { hasExploded?: boolean },
    id: string | number
  ) {
    if (!this.currentIds.has(id)) {
      if (sprite) sprite.destroy() // PixiJS automatically removes from parent
      this.obstacleMap.delete(id)
    }
  }

  cleanupObstacles() {
    // Performance optimization: Iterate using forEach to prevent
    // per-frame garbage collection pauses caused by allocating [id, sprite] arrays in entries(),
    // while also avoiding the redundant .get(id) lookup.
    // Using a class method and passing `this` avoids closure allocation.
    this.obstacleMap.forEach(this.cleanupObstacle, this)
  }

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
