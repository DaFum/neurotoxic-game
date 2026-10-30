/**
 * Multi-pad Input Aggregation.
 * Combines normalized inputs from all connected pads into a single logical state.
 * Removing a disconnected pad removes only that pad's contribution.
 */

import type { NormalizedGamepad, NormalizedButton } from './normalization'

export interface MergedGamepadState {
  connectedPadsCount: number
  buttons: NormalizedButton[]
  axes: number[]
}

export function mergeNormalizedGamepads(
  pads: (NormalizedGamepad | null)[]
): MergedGamepadState {
  const activePads = pads.filter((p): p is NormalizedGamepad => Boolean(p && p.connected))

  if (activePads.length === 0) {
    return {
      connectedPadsCount: 0,
      buttons: [],
      axes: []
    }
  }

  let maxButtons = 0
  let maxAxes = 0
  for (const pad of activePads) {
    if (pad.buttons.length > maxButtons) maxButtons = pad.buttons.length
    if (pad.axes.length > maxAxes) maxAxes = pad.axes.length
  }

  const mergedButtons: NormalizedButton[] = Array.from({ length: maxButtons }, () => ({
    pressed: false,
    value: 0
  }))

  const mergedAxes: number[] = Array.from({ length: maxAxes }, () => 0)

  for (const pad of activePads) {
    for (let i = 0; i < pad.buttons.length; i++) {
      const b = pad.buttons[i]
      if (!b) continue
      if (b.pressed) {
        mergedButtons[i].pressed = true
      }
      if (b.value > mergedButtons[i].value) {
        mergedButtons[i].value = b.value
      }
    }

    for (let i = 0; i < pad.axes.length; i++) {
      const a = pad.axes[i]
      if (typeof a !== 'number') continue
      if (Math.abs(a) > Math.abs(mergedAxes[i])) {
        mergedAxes[i] = a
      }
    }
  }

  return {
    connectedPadsCount: activePads.length,
    buttons: mergedButtons,
    axes: mergedAxes
  }
}
