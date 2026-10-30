/**
 * Controller Layout Family Detection & Button Label/Glyph formatting.
 */

import {
  BUTTON_CONFIRM,
  BUTTON_BACK,
  BUTTON_X,
  BUTTON_Y,
  BUTTON_LB,
  BUTTON_RB,
  BUTTON_LT,
  BUTTON_RT,
  BUTTON_HELP,
  BUTTON_START,
  BUTTON_LS,
  BUTTON_RS,
  BUTTON_DPAD_UP,
  BUTTON_DPAD_DOWN,
  BUTTON_DPAD_LEFT,
  BUTTON_DPAD_RIGHT
} from './standardIndices'

export type LayoutFamily = 'xbox' | 'playstation' | 'generic'

export function detectLayoutFamily(id: string): LayoutFamily {
  if (!id || typeof id !== 'string') return 'generic'
  const lower = id.toLowerCase()

  if (
    lower.includes('dualsense') ||
    lower.includes('dualshock') ||
    lower.includes('playstation') ||
    lower.includes('sony') ||
    lower.includes('ps4') ||
    lower.includes('ps5') ||
    lower.includes('054c')
  ) {
    return 'playstation'
  }

  if (
    lower.includes('xbox') ||
    lower.includes('x-input') ||
    lower.includes('xinput') ||
    lower.includes('microsoft') ||
    lower.includes('045e')
  ) {
    return 'xbox'
  }

  return 'generic'
}

export function getButtonLabel(index: number, layout: LayoutFamily = 'xbox'): string {
  switch (index) {
    case BUTTON_CONFIRM:
      return layout === 'playstation' ? '✕' : layout === 'xbox' ? 'A' : 'B0 (A)'
    case BUTTON_BACK:
      return layout === 'playstation' ? '○' : layout === 'xbox' ? 'B' : 'B1 (B)'
    case BUTTON_X:
      return layout === 'playstation' ? '□' : layout === 'xbox' ? 'X' : 'B2 (X)'
    case BUTTON_Y:
      return layout === 'playstation' ? '△' : layout === 'xbox' ? 'Y' : 'B3 (Y)'
    case BUTTON_LB:
      return layout === 'playstation' ? 'L1' : layout === 'xbox' ? 'LB' : 'LB'
    case BUTTON_RB:
      return layout === 'playstation' ? 'R1' : layout === 'xbox' ? 'RB' : 'RB'
    case BUTTON_LT:
      return layout === 'playstation' ? 'L2' : layout === 'xbox' ? 'LT' : 'LT'
    case BUTTON_RT:
      return layout === 'playstation' ? 'R2' : layout === 'xbox' ? 'RT' : 'RT'
    case BUTTON_HELP:
      return layout === 'playstation' ? 'Share' : layout === 'xbox' ? 'View' : 'Select'
    case BUTTON_START:
      return layout === 'playstation' ? 'OPTIONS' : layout === 'xbox' ? '≡' : 'Start'
    case BUTTON_LS:
      return 'L3'
    case BUTTON_RS:
      return 'R3'
    case BUTTON_DPAD_UP:
      return 'D-Up'
    case BUTTON_DPAD_DOWN:
      return 'D-Down'
    case BUTTON_DPAD_LEFT:
      return 'D-Left'
    case BUTTON_DPAD_RIGHT:
      return 'D-Right'
    default:
      return `B${index}`
  }
}
