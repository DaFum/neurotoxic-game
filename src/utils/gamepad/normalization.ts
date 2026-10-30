/**
 * Plain Gamepad Snapshot Normalization.
 * Converts native DOM `Gamepad` objects into plain JavaScript objects.
 * Native `Gamepad` objects must never be stored in React state or persistent refs.
 */

export interface NormalizedButton {
  pressed: boolean
  value: number
}

export interface NormalizedGamepad {
  id: string
  index: number
  mapping: string
  connected: boolean
  buttons: NormalizedButton[]
  axes: number[]
}

/**
 * Normalizes a native Gamepad instance into a plain data snapshot.
 *
 * @param pad - Native Gamepad object or null.
 * @returns Plain NormalizedGamepad object or null.
 */
export function normalizeGamepad(pad: Gamepad | null): NormalizedGamepad | null {
  if (!pad) return null

  const buttons: NormalizedButton[] = []
  if (Array.isArray(pad.buttons) || (pad.buttons && typeof pad.buttons.length === 'number')) {
    for (let i = 0; i < pad.buttons.length; i++) {
      const btn = pad.buttons[i]
      if (typeof btn === 'number') {
        const val = Number.isFinite(btn) ? btn : 0
        buttons.push({ pressed: val > 0.5, value: val })
      } else if (btn && typeof btn === 'object') {
        const pressed = Boolean(btn.pressed)
        const val = typeof btn.value === 'number' && Number.isFinite(btn.value) ? btn.value : (pressed ? 1 : 0)
        buttons.push({ pressed, value: val })
      } else {
        buttons.push({ pressed: false, value: 0 })
      }
    }
  }

  const axes: number[] = []
  if (Array.isArray(pad.axes) || (pad.axes && typeof pad.axes.length === 'number')) {
    for (let i = 0; i < pad.axes.length; i++) {
      const ax = pad.axes[i]
      axes.push(typeof ax === 'number' && Number.isFinite(ax) ? ax : 0)
    }
  }

  return {
    id: typeof pad.id === 'string' ? pad.id : 'Gamepad',
    index: typeof pad.index === 'number' ? pad.index : 0,
    mapping: typeof pad.mapping === 'string' ? pad.mapping : '',
    connected: Boolean(pad.connected),
    buttons,
    axes
  }
}
