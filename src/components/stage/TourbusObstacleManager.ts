import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { EffectManager } from './EffectManager'

export class TourbusObstacleManager {
  container: Container
  effectManager: EffectManager
  textures: {
    rock: Texture | null
    barrier: Texture | null
    fuel: Texture | null
  }
  colors: {
    warningYellow: number
    bloodRed: number
    toxicGreen: number
  }
  obstacleMap: Map<string | number, Sprite | Graphics | any>
  currentIds: Set<string | number>

  constructor(
    container: Container,
    effectManager: EffectManager,
    textures: any,
    colors: any
  ) {
    this.container = container
    this.effectManager = effectManager
    this.textures = textures
    this.colors = colors

    this.obstacleMap = new Map()
    this.currentIds = new Set()
  }

  updateObstacles(state: any, height: any, laneWidth: any) {
    this.currentIds.clear()

    for (let i = 0, len = state.obstacles.length; i < len; i++) {
      const obs = state.obstacles[i]
      this.currentIds.add(obs.id)
      let sprite = this.obstacleMap.get(obs.id)

      if (!sprite) {
        // Choose texture
        let tex = null
        if (obs.type === 'FUEL') tex = this.textures.fuel
        else if (obs.type === 'OBSTACLE') tex = this.textures.rock // Randomize?

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
          } else {
            sprite.rect(-25, -25, 50, 50)
            sprite.fill(this.colors.bloodRed)
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
          }
        }
      } else {
        sprite.hasExploded = false
        sprite.alpha = 1
      }
    }
  }

  cleanupObstacles() {
    // Performance optimization: Iterate over the Map's keys instead of entries to prevent
    // per-frame garbage collection pauses caused by allocating [id, sprite] arrays.
    for (const id of this.obstacleMap.keys()) {
      if (!this.currentIds.has(id)) {
        const sprite = this.obstacleMap.get(id)
        if (sprite) sprite.destroy() // PixiJS automatically removes from parent
        this.obstacleMap.delete(id)
      }
    }
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
