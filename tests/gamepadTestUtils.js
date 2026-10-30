/**
 * Controllable Gamepad Test Fixture & Stubs.
 */

export function createMockGamepad(options = {}) {
  const {
    index = 0,
    id = 'Xbox Wireless Controller (STANDARD GAMEPAD)',
    mapping = 'standard',
    connected = true,
    buttons = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
    axes = [0, 0, 0, 0]
  } = options

  return {
    index,
    id,
    mapping,
    connected,
    buttons: buttons.map(b =>
      typeof b === 'number'
        ? { pressed: b > 0.5, value: b }
        : { pressed: Boolean(b.pressed), value: b.value ?? (b.pressed ? 1 : 0) }
    ),
    axes: [...axes]
  }
}

let originalGetGamepads = null

export function stubGamepads(pads) {
  if (typeof navigator !== 'undefined') {
    if (!originalGetGamepads) {
      originalGetGamepads = navigator.getGamepads
    }
    Object.defineProperty(navigator, 'getGamepads', {
      value: () => pads,
      configurable: true,
      writable: true
    })
  }
}

export function triggerGamepadConnected(pad) {
  if (typeof window !== 'undefined') {
    const event = new Event('gamepadconnected')
    event.gamepad = pad
    window.dispatchEvent(event)
  }
}

export function triggerGamepadDisconnected(pad) {
  if (typeof window !== 'undefined') {
    const event = new Event('gamepaddisconnected')
    event.gamepad = pad
    window.dispatchEvent(event)
  }
}

export function restoreGamepadStubs() {
  if (typeof navigator !== 'undefined' && originalGetGamepads) {
    Object.defineProperty(navigator, 'getGamepads', {
      value: originalGetGamepads,
      configurable: true,
      writable: true
    })
    originalGetGamepads = null
  }
}
