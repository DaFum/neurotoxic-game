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
    this.visible = true // Default PIXI behavior
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
  let app
  let stageContainer
  let gameStateRef
  let laneManager

  const HIT_BAR_INACTIVE_ALPHA = 0.45
  const HIT_BAR_ACTIVE_ALPHA = 0.95
  const HIT_BAR_BORDER_COLOR = 0xffffff

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
    // Note: Graphics are drawn in init() now
    const inactiveGraphics = getLaneGraphics({
      laneIndex: 0,
      layer: 'inactive'
    })
    const fillCalls = inactiveGraphics.fill.mock.calls

    assert.equal(fillCalls.length, 1, 'Should have drawn inactive graphics in init')
    assert.deepEqual(fillCalls[0].arguments[0], {
      color: 0xff0000,
      alpha: HIT_BAR_INACTIVE_ALPHA
    })

    // Check visibility
    assert.equal(inactiveGraphics.visible, true, 'Inactive graphics should be visible by default')
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

  test('activates hit bars with stronger fill and white border', () => {
    // Verify active graphics are drawn but hidden initially
    const activeGraphics = getLaneGraphics({
      laneIndex: 0,
      layer: 'active'
    })
    const inactiveGraphics = getLaneGraphics({
      laneIndex: 0,
      layer: 'inactive'
    })

    assert.equal(activeGraphics.visible, false, 'Active graphics should be hidden initially')
    assert.equal(inactiveGraphics.visible, true, 'Inactive graphics should be visible initially')

    // Simulate key press
    gameStateRef.current.lanes[0].active = true

    laneManager.update(gameStateRef.current)

    // Verify visibility toggle
    assert.equal(activeGraphics.visible, true, 'Active graphics should be visible after update')
    assert.equal(inactiveGraphics.visible, false, 'Inactive graphics should be hidden after update')

    // Verify active graphics drawing parameters (from init)
    const fillCalls = activeGraphics.fill.mock.calls
    const strokeCalls = activeGraphics.stroke.mock.calls

    assert.equal(fillCalls.length, 1, 'Should have drawn active graphics in init')
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
