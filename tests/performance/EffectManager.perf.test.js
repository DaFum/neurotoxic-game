import { test, describe, beforeAll, afterAll, vi } from 'vitest'
import { setupJSDOM, teardownJSDOM } from '../testUtils.js'

// Mock PIXI
const PIXI = {
  Container: class {
    constructor() {
      this.children = []
    }
    addChild(c) {
      this.children.push(c)
    }
    removeChild(c) {
      const idx = this.children.indexOf(c)
      if (idx !== -1) this.children.splice(idx, 1)
    }
    destroy() {}
  },
  Sprite: class {
    constructor() {
      this.anchor = { set: () => {} }
      this.scale = { set: () => {} }
      this.destroy = () => {}
      this.life = 1.0
    }
  },
  Graphics: class {
    circle() {}
    fill() {}
    stroke() {}
    destroy() {}
  },
  Texture: { WHITE: {} }
}

vi.mock('pixi.js', () => {
  return {
    ...PIXI,
    default: PIXI
  }
})

// Mock other utils
vi.mock('../../src/utils/imageGen.js', () => ({
  getGenImageUrl: () => '',
  IMG_PROMPTS: {}
}))
vi.mock('../../src/utils/logger.js', () => ({
  logger: { warn: () => {} }
}))
vi.mock('../../src/components/stage/utils.js', () => ({
  loadTexture: async () => ({}),
  loadTextures: async () => ({}),
  getPixiColorFromToken: () => 0
}))

describe('EffectManager Performance', () => {
  let EffectManager

  beforeAll(async () => {
    setupJSDOM()
    const module = await import('../../src/components/stage/EffectManager.js')
    EffectManager = module.EffectManager
  })

  afterAll(() => {
    teardownJSDOM()
  })

  test('removal performance', () => {
    const app = { renderer: { generateTexture: () => ({ destroy: () => {} }) } }
    const parent = new PIXI.Container()
    const manager = new EffectManager(app, parent)
    manager.init()

    // Fill with effects
    for (let i = 0; i < 50; i++) {
      manager.spawnHitEffect(0, 0, 0xffffff)
      // Stagger life so they don't all die at once
      manager.activeEffects[i].life = 0.02 * (i + 1) // 0.02 to 1.0
    }

    const start = performance.now()
    const iterations = 100000
    // Simulate many frames
    for (let i = 0; i < iterations; i++) {
      manager.update(16) // 16ms
      // Replenish if needed to maintain load
      while (manager.activeEffects.length < 50) {
        manager.spawnHitEffect(0, 0, 0xffffff)
        // Newly spawned effects have life 1.0
      }
    }
    const end = performance.now()
    console.log(`[Perf] 100k frames took: ${(end - start).toFixed(2)}ms`)
  })
})
