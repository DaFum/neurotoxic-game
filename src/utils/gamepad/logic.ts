import { GAMEPAD_BUTTON } from './constants'

export type Direction = 'left' | 'right' | 'up' | 'down'
export type GamepadSnapshot = {
  index: number
  id: string
  mapping: string
  standard: boolean
  buttons: boolean[]
  stick: [number, number]
}
export type LayoutFamily = 'xbox' | 'playstation' | 'generic'

/** Copy the fields used by the input layer; browser Gamepad objects are live. */
export function normalizeGamepad(
  pad: Gamepad,
  previous?: GamepadSnapshot
): GamepadSnapshot {
  return {
    index: pad.index,
    id: pad.id,
    mapping: pad.mapping,
    standard: pad.mapping === 'standard',
    buttons: Array.from(pad.buttons, (button, index) => {
      if (
        index === GAMEPAD_BUTTON.LEFT_TRIGGER ||
        index === GAMEPAD_BUTTON.RIGHT_TRIGGER
      ) {
        return (
          button.pressed ||
          button.value >= (previous?.buttons[index] ? 0.4 : 0.55)
        )
      }
      return button.pressed
    }),
    stick: [pad.axes[0] || 0, pad.axes[1] || 0]
  }
}

export function filterStick(
  [x, y]: [number, number],
  deadzone = 0.25
): [number, number] {
  return Math.hypot(x, y) <= deadzone ? [0, 0] : [x, y]
}

export function directionFromStick(
  [x, y]: [number, number],
  previous: Direction | null
): Direction | null {
  const magnitude = Math.hypot(x, y)
  const candidate =
    Math.abs(x) >= Math.abs(y)
      ? x < 0
        ? 'left'
        : 'right'
      : y < 0
        ? 'up'
        : 'down'
  if (magnitude < (previous === candidate ? 0.4 : 0.6)) return null
  return candidate
}

export function createDirectionRepeater() {
  let current: Direction | null = null
  let next = 0
  return (direction: Direction | null, now: number): Direction | null => {
    if (direction !== current) {
      current = direction
      next = now + 400
      return direction
    }
    if (direction && now >= next) {
      next = now + 120
      return direction
    }
    return null
  }
}

export function mergeGamepads(
  pads: Pick<GamepadSnapshot, 'buttons'>[]
): boolean[] {
  const result: boolean[] = []
  for (const pad of pads) {
    for (let i = 0; i < pad.buttons.length; i++)
      result[i] = Boolean(result[i] || pad.buttons[i])
  }
  return result
}

export function createButtonEdges() {
  let previous: boolean[] = []
  let armed: boolean[] = []
  let first = true
  return {
    rearm() {
      armed = []
      first = true
    },
    update(buttons: boolean[]) {
      const events: { button: number; pressed: boolean }[] = []
      const length = Math.max(buttons.length, previous.length)
      for (let i = 0; i < length; i++) {
        const down = Boolean(buttons[i])
        if (!down) {
          if (previous[i] && armed[i])
            events.push({ button: i, pressed: false })
          armed[i] = true
        } else if (!first && !previous[i] && armed[i]) {
          events.push({ button: i, pressed: true })
        }
      }
      previous = buttons.slice()
      first = false
      return events
    }
  }
}

export function getLayoutFamily(id: string): LayoutFamily {
  if (
    /playstation|dualshock|dualsense|sony|054c/i.test(id) &&
    !/xbox/i.test(id)
  )
    return 'playstation'
  if (/xbox|xinput|microsoft/i.test(id)) return 'xbox'
  return 'generic'
}

export function readGamepads(nav: Pick<Navigator, 'getGamepads'> | object): {
  available: boolean
  pads: Gamepad[]
} {
  try {
    if (!('getGamepads' in nav) || typeof nav.getGamepads !== 'function')
      return { available: false, pads: [] }
    return {
      available: true,
      pads: Array.from(nav.getGamepads()).filter(
        (pad): pad is Gamepad => pad !== null
      )
    }
  } catch {
    return { available: false, pads: [] }
  }
}
