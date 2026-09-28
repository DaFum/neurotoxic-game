/**
 * Handles Pixi stage resizing against the host container.
 *
 * @remarks
 * Uses `ResizeObserver` if available in the environment to observe the specific DOM container.
 * Falls back to global `window` resize event listener if `ResizeObserver` is undefined.
 * This class abstracts the resize listener mechanism to ensure consistent stage
 * scaling behavior regardless of browser support.
 */
export class StageResizeHandler {
  private resizeObserver: ResizeObserver | null = null
  private _usingWindowResize = false
  private handleResize: () => void

  /**
   * Initializes the resize handler with a callback.
   *
   * @param handleResize - The callback function executed when a resize event is detected.
   */
  constructor(handleResize: () => void) {
    this.handleResize = handleResize
  }

  /**
   * Binds the resize observation to a specific DOM element.
   *
   * @param container - The DOM element to observe for dimension changes.
   */
  setup(container: Element) {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.handleResize())
      this.resizeObserver.observe(container)
    } else {
      window.addEventListener('resize', this.handleResize)
      this._usingWindowResize = true
    }
  }

  /**
   * Tears down active observers and removes global event listeners to prevent memory leaks.
   */
  cleanup() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    if (this._usingWindowResize) {
      window.removeEventListener('resize', this.handleResize)
      this._usingWindowResize = false
    }
  }
}
