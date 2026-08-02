import { Graphics, type Container } from 'pixi.js'
import { getPixiColorFromToken, buildRhythmLayout } from './stageRenderUtils'

const LANE_BASE_FILL = getPixiColorFromToken('--void-black')
const LANE_BASE_ALPHA = 0.7
const LANE_BORDER_COLOR = getPixiColorFromToken('--toxic-green')
const LANE_BORDER_ALPHA = 0.35
const HIT_BAR_INACTIVE_ALPHA = 0.45
const HIT_BAR_ACTIVE_ALPHA = 0.95
const HIT_BAR_BORDER_COLOR = getPixiColorFromToken('--star-white')
const LANE_GUIDE_ALPHA = 0.16

/**
 * Extracted layout dimension type from the layout builder.
 */
type RhythmLayout = ReturnType<typeof buildRhythmLayout>

/**
 * Extended Pixi Graphics instance containing lane metadata for debugging and identification.
 */
interface TaggedGraphics extends Graphics {
  /** The zero-based index of the lane this graphic belongs to. */
  __laneIndex: number
  /** The visual layer identifier (e.g., 'static', 'active', 'inactive'). */
  __layer: string
}

/**
 * Manages the rendering layers for a single rhythm game lane.
 *
 * @remarks
 * This class abstracts the three graphical layers (static background, active hit bar, inactive hit bar)
 * required to render a rhythm lane. It handles drawing the shapes based on provided layout metrics
 * and toggling visibility states during gameplay.
 */
export class LaneRenderer {
  /** The static background layer of the lane, including the guide strip. */
  static: TaggedGraphics
  /** The active hit bar layer, shown when the lane is pressed. */
  active: TaggedGraphics
  /** The inactive hit bar layer, shown when the lane is not pressed. */
  inactive: TaggedGraphics

  /**
   * Initializes the graphics layers for the lane.
   *
   * @param index - The zero-based index of the lane.
   */
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

  /**
   * Attaches the graphic layers to the provided Pixi container.
   *
   * @param container - The parent container to add the graphics to.
   */
  addTo(container: Container) {
    container.addChild(this.static)
    container.addChild(this.inactive)
    container.addChild(this.active)
  }

  /**
   * Draws the lane graphics based on the current layout dimensions.
   *
   * @remarks
   * This method clears any existing drawings on the layers and reconstructs the rectangles,
   * fills, and strokes for the static background, active hit bar, and inactive hit bar.
   *
   * @param lane - The configuration object for the lane.
   * @param renderX - The calculated horizontal starting position for this lane.
   * @param layout - The current layout dimensions for the rhythm stage.
   */
  draw(lane: { color: number }, renderX: number, layout: RhythmLayout) {
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

  /**
   * Updates the visibility of the hit bar layers based on the lane's active state.
   *
   * @param isActive - A boolean indicating whether the lane is currently being pressed.
   */
  setVisibility(isActive: boolean) {
    this.active.visible = !!isActive
    this.inactive.visible = !isActive
  }
}
