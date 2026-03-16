import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { Container, Texture, Sprite } from 'pixi.js'
import { EffectManager } from '../src/components/stage/EffectManager.js'

describe('EffectManager', () => {
  let container
  let effectManager

  beforeEach(() => {
    container = new Container()
    effectManager = new EffectManager(null, container)
    effectManager.init()
  })

  it('regression: _getSpriteFromPool handles null texture with Texture.WHITE fallback across reuse cycles', () => {
    // Create first sprite with null texture (fallback)
    const sprite1 = effectManager._getSpriteFromPool(null)

    assert.ok(sprite1 instanceof Sprite)
    assert.equal(sprite1.texture, Texture.WHITE)

    // Return to pool
    effectManager.spritePool.push(sprite1)

    // Reuse sprite with another null texture
    const sprite2 = effectManager._getSpriteFromPool(null)

    assert.equal(sprite1, sprite2, 'Sprite should be reused from pool')
    assert.equal(
      sprite2.texture,
      Texture.WHITE,
      'Texture should remain Texture.WHITE fallback'
    )
  })
})
