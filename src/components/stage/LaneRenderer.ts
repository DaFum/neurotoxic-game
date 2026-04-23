import { Graphics } from 'pixi.js'
import { getPixiColorFromToken } from './utils'

const LANE_BASE_FILL = getPixiColorFromToken('--void-black')
const LANE_BASE_ALPHA = 0.7
const LANE_BORDER_COLOR = getPixiColorFromToken('--toxic-green')
const LANE_BORDER_ALPHA = 0.35
const HIT_BAR_INACTIVE_ALPHA = 0.45
const HIT_BAR_ACTIVE_ALPHA = 0.95
const HIT_BAR_BORDER_COLOR = getPixiColorFromToken('--star-white')
const LANE_GUIDE_ALPHA = 0.16

export interface TaggedGraphics extends Graphics {
  __laneIndex: number
  __layer: string
}

export class LaneRenderer {
  static: TaggedGraphics
  active: TaggedGraphics
  inactive: TaggedGraphics
    constructor(index: number) {
    const createGraphicsLayer = (layer: string, isVisible = true) => {
      const g = new Graphics() as TaggedGraphics
      g.__laneIndex = index
      g.__layer = layer
      g.visible = isVisible
      return g
    }

    this.static = createGraphicsLayer('static')
    this.active = createGraphicsLayer('active', false)
    this.inactive = createGraphicsLayer('inactive')
  }

  addTo(container: import("pixi.js").Container) {
    container.addChild(this.static)
    container.addChild(this.inactive)
    container.addChild(this.active)
  }

  draw(lane: { color: number }, renderX: number, layout: ReturnType<typeof import('./utils').buildRhythmLayout>) {
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

  setVisibility(isActive: boolean) {
    this.active.visible = !!isActive
    this.inactive.visible = !isActive
  }
}
