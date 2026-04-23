export class StageResizeHandler {
  private resizeObserver: ResizeObserver | null = null
  private _usingWindowResize = false
  private handleResize: () => void

  constructor(handleResize: () => void) {
    this.handleResize = handleResize
  }

  setup(container: Element) {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.handleResize())
      this.resizeObserver.observe(container)
    } else {
      window.addEventListener('resize', this.handleResize)
      this._usingWindowResize = true
    }
  }

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
