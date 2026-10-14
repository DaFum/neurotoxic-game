import { test, mock } from 'node:test'
import assert from 'node:assert/strict'

class MockFilter {
  constructor(options) {
    this.resources = options?.resources
  }

  destroy() {}
}

class MockColorMatrixFilter extends MockFilter {
  hue() {}
  contrast() {}
  brightness() {}
}

mock.module('pixi.js', {
  namedExports: {
    ColorMatrixFilter: MockColorMatrixFilter,
    Container: class {},
    Filter: MockFilter,
    GlProgram: { from: mock.fn(() => ({})) }
  }
})

test('ToxicFilterManager', async t => {
  const { ToxicFilterManager } =
    await import('../../../../src/components/stage/ToxicFilterManager.ts')

  await t.test('updates the glitch shader from active gig time', () => {
    const manager = new ToxicFilterManager()
    const update = mock.fn()
    manager.brutalistFilter.update = update

    manager.update({ isToxicMode: true, combo: 0 }, 2345, {})

    assert.equal(update.mock.calls.length, 1)
    assert.deepEqual(update.mock.calls[0].arguments, [2345, 1])
  })
})
