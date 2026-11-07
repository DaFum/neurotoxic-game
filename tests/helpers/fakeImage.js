// Controllable stand-in for the browser `Image`. jsdom never fires image load
// events, so preload code under test settles only when a test calls load()/fail().

export class FakeImage {
  /** @type {FakeImage[]} */
  static instances = []

  /** @type {(() => void) | null} */
  onload = null
  /** @type {(() => void) | null} */
  onerror = null
  /** @type {string | null} */
  crossOrigin = null
  /** Whether both handlers were attached when `src` was assigned. */
  handlersAttachedAtSrc = false
  #src = ''

  constructor() {
    FakeImage.instances.push(this)
  }

  get src() {
    return this.#src
  }

  set src(value) {
    this.handlersAttachedAtSrc = this.onload !== null && this.onerror !== null
    this.#src = value
  }

  load() {
    this.onload?.()
  }

  fail() {
    this.onerror?.()
  }
}

const RealImage = globalThis.Image

/** @param {unknown} value */
const setGlobalImage = value => {
  Object.defineProperty(globalThis, 'Image', {
    value,
    configurable: true,
    writable: true
  })
}

/** Replaces the global `Image` with {@link FakeImage} and clears recorded instances. */
export const installFakeImage = () => {
  FakeImage.instances = []
  setGlobalImage(FakeImage)
}

/** Restores the global `Image` captured when this module loaded. */
export const restoreImage = () => {
  setGlobalImage(RealImage)
}
