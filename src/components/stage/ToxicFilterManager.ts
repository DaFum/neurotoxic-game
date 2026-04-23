import { ColorMatrixFilter, Container } from 'pixi.js'

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
   * @param {object} state - The game state.
   * @param {number} elapsed - The elapsed gig time.
   */
  update(state: any, elapsed: number, stageContainer: Container): void {
    if (state.isToxicMode) {
      if (this.colorMatrix) {
        this.colorMatrix.hue(Math.sin(elapsed / 100) * 180, false)
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
   * @returns {boolean}
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
    this.stageContainer = null
  }
}
