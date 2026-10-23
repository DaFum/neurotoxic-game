import { describe, expect, it, vi } from 'vitest'
import { BaseStageController } from '../../src/components/stage/BaseStageController'

const createController = () => {
  const order = []
  const updateRef = { current: vi.fn(dt => order.push(['logic', dt])) }
  const controller = new BaseStageController({
    containerRef: { current: null },
    gameStateRef: { current: {} },
    updateRef
  })
  controller.update = vi.fn(dt => order.push(['render', dt]))
  return { controller, updateRef, order }
}

describe('manual stage frames', () => {
  it('runs automatic frames as usual until manual mode is enabled', () => {
    const { controller, order } = createController()

    controller.handleTicker({ deltaMS: 16 })

    expect(order).toEqual([
      ['logic', 16],
      ['render', 16]
    ])
  })

  it('ignores automatic frames once manual mode is on', () => {
    const { controller, updateRef } = createController()
    controller.enableManualFrames()

    controller.handleTicker({ deltaMS: 16 })
    controller.handleTicker({ deltaMS: 16 })

    expect(updateRef.current).not.toHaveBeenCalled()
    expect(controller.update).not.toHaveBeenCalled()
  })

  it('steps a frame through the ticker path: logic before render', () => {
    const { controller, order } = createController()
    controller.enableManualFrames()

    controller.stepFrame(12.5)

    expect(order).toEqual([
      ['logic', 12.5],
      ['render', 12.5]
    ])
  })

  it('returns to ignoring automatic frames after a manual step', () => {
    const { controller, updateRef } = createController()
    controller.enableManualFrames()

    controller.stepFrame(10)
    controller.handleTicker({ deltaMS: 16 })

    expect(updateRef.current).toHaveBeenCalledTimes(1)
  })

  it('does not step a disposed controller', () => {
    const { controller, updateRef } = createController()
    controller.enableManualFrames()
    controller.isDisposed = true

    controller.stepFrame(10)

    expect(updateRef.current).not.toHaveBeenCalled()
  })
})
