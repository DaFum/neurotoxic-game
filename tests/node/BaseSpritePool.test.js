import { test, mock, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

const MockPIXI = {
  Sprite: class {},
  Container: class {}
}

mock.module('pixi.js', {
  defaultExport: MockPIXI,
  namedExports: MockPIXI
})

const { BaseSpritePool } =
  await import('../../src/components/stage/pool/BaseSpritePool.ts')

class TestPool extends BaseSpritePool {
  maxPoolSize = 2
}

const makeSprite = () => ({ visible: true, destroy: mock.fn() })

describe('BaseSpritePool', () => {
  let pool

  beforeEach(() => {
    pool = new TestPool()
  })

  test('starts empty with the constructor container', () => {
    const container = new MockPIXI.Container()
    assert.equal(pool.container, null)
    assert.deepEqual(pool.spritePool, [])
    assert.equal(new TestPool(container).container, container)
  })

  test('setContainer replaces the container', () => {
    const container = new MockPIXI.Container()
    pool.setContainer(container)
    assert.equal(pool.container, container)
  })

  test('releaseSpriteToPool hides and keeps sprites up to the cap', () => {
    const [a, b] = [makeSprite(), makeSprite()]
    pool.releaseSpriteToPool(a)
    pool.releaseSpriteToPool(b)

    assert.deepEqual(pool.spritePool, [a, b])
    assert.equal(a.visible, false)
    assert.equal(b.visible, false)
    assert.equal(a.destroy.mock.calls.length, 0)
    assert.equal(b.destroy.mock.calls.length, 0)
  })

  test('releaseSpriteToPool destroys overflow sprites and spares shared textures', () => {
    const [a, b, c] = [makeSprite(), makeSprite(), makeSprite()]
    pool.releaseSpriteToPool(a)
    pool.releaseSpriteToPool(b)
    pool.releaseSpriteToPool(c)

    assert.deepEqual(pool.spritePool, [a, b])
    assert.equal(c.visible, false)
    assert.equal(c.destroy.mock.calls.length, 1)
    assert.deepEqual(c.destroy.mock.calls[0].arguments, [
      { children: true, texture: false, textureSource: false }
    ])
  })

  test('dispose destroys pooled sprites and clears state', () => {
    const [a, b] = [makeSprite(), makeSprite()]
    pool.setContainer(new MockPIXI.Container())
    pool.releaseSpriteToPool(a)
    pool.releaseSpriteToPool(b)

    pool.dispose()

    assert.equal(a.destroy.mock.calls.length, 1)
    assert.equal(b.destroy.mock.calls.length, 1)
    assert.deepEqual(pool.spritePool, [])
    assert.equal(pool.container, null)
  })
})
