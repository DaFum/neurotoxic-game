import { describe, expect, test, vi } from 'vitest'
import { createRoadieStageController } from '../../src/components/stage/RoadieStageController'

// Mock utils
vi.mock('../../src/components/stage/utils', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    loadTextures: vi.fn(async urlMap => {
      // Simulate one concurrent 100ms request wave
      await new Promise(resolve => setTimeout(resolve, 100))
      const textures = {}
      for (const key of Object.keys(urlMap)) {
        textures[key] = { width: 100, height: 100, destroy: vi.fn() }
      }
      return textures
    }),
    getPixiColorFromToken: vi.fn(() => 0x000000)
  }
})

describe('RoadieStageController loadAssets performance', () => {
  test('setup performance', async () => {
    // Need to mock container carefully
    const mockContainer = {
      addChild: vi.fn(),
      addChildAt: vi.fn(),
      removeChild: vi.fn()
    }
    const mockApp = { screen: { width: 800, height: 600 } }

    const controller = createRoadieStageController({
      app: mockApp,
      container: mockContainer,
      gameStateRef: { current: {} }
    })

    // Explicitly set these for the BaseStageController assignments
    controller.app = mockApp
    controller.container = mockContainer

    // Disable background drawing for the test to focus on loadAssets
    controller.drawBackground = vi.fn()

    const start = performance.now()
    await controller.setup()
    const end = performance.now()

    const duration = end - start
    console.log(`[Perf] controller.setup() took ${duration.toFixed(2)}ms`)

    // With sequential awaits, it takes > 200ms
    // With concurrent awaits, it takes ~ 100ms
    expect(duration).toBeLessThan(200)

    // Cleanup
    controller.dispose()
  })
})
