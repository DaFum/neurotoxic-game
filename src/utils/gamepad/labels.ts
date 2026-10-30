import type { LayoutFamily } from '../../types/gamepad'
export function gamepadButtonLabel(
  button: number,
  family: LayoutFamily,
  formatButton: (button: number) => string
): string {
  const face =
    family === 'playstation'
      ? ['✕', '○', '□', '△']
      : family === 'xbox'
        ? ['A', 'B', 'X', 'Y']
        : []
  if (face[button]) return face[button]
  if (button === 8 && family !== 'generic')
    return family === 'playstation' ? 'SHARE' : 'VIEW'
  if (button === 9) return family === 'playstation' ? 'OPTIONS' : '≡'
  return formatButton(button)
}
