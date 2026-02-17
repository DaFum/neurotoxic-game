import { JSDOM } from 'jsdom'

let dom
let originalGlobalDescriptors

/**
 * Sets up a JSDOM environment in the global scope.
 * Preserves original descriptors to restore them later.
 */
export function setupJSDOM() {
  originalGlobalDescriptors = new Map(
    ['window', 'document', 'navigator'].map(key => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key)
    ])
  )
  dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost'
  })
  for (const [key, value] of [
    ['window', dom.window],
    ['document', dom.window.document],
    ['navigator', dom.window.navigator]
  ]) {
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true
    })
  }

  // Polyfill requestAnimationFrame for React
  if (!globalThis.requestAnimationFrame) {
    globalThis.requestAnimationFrame = callback => setTimeout(callback, 0)
  }
  if (!globalThis.cancelAnimationFrame) {
    globalThis.cancelAnimationFrame = id => clearTimeout(id)
  }
}

/**
 * Tears down the JSDOM environment and restores global descriptors.
 */
export function teardownJSDOM() {
  if (dom) {
    dom.window.close()
  }
  for (const key of ['window', 'document', 'navigator']) {
    const descriptor = originalGlobalDescriptors?.get(key)
    if (descriptor) {
      Object.defineProperty(globalThis, key, descriptor)
    } else {
      delete globalThis[key]
    }
  }
  originalGlobalDescriptors = null
  dom = null
}
