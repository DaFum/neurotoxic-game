/** Standard Gamepad API button indices. */
export const GAMEPAD_BUTTON = {
  SOUTH: 0,
  EAST: 1,
  WEST: 2,
  NORTH: 3,
  LEFT_SHOULDER: 4,
  RIGHT_SHOULDER: 5,
  LEFT_TRIGGER: 6,
  RIGHT_TRIGGER: 7,
  BACK: 8,
  START: 9,
  UP: 12,
  DOWN: 13,
  LEFT: 14,
  RIGHT: 15
} as const

const RESERVED_GAMEPAD_BUTTONS = new Set<number>([GAMEPAD_BUTTON.START])
export const DEFAULT_GAMEPAD_LANE_BINDINGS: readonly [number, number, number] =
  [2, 0, 1]

export function isAssignableGamepadButton(button: unknown): button is number {
  return (
    typeof button === 'number' &&
    Number.isInteger(button) &&
    button >= 0 &&
    button <= 63 &&
    !RESERVED_GAMEPAD_BUTTONS.has(button)
  )
}
