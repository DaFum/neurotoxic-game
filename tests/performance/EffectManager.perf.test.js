import { test, describe, before, after, mock } from 'node:test'
import assert from 'node:assert'
import { setupJSDOM, teardownJSDOM } from '../testUtils.js'

// Mock PIXI
const PIXI = {
  Container: class {
    constructor() { this.children = []; }
    addChild(c) { this.children.push(c); }
    removeChild(c) {
      const idx = this.children.indexOf(c);
      if (idx !== -1) this.children.splice(idx, 1);
    }
    destroy() {}
  },
  Sprite: class {
    constructor() {
      this.anchor = { set: () => {} };
      this.scale = { set: () => {} };
      this.destroy = () => {};
      this.life = 1.0;
    }
  },
  Graphics: class {
    circle() {}
    fill() {}
    stroke() {}
    destroy() {}
  },
  Texture: { WHITE: {} }
};

mock.module('pixi.js', { defaultExport: PIXI, namedExports: PIXI })

// Mock other utils
mock.module('../../src/utils/imageGen.js', { namedExports: { getGenImageUrl: () => '', IMG_PROMPTS: {} } })
mock.module('../../src/utils/logger.js', { namedExports: { logger: { warn: () => {} } } })
mock.module('../../src/components/stage/utils.js', { namedExports: { loadTexture: async () => ({}), getPixiColorFromToken: () => 0 } })

describe('EffectManager Performance', () => {
  let EffectManager

  before(async () => {
    setupJSDOM()
    const module = await import('../../src/components/stage/EffectManager.js')
    EffectManager = module.EffectManager
  })

  after(() => {
    teardownJSDOM()
  })

  test('removal performance', () => {
    const app = { renderer: { generateTexture: () => ({ destroy: () => {} }) } }
    const parent = new PIXI.Container()
    const manager = new EffectManager(app, parent)
    manager.init()

    // Fill with effects
    for (let i = 0; i < 50; i++) {
        manager.spawnHitEffect(0, 0, 0xFFFFFF)
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
             manager.spawnHitEffect(0, 0, 0xFFFFFF)
             // Newly spawned effects have life 1.0
        }
    }
    const end = performance.now()
    console.log(`[Perf] 100k frames took: ${(end - start).toFixed(2)}ms`)
  })
})
