import type { SlotType } from '../../types/assets'

/**
 * Tourbus tier-1 chassis slot types.
 */
export const TOURBUS_T1_SLOTS = [
  'tb_roof',
  'tb_front',
  'tb_interior_driver',
  'tb_audio'
] as const

/**
 * Tourbus tier-2 chassis slot types, including tier-1 slots.
 */
export const TOURBUS_T2_SLOTS = [
  ...TOURBUS_T1_SLOTS,
  'tb_side',
  'tb_interior_cabin'
] as const

/**
 * Tourbus tier-3 chassis slot types, including lower-tier slots.
 */
export const TOURBUS_T3_SLOTS = [
  ...TOURBUS_T2_SLOTS,
  'tb_decal',
  'tb_trailer_mount'
] as const

// Positions are normalized 0..1 over the 16:9 background image.
// tb_trailer_addon uses negative-x because it occupies the trailer overlay area to the left.
// Partial<Record<…>> is intentional — callers must handle undefined for unlisted slots.
/**
 * Tourbus slot hotspot positions over the 16:9 vehicle background.
 */
export const TOURBUS_SLOT_POSITIONS: Partial<
  Record<SlotType, { x: number; y: number }>
> = {
  tb_roof: { x: 0.5, y: 0.18 },
  tb_front: { x: 0.85, y: 0.55 },
  tb_side: { x: 0.55, y: 0.45 },
  tb_interior_driver: { x: 0.7, y: 0.55 },
  tb_interior_cabin: { x: 0.35, y: 0.5 },
  tb_audio: { x: 0.45, y: 0.65 },
  tb_decal: { x: 0.5, y: 0.8 },
  tb_trailer_mount: { x: 0.1, y: 0.6 },
  tb_trailer_addon: { x: -0.15, y: 0.5 }
}
