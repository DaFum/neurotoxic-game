import { ColorMatrixFilter, Container } from 'pixi.js'
import type { RhythmGameRefState } from '../../types/rhythmGame'

/**
 * Manages toxic mode filter effects for the stage.
 */
export class ToxicFilterManager {
  colorMatrix: ColorMatrixFilter | null
  toxicFilters: ColorMatrixFilter[] | null
  isToxicActive: boolean
  constructor() {
    this.isToxicActive = false
    this.colorMatrix = new ColorMatrixFilter()
    this.toxicFilters = [this.colorMatrix]
  }

  /**
   * Updates toxic mode filter effects based on game state.
   * @param state - The game state.
   * @param elapsed - The elapsed gig time.
   * @param stageContainer - The container to apply the filters to.
   */
  update(
    state: Pick<RhythmGameRefState, 'isToxicMode'>,
    elapsed: number,
    stageContainer: Container
  ): void {
    if (state.isToxicMode) {
      if (this.colorMatrix) {
        // Apply Hue change based on time
        this.colorMatrix.hue(Math.sin(elapsed / 100) * 180, false)
        // Add a brutalist contrast boost if contrast method exists
        if (typeof this.colorMatrix.contrast === 'function') {
          this.colorMatrix.contrast(1.2, true)
        }
      }
      if (!this.isToxicActive && stageContainer) {
        stageContainer.filters = this.toxicFilters
        this.isToxicActive = true
      }
    } else {
      if (this.isToxicActive && stageContainer) {
        stageContainer.filters = null
        this.isToxicActive = false
      }
    }
  }

  /**
   * Checks if the manager is ready for updates.
   * @returns Whether the toxic filters are available.
   */
  isReady(): boolean {
    return !!this.toxicFilters
  }

  /**
   * Disposes Pixi resources related to toxic filters.
   */
  dispose(): void {
    if (this.colorMatrix) {
      this.colorMatrix.destroy()
      this.colorMatrix = null
    }

    this.toxicFilters = null
  }
}
