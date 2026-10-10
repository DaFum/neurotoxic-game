import { CONTRABAND_BY_ID } from '../data/contraband'

/**
 * Decorative glyph for each contraband `icon` id in `src/data/contraband.ts`.
 * A test keeps every catalogue icon id covered.
 */
const CONTRABAND_ICON_GLYPHS = {
  icon_abyssal_pendant: '🧿',
  icon_ampoule: '💉',
  icon_amulet: '📿',
  icon_blood_pact: '📜',
  icon_blood_pick: '🩸',
  icon_bone_dust: '🦴',
  icon_coffee: '☕',
  icon_coin: '🪙',
  icon_compass: '🧭',
  icon_cursed_pick: '😈',
  icon_cursed_setlist: '📃',
  icon_glasses: '🥽',
  icon_gramophone: '📯',
  icon_grimoire_page: '📖',
  icon_implant: '🦾',
  icon_juice: '🧪',
  icon_manifest: '📋',
  icon_map: '🗺️',
  icon_mask: '🎭',
  icon_metronome: '⏱️',
  icon_mic: '🎤',
  icon_mold: '🍄',
  icon_overdrive: '🎛️',
  icon_patch: '🪡',
  icon_phantom_strings: '👻',
  icon_pills: '💊',
  icon_plectrum: '🎸',
  icon_program: '🗓️',
  icon_radiant_pick: '✨',
  icon_resonator: '🔔',
  icon_rusty_strings: '⛓️',
  icon_sticker: '🏷️',
  icon_synth: '🎹',
  icon_talisman: '👂',
  icon_tape: '📼',
  icon_tongue: '👅',
  icon_void_ash: '🌑',
  icon_void_energy: '⚡'
} as const satisfies Record<string, string>

/**
 * Resolves the decorative glyph for a stash item.
 *
 * @param itemId - Catalogue id of the item; its catalogue `icon` wins.
 * @param storedIcon - `icon` stored on the stash entry, used when the id is
 * not in the catalogue.
 * @returns The glyph, or `null` when no known icon id is found.
 */
export const getContrabandIconGlyph = (
  itemId: unknown,
  storedIcon: unknown
): string | null => {
  const catalogIcon =
    typeof itemId === 'string' ? CONTRABAND_BY_ID.get(itemId)?.icon : undefined
  const icon = catalogIcon ?? storedIcon
  return typeof icon === 'string' && Object.hasOwn(CONTRABAND_ICON_GLYPHS, icon)
    ? CONTRABAND_ICON_GLYPHS[icon as keyof typeof CONTRABAND_ICON_GLYPHS]
    : null
}
