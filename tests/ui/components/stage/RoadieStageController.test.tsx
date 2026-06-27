import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRoadieStageController } from '../../../../src/components/stage/RoadieStageController'
import * as stageRenderUtils from '../../../../src/components/stage/stageRenderUtils'
import * as errorHandler from '../../../../src/utils/errorHandler'
import { Container } from 'pixi.js'

vi.mock('../../../../src/components/stage/stageRenderUtils', () => ({
  loadTextures: vi.fn(),
  getPixiColorFromToken: vi.fn().mockReturnValue(0xffffff)
}))

vi.mock('../../../../src/utils/errorHandler', () => ({
  handleError: vi.fn(),
  GameError: class extends Error {
    context: any;
    constructor(message: string, options: any) {
      super(message)
      this.context = options?.context;
    }
  }
}))

vi.mock('../../../../src/utils/imageGen', () => ({
  getGenImageUrl: vi.fn(),
  isImageGenerationAvailable: vi.fn().mockReturnValue(true),
  IMG_PROMPTS: {}
}))

describe('RoadieStageController', () => {
  let container: Container

  beforeEach(() => {
    container = new Container()
    vi.clearAllMocks()
  })

  it('should handle asset load failures gracefully', async () => {
    const error = new Error('Network failure')
    vi.mocked(stageRenderUtils.loadTextures).mockRejectedValueOnce(error)

    const controller = createRoadieStageController(container)
    await controller.loadAssets()

    expect(errorHandler.handleError).toHaveBeenCalled()
    const errorArg = vi.mocked(errorHandler.handleError).mock.calls[0][0]
    expect(errorArg.message).toBe('Asset load failed')
    expect(errorArg.context.originalError).toBe(error)
  })
})
