import { Container } from 'pixi.js'
import { buildRhythmLayout } from './utils'
import { LaneRenderer } from './LaneRenderer'

const LANE_GAP = 20

export class LaneManager {
  [key: string]: any
  /**
   * @param {Application} app
   * @param {Container} stageContainer
   * @param {object} gameStateRef
   */
  constructor(app: any, stageContainer: any, gameStateRef: any) {
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

  _createLaneGraphics(lane: any, index: any, laneX: any) {
    const renderer = new LaneRenderer(index)

    // Set initial visibility based on lane state and initialize cache
    renderer.setVisibility(lane.active)
    this.lastLaneActive[index] = lane.active

    renderer.addTo(this.rhythmContainer)
    renderer.draw(lane, laneX, this.laneLayout)

    this.laneGraphics[index] = renderer
  }

  update(state: any) {
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

  updateLaneVisibility(lane: any, index: any, graphicsSet: any) {
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
      lanes[index].renderX =
        startX + index * (this.laneLayout.laneWidth + LANE_GAP)
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
