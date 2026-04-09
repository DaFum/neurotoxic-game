import { describe, test, expect, vi, beforeEach } from 'vitest'
import { Container, Texture } from 'pixi.js'
import { EffectManager } from '../../src/components/stage/EffectManager'

vi.mock('pixi.js', () => {
  class Container {
    constructor() { this.children = [] }
    addChild(c) { this.children.push(c) }
    removeChild(c) { const i = this.children.indexOf(c); if(i !== -1) this.children.splice(i, 1) }
    destroy() {}
  }
  class _Sprite {
    constructor() {
      this.anchor = { set: vi.fn() }
      this.scale = { set: vi.fn() }
      this.destroy = vi.fn()
      this.visible = true
      this.life = 1.0
      this.alpha = 1
    }
  }
  return { Container, Sprite: _Sprite, Texture: { WHITE: {} } }
})

describe('EffectManager', () => {
  let app
  let parentContainer
  let manager

  beforeEach(() => {
    app = { renderer: { generateTexture: vi.fn() } }
    parentContainer = new Container()
    manager = new EffectManager(app, parentContainer)
    manager.init()

    // Mock texture resolution to avoid needing actual Pixi app context
    manager.textureManager.resolveHitTexture = vi.fn().mockReturnValue(Texture.WHITE)
  })

  test('releaseEffectToPool pools sprites correctly', () => {
    // 1. Spawn a hit effect
    manager.spawnHitEffect(0, 0, 0xff0000)

    // The effect is now in activeEffects[0]
    expect(manager.effectCount).toBe(1)
    const effect = manager.activeEffects[manager.headIndex]

    // 2. Advance time to trigger decay past 0
    // update takes deltaMS. Decay rate is 3 * (deltaMS / 1000).
    // To decay life 1.0 to <= 0, we need deltaSec > 0.333
    manager.update(400) // 400ms = 0.4s. 0.4 * 3 = 1.2 decay.

    // 3. Assert pool size incremented
    expect(manager.effectCount).toBe(0)
    expect(manager.spritePool.length).toBe(1)

    // 4. Spawn again to reuse the pooled sprite
    manager.spawnHitEffect(0, 0, 0x00ff00)
    expect(manager.spritePool.length).toBe(0)
    expect(manager.effectCount).toBe(1)
    const reusedEffect = manager.activeEffects[manager.headIndex]

    // The same instance should be reused
    expect(reusedEffect).toBe(effect)
  })

  test('releaseEffectToPool does not pool non-sprites and removes them from container', () => {
    // Construct a non-sprite effect mock
    const nonSpriteEffect = {
      destroy: vi.fn(),
      visible: true,
      isSprite: false
    }

    // Add to container manually since we're testing releaseEffectToPool directly
    manager.container.addChild(nonSpriteEffect)
    expect(manager.container.children.length).toBe(1)

    // Call releaseEffectToPool
    manager.releaseEffectToPool(nonSpriteEffect)

    // Assert it was not added to the sprite pool
    expect(manager.spritePool.length).toBe(0)

    // Assert it was removed from the container
    expect(manager.container.children.length).toBe(0)

    // Assert its destroy method was called (since it's not pooled)
    expect(nonSpriteEffect.destroy).toHaveBeenCalled()

    // Assert it was made invisible
    expect(nonSpriteEffect.visible).toBe(false)
  })
})
