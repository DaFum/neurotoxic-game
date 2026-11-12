import type { LayoutFamily } from '../../types/gamepad'
/**
 * Resolves the display label for a specific gamepad button based on the active controller family.
 *
 * @param button - The numeric index of the gamepad button to label.
 * @param family - The controller layout family to use for glyph mapping.
 * @param formatButton - A fallback formatting function invoked if the button is not handled by standard face mappings or explicit menu button mappings. Button 8 returns 'SHARE' (playstation) or 'VIEW' (xbox) natively but falls back to this function for the generic family; button 9 returns 'OPTIONS' (playstation) or '≡' (all other families) natively.
 * @returns The localized display label or glyph for the button.
 */
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
