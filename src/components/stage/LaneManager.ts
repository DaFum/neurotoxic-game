import { Container, type Application } from 'pixi.js'
import type { RhythmGameRefState, RhythmLane } from '../../types/rhythmGame'
import type { RefObject } from 'react'
import { buildRhythmLayout } from './stageRenderUtils'
import { LaneRenderer } from './LaneRenderer'

/**
 * Manages Lane rendering resources and state.
 */
export class LaneManager {
  app: Application
  stageContainer: Container
  gameStateRef: RefObject<RhythmGameRefState>
  rhythmContainer: Container | null
  laneLayout: ReturnType<typeof buildRhythmLayout> | null
  laneGraphics: LaneRenderer[]
  lastLaneActive: boolean[]
  lastScreenWidth: number
  lastScreenHeight: number

  /**
   * Initializes the manager with core rendering dependencies.
   *
   * @param app - The PixiJS application instance.
   * @param stageContainer - The root stage container where the rhythm container will be attached.
   * @param gameStateRef - A reference to the active rhythm game state.
   */
  constructor(
    app: Application,
    stageContainer: Container,
    gameStateRef: RefObject<RhythmGameRefState>
  ) {
    this.app = app
    this.stageContainer = stageContainer
    this.gameStateRef = gameStateRef
    this.rhythmContainer = null
    this.laneLayout = null
    this.laneGraphics = []
    this.lastLaneActive = []
    this.lastScreenWidth = -1
    this.lastScreenHeight = -1
  }

  /**
   * Initializes the rhythm container and calculates baseline screen layout parameters.
   */
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

  /**
   * Executes the initialization phase, calling container setup and dynamically instantiating graphic resources for each active lane.
   */
  init() {
    this._initContainerAndLayout()
    if (!this.laneLayout) return

    const startX = this.laneLayout.startX
    const laneWidth = this.laneLayout.laneWidth

    const lanes = this.gameStateRef.current?.lanes ?? []
    for (let index = 0, len = lanes.length; index < len; index++) {
      const lane = lanes[index]
      if (!lane || !this.laneLayout) continue
      const laneX = startX + index * (laneWidth + this.laneLayout.laneGap)
      // Side-effect: Mutating gameState lanes with render position for NoteManager
      lane.renderX = laneX

      this._createLaneGraphics(lane, index, laneX)
    }
  }

  /**
   * Instantiates graphic renderers for an active rhythm lane.
   *
   * @param lane - The rhythm lane state.
   * @param index - The numerical index of the lane.
   * @param laneX - The calculated x-coordinate for lane rendering.
   */
  _createLaneGraphics(lane: RhythmLane, index: number, laneX: number) {
    if (!this.rhythmContainer || !this.laneLayout) return

    const renderer = new LaneRenderer(index)

    // Set initial visibility based on lane state and initialize cache
    renderer.setVisibility(lane.active)
    this.lastLaneActive[index] = lane.active

    renderer.addTo(this.rhythmContainer)
    renderer.draw(lane, laneX, this.laneLayout)

    this.laneGraphics[index] = renderer
  }

  /**
   * Syncs graphics sets based on the active rhythm state payload.
   *
   * @param state - The active snapshot of the rhythm game loop state.
   */
  update(state: RhythmGameRefState) {
    const layoutUpdated = this.updateLaneLayout()
    const layout = this.laneLayout

    for (let index = 0; index < state.lanes.length; index++) {
      const lane = state.lanes[index]
      const graphicsSet = this.laneGraphics[index]
      if (!lane || !graphicsSet || typeof lane.renderX !== 'number' || !layout)
        continue

      if (layoutUpdated) {
        graphicsSet.draw(lane, lane.renderX, layout)
      }

      this.updateLaneVisibility(lane, index, graphicsSet)
    }
  }

  /**
   * Updates renderer visibility based on lane activity changes.
   *
   * @param lane - The lane state containing activity tracking.
   * @param index - The numerical index of the lane.
   * @param graphicsSet - The graphic renderer instance assigned to the lane.
   */
  updateLaneVisibility(
    lane: { active: boolean },
    index: number,
    graphicsSet: LaneRenderer
  ) {
    const wasActive = this.lastLaneActive[index]

    // Update visibility only when activity state changes
    if (wasActive !== lane.active) {
      this.lastLaneActive[index] = lane.active
      graphicsSet.setVisibility(lane.active)
    }
  }

  /**
   * Performs dynamic resolution checks and synchronizes internal lane positions.
   *
   * @returns A boolean indicating whether a resolution shift forced a layout update.
   */
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

    const lanes = this.gameStateRef.current?.lanes
    if (!lanes) return true
    for (let index = 0, len = lanes.length; index < len; index++) {
      const lane = lanes[index]
      if (!lane) continue
      lane.renderX =
        startX + index * (this.laneLayout.laneWidth + this.laneLayout.laneGap)
    }
    return true
  }

  /**
   * Executes teardown procedures, clearing graphics lists and destroying active containers.
   */
  dispose() {
    this.laneGraphics = []

    if (this.rhythmContainer) {
      this.rhythmContainer.destroy({ children: true })
      this.rhythmContainer = null
    }
  }

  /**
   * Retrieves the active container node.
   *
   * @returns The active rhythm container instance.
   */
  get container() {
    return this.rhythmContainer
  }

  /**
   * Retrieves the active layout object.
   *
   * @returns The active layout configuration parameters.
   */
  get layout() {
    return this.laneLayout
  }
}
