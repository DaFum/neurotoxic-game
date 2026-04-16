import test from 'node:test'
import assert from 'node:assert/strict'
import * as PIXI from 'pixi.js'

import {
  getPixiColorFromToken,
  calculateNoteY,
  calculateCrowdOffset,
  buildRhythmLayout,
  loadTexture,
  getOptimalResolution
} from '../../src/components/stage/utils.js'
import { setupJSDOM, teardownJSDOM } from '../testUtils.js'

test('stage utils', async t => {
  await t.test('calculateNoteY', () => {
    assert.equal(calculateNoteY(0, 1000, 500, 100), 400)
    assert.equal(calculateNoteY(500, 1000, 500, 100), 450)
    assert.equal(calculateNoteY(1000, 1000, 500, 100), 500)
    assert.equal(calculateNoteY(1500, 1000, 500, 100), 550)

    // Test behavior when note has passed (elapsed > noteTime)
    assert.equal(calculateNoteY(1200, 1000, 500, 100), 520)
  })

  await t.test('calculateCrowdOffset', () => {
    const offset1 = calculateCrowdOffset({ combo: 5, timeMs: 100 })
    assert.ok(offset1 >= 0 && offset1 <= 5)
    const offset2 = calculateCrowdOffset({ combo: 15, timeMs: 100 })
    assert.ok(offset2 >= 0 && offset2 <= 5)
  })

  await t.test('buildRhythmLayout', () => {
    const layout = buildRhythmLayout({ screenWidth: 1000, screenHeight: 800 })
    assert.equal(layout.startX, 320)
    assert.equal(layout.laneTotalWidth, 360)
    assert.equal(layout.laneWidth, 100)
    assert.equal(layout.laneHeight, 800 * 0.4)
    assert.equal(layout.laneStrokeWidth, 2)
    assert.equal(layout.hitLineY, 320 - 60)
    assert.equal(layout.hitLineHeight, 20)
    assert.equal(layout.hitLineStrokeWidth, 4)
    assert.equal(layout.rhythmOffsetY, 800 * 0.6)
  })

  await t.test('getOptimalResolution', () => {
    const originalWindow = globalThis.window

    // No window
    globalThis.window = undefined
    assert.equal(getOptimalResolution(), 1)

    // Window with dpr = 1
    globalThis.window = { devicePixelRatio: 1 }
    assert.equal(getOptimalResolution(), 1)

    // Window with dpr = 1.5
    globalThis.window = { devicePixelRatio: 1.5 }
    assert.equal(getOptimalResolution(), 1.5)

    // Window with dpr = 3, capped at 2
    globalThis.window = { devicePixelRatio: 3 }
    assert.equal(getOptimalResolution(), 2)

    globalThis.window = originalWindow
  })

  await t.test('getPixiColorFromToken', async sub => {
    // Tests when JSDOM isn't present
    await sub.test('fallback when no DOM', () => {
      // Mock missing window
      const originalWindow = globalThis.window
      globalThis.window = undefined

      assert.equal(getPixiColorFromToken('--void-black'), 0x0a0a0a)
      assert.equal(getPixiColorFromToken('--toxic-green'), 0x00ff41)
      assert.equal(getPixiColorFromToken('--star-white'), 0xffffff)
      assert.equal(getPixiColorFromToken('--unknown-token'), 0xffffff)

      globalThis.window = originalWindow
    })

    // Tests with DOM
    await sub.test('uses DOM when present', () => {
      setupJSDOM()

      const originalGetComputedStyle = globalThis.window.getComputedStyle

      globalThis.window.getComputedStyle = () => ({
        getPropertyValue: prop => {
          if (prop === '--color-my-red') return '#ff0000'
          if (prop === '--color-my-blue') return '#0000ff'
          return ''
        }
      })

      assert.equal(getPixiColorFromToken('--my-red'), 0xff0000)
      assert.equal(getPixiColorFromToken('--my-blue'), 0x0000ff)

      globalThis.window.getComputedStyle = originalGetComputedStyle

      teardownJSDOM()
    })

    await sub.test('caches colors with DOM', () => {
      setupJSDOM()
      let callCount = 0

      const originalGetComputedStyle = globalThis.window.getComputedStyle

      globalThis.window.getComputedStyle = () => {
        callCount++
        return {
          getPropertyValue: _prop => '#123456'
        }
      }

      // First call computes and caches
      assert.equal(getPixiColorFromToken('--cached-color'), 0x123456)
      assert.equal(callCount, 1)

      // Second call uses cache
      assert.equal(getPixiColorFromToken('--cached-color'), 0x123456)
      assert.equal(callCount, 1)

      globalThis.window.getComputedStyle = originalGetComputedStyle

      teardownJSDOM()
    })
  })

  await t.test('loadTexture', async sub => {
    await sub.test(
      'handles non-extension URLs with image fallback',
      async () => {
        const OriginalImage = globalThis.Image

        let createdImage = null
        globalThis.Image = class {
          constructor() {
            this.crossOrigin = ''
            this.src = ''
            createdImage = this
            setTimeout(() => {
              if (this.onload) this.onload()
            }, 0)
          }
        }

        // To avoid mocking PIXI directly (since it fails under ESM with read-only exported properties),
        // we'll rely on the real PIXI.ImageSource and PIXI.Texture. Since we override globalThis.Image,
        // it should be able to create a real PIXI ImageSource with our mock image!

        const texture = await loadTexture('https://example.com/api/image')

        assert.ok(texture)
        assert.ok(createdImage)
        assert.equal(createdImage.src, 'https://example.com/api/image')

        // Second call hits our internal fallback cache since it's the exact same URL
        const texture2 = await loadTexture('https://example.com/api/image')
        assert.equal(texture2, texture)

        globalThis.Image = OriginalImage
      }
    )

    await sub.test('handles non-extension URL image load error', async () => {
      const OriginalImage = globalThis.Image

      globalThis.Image = class {
        constructor() {
          setTimeout(() => {
            if (this.onerror) this.onerror()
          }, 0)
        }
      }

      const texture = await loadTexture('https://example.com/api/error')

      // Should resolve to null on error
      assert.equal(texture, null)

      globalThis.Image = OriginalImage
    })

    await sub.test(
      'handles PIXI.Assets.load for URLs with extensions',
      async () => {
        const mockAssetsLoad = t.mock.method(PIXI.Assets, 'load', async url => {
          return { isPixiTexture: true, url }
        })

        const texture = await loadTexture('https://example.com/image.png')

        assert.equal(mockAssetsLoad.mock.calls.length, 1)
        assert.ok(texture.isPixiTexture)
        assert.equal(texture.url, 'https://example.com/image.png')

        mockAssetsLoad.mock.restore()
      }
    )

    await sub.test(
      'handles PIXI.Assets.load error by falling back to Image',
      async () => {
        const mockAssetsLoad = t.mock.method(PIXI.Assets, 'load', async () => {
          throw new Error('Assets load failed')
        })

        const OriginalImage = globalThis.Image

        let createdImage = null
        globalThis.Image = class {
          constructor() {
            createdImage = this
            setTimeout(() => {
              if (this.onload) this.onload()
            }, 0)
          }
        }

        const texture = await loadTexture(
          'https://example.com/image_error_fallback.png'
        )

        assert.equal(mockAssetsLoad.mock.calls.length, 1)
        assert.ok(texture)
        assert.ok(createdImage)
        assert.equal(
          createdImage.src,
          'https://example.com/image_error_fallback.png'
        )

        mockAssetsLoad.mock.restore()
        globalThis.Image = OriginalImage
      }
    )
  })
})
