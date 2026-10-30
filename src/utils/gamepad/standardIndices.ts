/**
 * Standard Gamepad button and axis indices.
 * Based on the W3C Standard Gamepad specification.
 */

export const BUTTON_CONFIRM = 0
export const BUTTON_BACK = 1
export const BUTTON_X = 2
export const BUTTON_Y = 3
export const BUTTON_LB = 4
export const BUTTON_RB = 5
export const BUTTON_LT = 6
export const BUTTON_RT = 7
export const BUTTON_HELP = 8
export const BUTTON_START = 9
export const BUTTON_LS = 10
export const BUTTON_RS = 11
export const BUTTON_DPAD_UP = 12
export const BUTTON_DPAD_DOWN = 13
export const BUTTON_DPAD_LEFT = 14
export const BUTTON_DPAD_RIGHT = 15
export const BUTTON_HOME = 16

export const AXIS_LEFT_X = 0
export const AXIS_LEFT_Y = 1
export const AXIS_RIGHT_X = 2
export const AXIS_RIGHT_Y = 3

/** Reserved Start button index (9) that cannot be used for lane bindings. */
export const RESERVED_START_BUTTON = BUTTON_START

/** Default lane bindings for Guitar, Drums, and Bass. */
export const DEFAULT_GAMEPAD_LANE_BINDINGS = [
  BUTTON_X,
  BUTTON_CONFIRM,
  BUTTON_BACK
] as const satisfies [number, number, number]
