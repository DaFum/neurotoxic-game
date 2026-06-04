import type { SlotType } from '../../types/assets'

/**
 * Studio tier-1 chassis slot types.
 */
export const STUDIO_T1_SLOTS = [
  'st_control',
  'st_mic',
  'st_monitoring'
] as const

/**
 * Studio tier-2 chassis slot types, including tier-1 slots.
 */
export const STUDIO_T2_SLOTS = [
  ...STUDIO_T1_SLOTS,
  'st_outboard',
  'st_treatment'
] as const

/**
 * Studio tier-3 chassis slot types, including lower-tier slots.
 */
export const STUDIO_T3_SLOTS = [
  ...STUDIO_T2_SLOTS,
  'st_software',
  'st_vibe',
  'st_iso'
] as const

// Studio floorplan uses zone rectangles instead of point hotspots:
// x/y is the centre, w/h is the rectangle size (all normalised 0..1 over
// the 4:3 background image). The Partial typing is intentional — callers
// must guard `undefined` (only Studio slot types are populated here).
/**
 * Studio centered slot zones over the 4:3 floorplan background.
 */
export const STUDIO_SLOT_ZONES: Partial<
  Record<SlotType, { x: number; y: number; w: number; h: number }>
> = {
  st_control: { x: 0.5, y: 0.55, w: 0.3, h: 0.2 },
  st_mic: { x: 0.2, y: 0.3, w: 0.15, h: 0.2 },
  st_monitoring: { x: 0.5, y: 0.3, w: 0.2, h: 0.1 },
  st_outboard: { x: 0.8, y: 0.55, w: 0.15, h: 0.25 },
  st_treatment: { x: 0.5, y: 0.1, w: 0.6, h: 0.12 },
  st_software: { x: 0.2, y: 0.7, w: 0.2, h: 0.15 },
  st_vibe: { x: 0.8, y: 0.85, w: 0.2, h: 0.2 },
  st_iso: { x: 0.1, y: 0.85, w: 0.2, h: 0.25 }
}
