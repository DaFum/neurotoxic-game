import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  add: vi.fn(),
  remove: vi.fn(),
  destroy: vi.fn(),
  appendChild: vi.fn(),
  stageAddChild: vi.fn(),
  disconnect: vi.fn(),
  observe: vi.fn(),
  init: vi.fn(),
  error: vi.fn(),
  warn: vi.fn()
}))

vi.mock('pixi.js', () => {
  class MockApplication {
    constructor() {
      this.canvas = { id: 'canvas' }
      this.stage = { addChild: mocks.stageAddChild }
      this.ticker = { add: mocks.add, remove: mocks.remove }
      this.init = mocks.init
      this.destroy = mocks.destroy
    }
  }

  class MockContainer {}

  return {
    Application: MockApplication,
    Container: MockContainer
  }
})

vi.mock('../../src/utils/logger', () => ({
  logger: { error: mocks.error, warn: mocks.warn }
}))

vi.mock('../../src/components/stage/utils', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    getOptimalResolution: () => 2
  }
})

import { BaseStageController } from '../../src/components/stage/BaseStageController'

class TestController extends BaseStageController {
  async setup() {
    this.setupRan = true
  }

  draw() {
    this.drawRan = (this.drawRan || 0) + 1
  }
}

class RetrySetupController extends BaseStageController {
  constructor(params) {
    super(params)
    this.setupAttempts = 0
  }

  async setup() {
    this.setupAttempts += 1
    if (this.setupAttempts === 1) {
      throw new Error('setup failed once')
    }
    this.setupRan = true
  }
}

class DisposeAwareController extends BaseStageController {
  async setup() {
    throw new Error('setup boom')
  }

  dispose() {
    this.subclassDisposeCalls = (this.subclassDisposeCalls || 0) + 1
    super.dispose()
  }
}

describe('BaseStageController', () => {
  let containerRef
  let controller

  beforeEach(() => {
    vi.clearAllMocks()
    containerRef = { current: { appendChild: mocks.appendChild } }
    global.ResizeObserver = class {
      observe = mocks.observe
      disconnect = mocks.disconnect
    }
    controller = new TestController({
      containerRef,
      gameStateRef: { current: {} },
      updateRef: { current: vi.fn() }
    })
    mocks.init.mockResolvedValue(undefined)
  })

  afterEach(() => {
    delete global.ResizeObserver
  })

  it('initializes app and stage container on success', async () => {
    await controller.init()

    expect(controller.app).toBeTruthy()
    expect(controller.container).toBeTruthy()
    expect(controller.setupRan).toBe(true)
    expect(mocks.appendChild).toHaveBeenCalled()
    expect(mocks.stageAddChild).toHaveBeenCalled()
    expect(mocks.add).toHaveBeenCalledWith(controller.handleTicker)
  })

  it('handles init failures and disposes safely', async () => {
    mocks.init.mockRejectedValueOnce(new Error('boom'))

    await expect(controller.init()).rejects.toThrow('boom')

    expect(mocks.error).toHaveBeenCalled()
    expect(controller.app).toBe(null)
    expect(controller.isDisposed).toBe(true)
    expect(controller.initPromise).toBe(null)
  })

  it('resets initPromise and allows init retry after setup failure', async () => {
    controller = new RetrySetupController({
      containerRef,
      gameStateRef: { current: {} },
      updateRef: { current: vi.fn() }
    })

    await expect(controller.init()).rejects.toThrow('setup failed once')
    expect(mocks.destroy).toHaveBeenCalledTimes(1)
    expect(mocks.remove).toHaveBeenCalledTimes(1)
    expect(controller.setupAttempts).toBe(1)
    expect(controller.setupRan).toBeUndefined()
    expect(controller.isDisposed).toBe(true)
    expect(controller.initPromise).toBe(null)

    await controller.init()
    expect(controller.setupAttempts).toBe(2)
    expect(controller.setupRan).toBe(true)
    expect(controller.isDisposed).toBe(false)
  })

  it('invokes subclass dispose when setup throws', async () => {
    controller = new DisposeAwareController({
      containerRef,
      gameStateRef: { current: {} },
      updateRef: { current: vi.fn() }
    })

    await expect(controller.init()).rejects.toThrow('setup boom')

    expect(controller.subclassDisposeCalls).toBe(1)
    expect(controller.app).toBe(null)
    expect(controller.isDisposed).toBe(true)
    expect(controller.initPromise).toBe(null)
  })

  it('handleResize draws when app exists and ignores without app', () => {
    controller.handleResize()
    expect(controller.drawRan).toBeUndefined()

    controller.app = {}
    controller.handleResize()
    expect(controller.drawRan).toBe(1)
  })

  it('dispose destroys resources once and is idempotent', async () => {
    await controller.init()

    controller.dispose()
    expect(controller.container).toBe(null)
    expect(mocks.remove).toHaveBeenCalledWith(controller.handleTicker)
    expect(mocks.destroy).toHaveBeenCalledWith(
      { removeView: true },
      { children: true, texture: true, textureSource: true }
    )
    expect(mocks.disconnect).toHaveBeenCalled()

    expect(() => controller.dispose()).not.toThrow()
  })
})
