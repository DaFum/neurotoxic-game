import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  mulberry32,
  createRngStream,
  nextSeed
} from '../../src/utils/seededRng.ts'

describe('mulberry32', () => {
  it('is deterministic per seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    assert.equal(a(), b())
    assert.equal(a(), b())
    assert.equal(a(), b())
  })

  it('different seeds produce different streams', () => {
    const a = mulberry32(1)
    const b = mulberry32(2)
    assert.notEqual(a(), b())
  })

  it('returns values in [0, 1)', () => {
    const rng = mulberry32(123)
    for (let i = 0; i < 100; i++) {
      const v = rng()
      assert.ok(v >= 0 && v < 1, `out of range: ${v}`)
    }
  })
})

describe('createRngStream', () => {
  it('returns N numbers in [0, 1)', () => {
    const stream = createRngStream(123, 5)
    assert.equal(stream.length, 5)
    for (const n of stream) {
      assert.ok(n >= 0 && n < 1, `out of range: ${n}`)
    }
  })

  it('is reproducible across calls', () => {
    const a = createRngStream(7, 10)
    const b = createRngStream(7, 10)
    assert.deepEqual(a, b)
  })

  it('returns empty array for length 0', () => {
    assert.deepEqual(createRngStream(1, 0), [])
  })
})

describe('nextSeed', () => {
  it('is deterministic per input seed', () => {
    assert.equal(nextSeed(42), nextSeed(42))
  })

  it('different seeds produce different next seeds', () => {
    assert.notEqual(nextSeed(1), nextSeed(2))
  })

  it('returns unsigned 32-bit integer seeds', () => {
    for (const seed of [1, 2, 42, 12345, 0xffffffff]) {
      const s = nextSeed(seed)
      assert.equal(Number.isInteger(s), true)
      assert.ok(s >= 0, `seed ${seed} produced negative next seed ${s}`)
      assert.ok(s <= 0xffffffff, `seed ${seed} produced out-of-range ${s}`)
    }
  })
})
