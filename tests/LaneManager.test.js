import { test, describe, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

const mockBuildRhythmLayout = mock.fn(() => ({
  startX: 100,
  laneWidth: 100,
  laneHeight: 300,
  laneStrokeWidth: 2,
  hitLineY: 240,
  hitLineHeight: 20,
  hitLineStrokeWidth: 4,
  rhythmOffsetY: 360
}))

mock.module('../src/components/stage/utils.js', {
  namedExports: {
    buildRhythmLayout: mockBuildRhythmLayout
  }
})

const graphicsInstances = []

class MockGraphics {
  constructor() {
    this.rect = mock.fn()
    this.fill = mock.fn()
    this.stroke = mock.fn()
    this.clear = mock.fn()
    graphicsInstances.push(this)
  }
}

class MockContainer {
  constructor() {
    this.y = 0
    this.children = []
    this.addChild = mock.fn(child => {
      this.children.push(child)
    })
    this.destroy = mock.fn()
  }
}

mock.module('pixi.js', {
  namedExports: {
    Graphics: MockGraphics,
    Container: MockContainer
  }
})

describe('LaneManager', () => {
  let LaneManager
  let app
  let stageContainer
  let gameStateRef
  let laneManager

  beforeEach(async () => {
    graphicsInstances.length = 0
    mockBuildRhythmLayout.mock.resetCalls()

    ;({ LaneManager } = await import('../src/components/stage/LaneManager.js'))

    app = {
      screen: {
        width: 1280,
        height: 720
      }
    }
    stageContainer = new MockContainer()
    gameStateRef = {
      current: {
        lanes: [
          { color: 0xff0000, active: false },
          { color: 0x00ff00, active: false },
          { color: 0x0000ff, active: false }
        ]
      }
    }

    laneManager = new LaneManager(app, stageContainer, gameStateRef)
    laneManager.init()
  })

  test('draws inactive hit bars with translucent lane color fill', () => {
    laneManager.update(gameStateRef.current)

    const firstLaneDynamicGraphics = graphicsInstances[1]
    const fillCalls = firstLaneDynamicGraphics.fill.mock.calls

    assert.equal(fillCalls.length, 1)
    assert.deepEqual(fillCalls[0].arguments[0], {
      color: 0xff0000,
      alpha: 0.45
    })
  })


  test('draws static lane guide strip for readability', () => {
    const firstLaneStaticGraphics = graphicsInstances[0]
    const fillCalls = firstLaneStaticGraphics.fill.mock.calls

    assert.deepEqual(fillCalls[1].arguments[0], {
      color: 0xff0000,
      alpha: 0.16
    })
  })

  test('draws active hit bars with stronger fill and white border', () => {
    gameStateRef.current.lanes[0].active = true

    laneManager.update(gameStateRef.current)

    const firstLaneDynamicGraphics = graphicsInstances[1]
    const fillCalls = firstLaneDynamicGraphics.fill.mock.calls
    const strokeCalls = firstLaneDynamicGraphics.stroke.mock.calls

    assert.deepEqual(fillCalls[0].arguments[0], {
      color: 0xff0000,
      alpha: 0.95
    })
    assert.deepEqual(strokeCalls[0].arguments[0], {
      width: 4,
      color: 0xffffff
    })
  })
})
