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
    buildRhythmLayout: mockBuildRhythmLayout,
    getPixiColorFromToken: mock.fn(tokenName => {
      if (tokenName === '--void-black') return 0x0a0a0a
      if (tokenName === '--toxic-green') return 0x00ff41
      if (tokenName === '--star-white') return 0xffffff
      return 0xffffff
    })
  }
})

const graphicsInstances = []

class MockGraphics {
  constructor() {
    this.rect = mock.fn()
    this.fill = mock.fn()
    this.stroke = mock.fn()
    this.clear = mock.fn()
    this.__laneIndex = -1
    this.__layer = 'unknown'
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

const getLaneGraphics = ({ laneIndex, layer }) =>
  graphicsInstances.find(
    graphics => graphics.__laneIndex === laneIndex && graphics.__layer === layer
  )

describe('LaneManager', () => {
  let LaneManager
  let HIT_BAR_INACTIVE_ALPHA
  let HIT_BAR_ACTIVE_ALPHA
  let HIT_BAR_BORDER_COLOR
  let app
  let stageContainer
  let gameStateRef
  let laneManager

  beforeEach(async () => {
    graphicsInstances.length = 0
    mockBuildRhythmLayout.mock.resetCalls()

    ;({
      LaneManager,
      HIT_BAR_INACTIVE_ALPHA,
      HIT_BAR_ACTIVE_ALPHA,
      HIT_BAR_BORDER_COLOR
    } = await import('../src/components/stage/LaneManager.js'))

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

    const firstLaneDynamicGraphics = getLaneGraphics({
      laneIndex: 0,
      layer: 'dynamic'
    })
    const fillCalls = firstLaneDynamicGraphics.fill.mock.calls

    assert.equal(fillCalls.length, 1)
    assert.deepEqual(fillCalls[0].arguments[0], {
      color: 0xff0000,
      alpha: HIT_BAR_INACTIVE_ALPHA
    })
  })

  test('draws static lane guide strip for readability', () => {
    const firstLaneStaticGraphics = getLaneGraphics({
      laneIndex: 0,
      layer: 'static'
    })
    const fillCalls = firstLaneStaticGraphics.fill.mock.calls

    assert.deepEqual(fillCalls[1].arguments[0], {
      color: 0xff0000,
      alpha: 0.16
    })
  })

  test('draws active hit bars with stronger fill and white border', () => {
    gameStateRef.current.lanes[0].active = true

    laneManager.update(gameStateRef.current)

    const firstLaneDynamicGraphics = getLaneGraphics({
      laneIndex: 0,
      layer: 'dynamic'
    })
    const fillCalls = firstLaneDynamicGraphics.fill.mock.calls
    const strokeCalls = firstLaneDynamicGraphics.stroke.mock.calls

    assert.deepEqual(fillCalls[0].arguments[0], {
      color: 0xff0000,
      alpha: HIT_BAR_ACTIVE_ALPHA
    })
    assert.deepEqual(strokeCalls[0].arguments[0], {
      width: 4,
      color: HIT_BAR_BORDER_COLOR
    })
  })

  test('does not redraw static lanes on first update frame', () => {
    laneManager.update(gameStateRef.current)

    const firstLaneStaticGraphics = getLaneGraphics({
      laneIndex: 0,
      layer: 'static'
    })

    assert.equal(firstLaneStaticGraphics.clear.mock.calls.length, 0)
  })
})
