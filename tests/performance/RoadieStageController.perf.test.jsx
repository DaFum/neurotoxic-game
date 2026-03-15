import { describe, test, vi, expect } from 'vitest'
import { createRoadieStageController } from '../../src/components/stage/RoadieStageController'

// Mock utils
vi.mock('../../src/components/stage/utils.js', () => ({
  loadTexture: vi.fn(async (url) => {
    // Simulate a 100ms network request
    await new Promise(resolve => setTimeout(resolve, 100))
    return { width: 100, height: 100 }
  }),
  getPixiColorFromToken: vi.fn(() => 0x000000)
}))

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
    controller.app = mockApp;
    controller.container = mockContainer;

    // Disable background drawing for the test to focus on loadAssets
    controller.drawBackground = vi.fn()

    const start = performance.now()
    await controller.setup()
    const end = performance.now()

    const duration = end - start
    console.log(`[Perf] controller.setup() took ${duration.toFixed(2)}ms`)

    // With sequential awaits, it takes > 200ms
    // With concurrent awaits, it takes ~ 100ms

    // Cleanup
    controller.dispose()
  })
})
