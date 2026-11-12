import { GAMEPAD_BUTTON } from './constants'

import type {
  Direction,
  GamepadSnapshot,
  LayoutFamily
} from '../../types/gamepad'
export type {
  Direction,
  GamepadSnapshot,
  LayoutFamily
} from '../../types/gamepad'

/**
 * Normalizes a browser Gamepad object into a static snapshot.
 *
 * @remarks
 * Browser Gamepad objects are live and their properties mutate over time. This function extracts the fields used by the input layer to create a stable, comparable snapshot. It also normalizes trigger inputs by applying deadzones.
 *
 * @param pad - The raw browser Gamepad object to normalize.
 * @param previous - Optional previous snapshot to apply hysteresis to trigger deadzones.
 * @returns A normalized static snapshot of the gamepad state.
 */
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

/**
 * Filters a gamepad stick input by applying a deadzone.
 *
 * @param stick - A tuple containing the x and y axis values of the stick.
 * @param deadzone - The minimum magnitude required for the stick input to register. Defaults to 0.25.
 * @returns The original stick input if its magnitude exceeds the deadzone, otherwise a zero vector.
 */
export function filterStick(
  [x, y]: [number, number],
  deadzone = 0.25
): [number, number] {
  return Math.hypot(x, y) <= deadzone ? [0, 0] : [x, y]
}

/**
 * Derives a discrete directional input from analog stick coordinates.
 *
 * @remarks
 * This function applies a higher threshold to the stick's magnitude to register a direction. It also implements hysteresis by lowering the threshold if the stick is already pointing in the previously registered direction.
 *
 * @param stick - A tuple containing the x and y axis values of the stick.
 * @param previous - The previously registered direction, used for hysteresis.
 * @returns The derived discrete direction, or null if the stick magnitude is below the threshold.
 */
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

/**
 * Creates a stateful function that emits repeated directional inputs when a direction is held.
 *
 * @remarks
 * This implements a typical auto-repeat mechanic found in UI navigation: an initial delay before the first repeat, followed by a faster repeat rate.
 *
 * @returns A function that takes a direction and the current timestamp, and returns the direction if it should be emitted, or null otherwise.
 */
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

/**
 * Merges the button states of multiple gamepads into a single virtual gamepad state.
 *
 * @remarks
 * This allows users to seamlessly switch between controllers or use multiple controllers acting as one logical input. A button is considered pressed if it is pressed on any of the provided gamepads.
 *
 * @param pads - An array of gamepad snapshots to merge.
 * @returns An array representing the merged button states, where true indicates the button is pressed.
 */
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

/**
 * Creates a stateful object that tracks button state transitions (edges) over time.
 *
 * @remarks
 * When `update()` is first called, or after `rearm()` is called, a button that is already held produces neither a press event nor its following release event; it becomes armed only after being observed in the unpressed state. This prevents firing stale events when components mount or focus shifts while a button is already held.
 *
 * @returns An object with methods to rearm the edge detection and update the state to retrieve a list of button transition events.
 */
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

/**
 * Infers the controller layout family (e.g., PlayStation, Xbox, Generic) from a gamepad ID string.
 *
 * @param id - The ID string provided by the browser's Gamepad API.
 * @returns The inferred layout family.
 */
export function getLayoutFamily(id: string): LayoutFamily {
  if (
    /playstation|dualshock|dualsense|sony|054c/i.test(id) &&
    !/xbox/i.test(id)
  )
    return 'playstation'
  if (/xbox|xinput|microsoft/i.test(id)) return 'xbox'
  return 'generic'
}

/**
 * Safely reads the currently connected gamepads from the Navigator API.
 *
 * @remarks
 * This function handles environments where the Gamepad API might not be available or might throw errors. It filters out null entries from the API's result array.
 *
 * @param nav - The Navigator object, or an object matching its shape for the getGamepads method.
 * @returns An object indicating whether the API is available and an array of valid Gamepad objects.
 */
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
