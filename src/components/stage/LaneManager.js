import * as PIXI from 'pixi.js'
import { buildRhythmLayout } from '../../utils/pixiStageUtils.js'

const LANE_GAP = 20

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
    this.laneGraphics = [] // { static: Graphics, dynamic: Graphics }
    this.lastLaneActive = []
    this.lastLayoutKey = null
  }

  init() {
    this.rhythmContainer = new PIXI.Container()
    this.laneLayout = buildRhythmLayout({
      screenWidth: this.app.screen.width,
      screenHeight: this.app.screen.height
    })
    this.rhythmContainer.y = this.laneLayout.rhythmOffsetY
    this.stageContainer.addChild(this.rhythmContainer)

    const startX = this.laneLayout.startX
    const laneWidth = this.laneLayout.laneWidth
    const laneHeight = this.laneLayout.laneHeight
    const laneStrokeWidth = this.laneLayout.laneStrokeWidth

    this.gameStateRef.current.lanes.forEach((lane, index) => {
      const laneX = startX + index * (laneWidth + LANE_GAP)
      lane.renderX = laneX

      // Create separate graphics for static background and dynamic elements
      const staticGraphics = new PIXI.Graphics()
      const dynamicGraphics = new PIXI.Graphics()

      // Draw static background once
      staticGraphics.rect(laneX, 0, laneWidth, laneHeight)
      staticGraphics.fill({ color: 0x000000, alpha: 0.8 })
      staticGraphics.stroke({ width: laneStrokeWidth, color: 0x333333 })

      this.rhythmContainer.addChild(staticGraphics)
      this.rhythmContainer.addChild(dynamicGraphics)

      this.laneGraphics[index] = {
        static: staticGraphics,
        dynamic: dynamicGraphics
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

      // Redraw static graphics only if layout updated
      if (layoutUpdated) {
        const { static: staticGraphics } = graphicsSet
        staticGraphics.clear()
        staticGraphics.rect(
          lane.renderX,
          0,
          layout.laneWidth,
          layout.laneHeight
        )
        staticGraphics.fill({ color: 0x000000, alpha: 0.8 })
        staticGraphics.stroke({
          width: layout.laneStrokeWidth,
          color: 0x333333
        })
      }

      const wasActive = this.lastLaneActive[index]

      // Update dynamic graphics if layout changed OR activity changed
      if (layoutUpdated || wasActive !== lane.active) {
        this.lastLaneActive[index] = lane.active

        const { dynamic: dynamicGraphics } = graphicsSet
        dynamicGraphics.clear()

        dynamicGraphics.rect(
          lane.renderX,
          layout.hitLineY,
          layout.laneWidth,
          layout.hitLineHeight
        )
        if (lane.active) {
          dynamicGraphics.fill({ color: lane.color, alpha: 0.8 })
          dynamicGraphics.stroke({
            width: layout.hitLineStrokeWidth,
            color: 0xffffff
          })
        } else {
          dynamicGraphics.stroke({
            width: layout.hitLineStrokeWidth,
            color: lane.color
          })
        }
      }
    })
  }

  updateLaneLayout() {
    const layoutKey = `${this.app.screen.width}x${this.app.screen.height}`
    if (layoutKey === this.lastLayoutKey) {
      return false
    }
    this.lastLayoutKey = layoutKey
    this.laneLayout = buildRhythmLayout({
      screenWidth: this.app.screen.width,
      screenHeight: this.app.screen.height
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
    // Destroy lane graphics to release GPU resources
    for (const graphicsSet of this.laneGraphics) {
      if (graphicsSet) {
        graphicsSet.static?.destroy()
        graphicsSet.dynamic?.destroy()
      }
    }
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
