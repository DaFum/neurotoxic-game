import * as PIXI from 'pixi.js'
import { buildRhythmLayout, getPixiColorFromToken } from './utils.js'

const LANE_GAP = 20
const LANE_BASE_FILL = getPixiColorFromToken('--void-black')
const LANE_BASE_ALPHA = 0.7
const LANE_BORDER_COLOR = getPixiColorFromToken('--toxic-green')
const LANE_BORDER_ALPHA = 0.35
export const HIT_BAR_INACTIVE_ALPHA = 0.45
export const HIT_BAR_ACTIVE_ALPHA = 0.95
export const HIT_BAR_BORDER_COLOR = getPixiColorFromToken('--star-white')
const LANE_GUIDE_ALPHA = 0.16

export class LaneManager {
  /**
   * @param {PIXI.Application} app
   * @param {PIXI.Container} stageContainer
   * @param {object} gameStateRef
   */
  constructor(app, stageContainer, gameStateRef) {
    this.app = app
    this.stageContainer = stageContainer
    this.gameStateRef = gameStateRef
    this.rhythmContainer = null
    this.laneLayout = null
    this.laneGraphics = [] // { static: Graphics, active: Graphics, inactive: Graphics }
    this.lastLaneActive = []
    this.lastScreenWidth = -1
    this.lastScreenHeight = -1
  }

  init() {
    this.rhythmContainer = new PIXI.Container()
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

    const startX = this.laneLayout.startX
    const laneWidth = this.laneLayout.laneWidth
    const laneHeight = this.laneLayout.laneHeight
    const laneStrokeWidth = this.laneLayout.laneStrokeWidth

    // Initial hit line geometry
    const hitLineY = this.laneLayout.hitLineY
    const hitLineHeight = this.laneLayout.hitLineHeight
    const hitLineStrokeWidth = this.laneLayout.hitLineStrokeWidth

    this.gameStateRef.current.lanes.forEach((lane, index) => {
      const laneX = startX + index * (laneWidth + LANE_GAP)
      // Side-effect: Mutating gameState lanes with render position for NoteManager
      lane.renderX = laneX

      // Create separate graphics for static background and dynamic elements
      const staticGraphics = new PIXI.Graphics()
      staticGraphics.__laneIndex = index
      staticGraphics.__layer = 'static'

      const activeGraphics = new PIXI.Graphics()
      activeGraphics.__laneIndex = index
      activeGraphics.__layer = 'active'
      activeGraphics.visible = false

      const inactiveGraphics = new PIXI.Graphics()
      inactiveGraphics.__laneIndex = index
      inactiveGraphics.__layer = 'inactive'
      inactiveGraphics.visible = true

      // Draw static background once
      staticGraphics.rect(laneX, 0, laneWidth, laneHeight)
      staticGraphics.fill({ color: LANE_BASE_FILL, alpha: LANE_BASE_ALPHA })

      staticGraphics.rect(laneX + laneWidth * 0.35, 0, laneWidth * 0.3, laneHeight)
      staticGraphics.fill({ color: lane.color, alpha: LANE_GUIDE_ALPHA })

      staticGraphics.stroke({
        width: laneStrokeWidth,
        color: LANE_BORDER_COLOR,
        alpha: LANE_BORDER_ALPHA
      })

      // Draw active/inactive states initially
      activeGraphics.rect(laneX, hitLineY, laneWidth, hitLineHeight)
      activeGraphics.fill({ color: lane.color, alpha: HIT_BAR_ACTIVE_ALPHA })
      activeGraphics.stroke({
        width: hitLineStrokeWidth,
        color: HIT_BAR_BORDER_COLOR
      })

      inactiveGraphics.rect(laneX, hitLineY, laneWidth, hitLineHeight)
      inactiveGraphics.fill({ color: lane.color, alpha: HIT_BAR_INACTIVE_ALPHA })
      inactiveGraphics.stroke({
        width: hitLineStrokeWidth,
        color: lane.color
      })

      this.rhythmContainer.addChild(staticGraphics)
      this.rhythmContainer.addChild(inactiveGraphics)
      this.rhythmContainer.addChild(activeGraphics)

      this.laneGraphics[index] = {
        static: staticGraphics,
        active: activeGraphics,
        inactive: inactiveGraphics
      }
    })
  }

  update(state) {
    const layoutUpdated = this.updateLaneLayout()
    const layout = this.laneLayout

    state.lanes.forEach((lane, index) => {
      const graphicsSet = this.laneGraphics[index]
      if (!graphicsSet) {
        return
      }

      const { static: staticGraphics, active: activeGraphics, inactive: inactiveGraphics } = graphicsSet

      // Redraw graphics only if layout updated
      if (layoutUpdated) {
        staticGraphics.clear()
        staticGraphics.rect(
          lane.renderX,
          0,
          layout.laneWidth,
          layout.laneHeight
        )
        staticGraphics.fill({ color: LANE_BASE_FILL, alpha: LANE_BASE_ALPHA })

        staticGraphics.rect(
          lane.renderX + layout.laneWidth * 0.35,
          0,
          layout.laneWidth * 0.3,
          layout.laneHeight
        )
        staticGraphics.fill({ color: lane.color, alpha: LANE_GUIDE_ALPHA })

        staticGraphics.stroke({
          width: layout.laneStrokeWidth,
          color: LANE_BORDER_COLOR,
          alpha: LANE_BORDER_ALPHA
        })

        activeGraphics.clear()
        activeGraphics.rect(
          lane.renderX,
          layout.hitLineY,
          layout.laneWidth,
          layout.hitLineHeight
        )
        activeGraphics.fill({ color: lane.color, alpha: HIT_BAR_ACTIVE_ALPHA })
        activeGraphics.stroke({
          width: layout.hitLineStrokeWidth,
          color: HIT_BAR_BORDER_COLOR
        })

        inactiveGraphics.clear()
        inactiveGraphics.rect(
          lane.renderX,
          layout.hitLineY,
          layout.laneWidth,
          layout.hitLineHeight
        )
        inactiveGraphics.fill({ color: lane.color, alpha: HIT_BAR_INACTIVE_ALPHA })
        inactiveGraphics.stroke({
          width: layout.hitLineStrokeWidth,
          color: lane.color
        })
      }

      const wasActive = this.lastLaneActive[index]

      // Update visibility if layout changed OR activity changed
      if (layoutUpdated || wasActive !== lane.active) {
        this.lastLaneActive[index] = lane.active

        activeGraphics.visible = !!lane.active
        inactiveGraphics.visible = !lane.active
      }
    })
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

    this.gameStateRef.current.lanes.forEach((lane, index) => {
      lane.renderX = startX + index * (this.laneLayout.laneWidth + LANE_GAP)
    })
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
