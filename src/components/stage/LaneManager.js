import { Container, Graphics } from 'pixi.js'
import { buildRhythmLayout, getPixiColorFromToken } from './utils.js'

const LANE_GAP = 20
const LANE_BASE_FILL = getPixiColorFromToken('--void-black')
const LANE_BASE_ALPHA = 0.7
const LANE_BORDER_COLOR = getPixiColorFromToken('--toxic-green')
const LANE_BORDER_ALPHA = 0.35
const HIT_BAR_INACTIVE_ALPHA = 0.45
const HIT_BAR_ACTIVE_ALPHA = 0.95
const HIT_BAR_BORDER_COLOR = getPixiColorFromToken('--star-white')
const LANE_GUIDE_ALPHA = 0.16

class LaneRenderer {
  constructor(index) {
    const createGraphicsLayer = (layer, isVisible = true) => {
      const g = new Graphics()
      g.__laneIndex = index
      g.__layer = layer
      g.visible = isVisible
      return g
    }

    this.static = createGraphicsLayer('static')
    this.active = createGraphicsLayer('active', false)
    this.inactive = createGraphicsLayer('inactive')
  }

  addTo(container) {
    container.addChild(this.static)
    container.addChild(this.inactive)
    container.addChild(this.active)
  }

  draw(lane, renderX, layout) {
    this.static.clear()
    this.static.rect(renderX, 0, layout.laneWidth, layout.laneHeight)
    this.static.fill({ color: LANE_BASE_FILL, alpha: LANE_BASE_ALPHA })

    const guideStripWidthRatio = 0.3
    const guideStripXOffset =
      (layout.laneWidth * (1 - guideStripWidthRatio)) / 2
    this.static.rect(
      renderX + guideStripXOffset,
      0,
      layout.laneWidth * guideStripWidthRatio,
      layout.laneHeight
    )
    this.static.fill({ color: lane.color, alpha: LANE_GUIDE_ALPHA })

    this.static.stroke({
      width: layout.laneStrokeWidth,
      color: LANE_BORDER_COLOR,
      alpha: LANE_BORDER_ALPHA
    })

    this.active.clear()
    this.active.rect(
      renderX,
      layout.hitLineY,
      layout.laneWidth,
      layout.hitLineHeight
    )
    this.active.fill({ color: lane.color, alpha: HIT_BAR_ACTIVE_ALPHA })
    this.active.stroke({
      width: layout.hitLineStrokeWidth,
      color: HIT_BAR_BORDER_COLOR
    })

    this.inactive.clear()
    this.inactive.rect(
      renderX,
      layout.hitLineY,
      layout.laneWidth,
      layout.hitLineHeight
    )
    this.inactive.fill({
      color: lane.color,
      alpha: HIT_BAR_INACTIVE_ALPHA
    })
    this.inactive.stroke({
      width: layout.hitLineStrokeWidth,
      color: lane.color
    })
  }

  setVisibility(isActive) {
    this.active.visible = !!isActive
    this.inactive.visible = !isActive
  }
}

export class LaneManager {
  /**
   * @param {Application} app
   * @param {Container} stageContainer
   * @param {object} gameStateRef
   */
  constructor(app, stageContainer, gameStateRef) {
    this.app = app
    this.stageContainer = stageContainer
    this.gameStateRef = gameStateRef
    this.rhythmContainer = null
    this.laneLayout = null
    this.laneGraphics = [] // LaneRenderer[]
    this.lastLaneActive = []
    this.lastScreenWidth = -1
    this.lastScreenHeight = -1
  }

  _initContainerAndLayout() {
    this.rhythmContainer = new Container()
    const width = this.app.screen.width
    const height = this.app.screen.height

    this.laneLayout = buildRhythmLayout({
      screenWidth: width,
      screenHeight: height
    })
    this.lastScreenWidth = width
    this.lastScreenHeight = height

    this.rhythmContainer.y = this.laneLayout.rhythmOffsetY
    this.stageContainer.addChild(this.rhythmContainer)
  }

  init() {
    this._initContainerAndLayout()

    const startX = this.laneLayout.startX
    const laneWidth = this.laneLayout.laneWidth

    const lanes = this.gameStateRef.current.lanes
    for (let index = 0, len = lanes.length; index < len; index++) {
      const lane = lanes[index]
      const laneX = startX + index * (laneWidth + LANE_GAP)
      // Side-effect: Mutating gameState lanes with render position for NoteManager
      lane.renderX = laneX

      this._createLaneGraphics(lane, index, laneX)
    }
  }

  _createLaneGraphics(lane, index, laneX) {
    const renderer = new LaneRenderer(index)

    // Set initial visibility based on lane state and initialize cache
    renderer.setVisibility(lane.active)
    this.lastLaneActive[index] = lane.active

    renderer.addTo(this.rhythmContainer)
    renderer.draw(lane, laneX, this.laneLayout)

    this.laneGraphics[index] = renderer
  }

  update(state) {
    const layoutUpdated = this.updateLaneLayout()
    const layout = this.laneLayout

    for (let index = 0; index < state.lanes.length; index++) {
      const lane = state.lanes[index]
      const graphicsSet = this.laneGraphics[index]
      if (!graphicsSet) {
        continue
      }

      if (layoutUpdated) {
        graphicsSet.draw(lane, lane.renderX, layout)
      }

      this.updateLaneVisibility(lane, index, graphicsSet)
    }
  }

  updateLaneVisibility(lane, index, graphicsSet) {
    const wasActive = this.lastLaneActive[index]

    // Update visibility only when activity state changes
    if (wasActive !== lane.active) {
      this.lastLaneActive[index] = lane.active
      graphicsSet.setVisibility(lane.active)
    }
  }

  updateLaneLayout() {
    const width = this.app.screen.width
    const height = this.app.screen.height

    if (width === this.lastScreenWidth && height === this.lastScreenHeight) {
      return false
    }
    this.lastScreenWidth = width
    this.lastScreenHeight = height

    this.laneLayout = buildRhythmLayout({
      screenWidth: width,
      screenHeight: height
    })
    if (this.rhythmContainer) {
      this.rhythmContainer.y = this.laneLayout.rhythmOffsetY
    }
    const startX = this.laneLayout.startX

    const lanes = this.gameStateRef.current.lanes
    for (let index = 0, len = lanes.length; index < len; index++) {
      lanes[index].renderX = startX + index * (this.laneLayout.laneWidth + LANE_GAP)
    }
    return true
  }

  dispose() {
    this.laneGraphics = []

    if (this.rhythmContainer) {
      this.rhythmContainer.destroy({ children: true })
      this.rhythmContainer = null
    }
  }

  get container() {
    return this.rhythmContainer
  }

  get layout() {
    return this.laneLayout
  }
}
