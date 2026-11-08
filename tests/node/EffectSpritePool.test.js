import { test, mock, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

class MockSprite {
  constructor(texture) {
    this.texture = texture
    this.anchor = { set: mock.fn() }
    this.visible = true
    this.destroy = mock.fn()
  }
}

const MockPIXI = {
  Sprite: MockSprite,
  Texture: { WHITE: { id: 'white' } },
  Container: class {}
}

mock.module('pixi.js', {
  defaultExport: MockPIXI,
  namedExports: MockPIXI
})

const { EffectSpritePool } =
  await import('../../src/components/stage/EffectSpritePool.ts')

const makeContainer = () => ({ removeChild: mock.fn() })

describe('EffectSpritePool', () => {
  let pool

  beforeEach(() => {
    pool = new EffectSpritePool()
  })

  test('getSprite creates a centered effect sprite when the pool is empty', () => {
    const texture = { id: 'blood' }
    const sprite = pool.getSprite(texture)

    assert.ok(sprite instanceof MockSprite)
    assert.equal(sprite.texture, texture)
    assert.equal(sprite.isSprite, true)
    assert.equal(sprite.life, 1)
    assert.deepEqual(sprite.anchor.set.mock.calls[0].arguments, [0.5])
  })

  test('getSprite falls back to the white texture for null', () => {
    assert.equal(pool.getSprite(null).texture, MockPIXI.Texture.WHITE)
  })

  test('getSprite reuses a pooled sprite, retextures it and keeps its life', () => {
    const sprite = pool.getSprite({ id: 'a' })
    sprite.life = 0.25
    pool.releaseSprite(sprite)
    assert.equal(pool.spritePool.length, 1)

    const next = { id: 'b' }
    const reused = pool.getSprite(next)

    assert.equal(reused, sprite)
    assert.equal(pool.spritePool.length, 0)
    assert.equal(reused.texture, next)
    assert.equal(reused.life, 0.25)
    assert.equal(reused.anchor.set.mock.calls.length, 2)
  })

  test('getSprite uses the white texture when reusing with null', () => {
    const sprite = pool.getSprite({ id: 'a' })
    pool.releaseSprite(sprite)
    assert.equal(pool.getSprite(null).texture, MockPIXI.Texture.WHITE)
  })

  test('releaseSprite ignores null', () => {
    const container = makeContainer()
    pool.setContainer(container)
    pool.releaseSprite(null)
    assert.equal(container.removeChild.mock.calls.length, 0)
    assert.equal(pool.spritePool.length, 0)
  })

  test('releaseSprite detaches, hides and pools managed sprites', () => {
    const container = makeContainer()
    pool.setContainer(container)
    const sprite = pool.getSprite({ id: 'a' })

    pool.releaseSprite(sprite)

    assert.deepEqual(container.removeChild.mock.calls[0].arguments, [sprite])
    assert.equal(sprite.visible, false)
    assert.deepEqual(pool.spritePool, [sprite])
    assert.equal(sprite.destroy.mock.calls.length, 0)
  })

  test('releaseSprite works without a container', () => {
    const sprite = pool.getSprite({ id: 'a' })
    pool.releaseSprite(sprite)
    assert.deepEqual(pool.spritePool, [sprite])
  })

  test('releaseSprite destroys sprites it does not manage', () => {
    const container = makeContainer()
    pool.setContainer(container)
    const foreign = new MockSprite({ id: 'x' })
    foreign.isSprite = false

    pool.releaseSprite(foreign)

    assert.deepEqual(container.removeChild.mock.calls[0].arguments, [foreign])
    assert.equal(foreign.visible, false)
    assert.equal(foreign.destroy.mock.calls.length, 1)
    assert.deepEqual(foreign.destroy.mock.calls[0].arguments, [])
    assert.equal(pool.spritePool.length, 0)
  })

  test('releaseSprite destroys managed sprites past the size cap without touching shared textures', () => {
    const texture = { id: 'shared', destroy: mock.fn() }
    const cap = pool.maxPoolSize
    const sprites = Array.from({ length: cap + 1 }, () =>
      pool.getSprite(texture)
    )

    sprites.forEach(sprite => pool.releaseSprite(sprite))

    assert.equal(pool.spritePool.length, cap)
    assert.equal(sprites[cap].destroy.mock.calls.length, 1)
    assert.deepEqual(sprites[cap].destroy.mock.calls[0].arguments, [
      { children: true, texture: false, textureSource: false }
    ])
    for (const sprite of sprites.slice(0, cap)) {
      assert.equal(sprite.destroy.mock.calls.length, 0)
    }
    assert.equal(texture.destroy.mock.calls.length, 0)
  })

  test('dispose destroys pooled sprites, clears the pool and drops the container', () => {
    const texture = { id: 'shared', destroy: mock.fn() }
    pool.setContainer(makeContainer())
    const a = pool.getSprite(texture)
    const b = pool.getSprite(texture)
    pool.releaseSprite(a)
    pool.releaseSprite(b)

    pool.dispose()

    assert.equal(a.destroy.mock.calls.length, 1)
    assert.equal(b.destroy.mock.calls.length, 1)
    assert.equal(pool.spritePool.length, 0)
    assert.equal(pool.container, null)
    assert.equal(texture.destroy.mock.calls.length, 0)
  })
})
