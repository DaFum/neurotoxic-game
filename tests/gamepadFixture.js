/** Controllable Gamepad API and animation-frame queue for controller tests. */
export function installGamepadFixture() {
  const descriptors = new Map(
    ['requestAnimationFrame', 'cancelAnimationFrame'].map(key => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key)
    ])
  )
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(
    navigator,
    'getGamepads'
  )
  const pads = []
  const frames = new Map()
  let nextFrame = 0
  Object.defineProperty(navigator, 'getGamepads', {
    configurable: true,
    value: () => pads
  })
  globalThis.requestAnimationFrame = callback => {
    frames.set(++nextFrame, callback)
    return nextFrame
  }
  globalThis.cancelAnimationFrame = id => frames.delete(id)
  return {
    pads,
    makePad(index = 0) {
      return {
        index,
        id: `Xbox test ${index}`,
        mapping: 'standard',
        buttons: Array.from({ length: 16 }, () => ({
          pressed: false,
          value: 0
        })),
        axes: [0, 0]
      }
    },
    connect(pad) {
      pads[pad.index] = pad
      window.dispatchEvent(new Event('gamepadconnected'))
    },
    disconnect(index) {
      pads[index] = null
      window.dispatchEvent(new Event('gamepaddisconnected'))
    },
    step(time) {
      const callbacks = [...frames.values()]
      frames.clear()
      callbacks.forEach(callback => callback(time))
    },
    restore() {
      if (navigatorDescriptor)
        Object.defineProperty(navigator, 'getGamepads', navigatorDescriptor)
      else delete navigator.getGamepads
      for (const [key, descriptor] of descriptors) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor)
        else delete globalThis[key]
      }
    }
  }
}
