import type { SlotType } from '../../types/assets'

/**
 * Bandhaus tier-1 chassis slot types.
 */
export const BANDHAUS_T1_SLOTS = [
  'bh_stage',
  'bh_kitchen',
  'bh_sleeping'
] as const

/**
 * Bandhaus tier-2 chassis slot types, including tier-1 slots.
 */
export const BANDHAUS_T2_SLOTS = [
  ...BANDHAUS_T1_SLOTS,
  'bh_lounge',
  'bh_backyard'
] as const

/**
 * Bandhaus tier-3 chassis slot types, including lower-tier slots.
 */
export const BANDHAUS_T3_SLOTS = [
  ...BANDHAUS_T2_SLOTS,
  'bh_security',
  'bh_identity',
  'bh_secret'
] as const

// Bandhaus cross-section is a 3:4 portrait view. Y axis runs top→bottom:
// 0..0.15 = roof/front facade, 0.15..0.45 = upper floor, 0.45..0.75 = ground
// floor (incl. bh_backyard hanging out the right side), 0.75..0.95 = basement
// (bh_secret only ships with Tier 3 chassis). Zones are (centre x/y, w/h)
// normalised over the background. Partial typing is intentional — only
// Bandhaus slot types are populated.
/**
 * Bandhaus centered slot zones over the portrait cross-section background.
 */
export const BANDHAUS_SLOT_ZONES: Partial<
  Record<SlotType, { x: number; y: number; w: number; h: number }>
> = {
  bh_identity: { x: 0.5, y: 0.1, w: 0.8, h: 0.15 },
  bh_sleeping: { x: 0.3, y: 0.3, w: 0.4, h: 0.2 },
  bh_lounge: { x: 0.7, y: 0.3, w: 0.4, h: 0.2 },
  bh_stage: { x: 0.3, y: 0.55, w: 0.4, h: 0.2 },
  bh_kitchen: { x: 0.7, y: 0.55, w: 0.4, h: 0.2 },
  bh_backyard: { x: 0.93, y: 0.6, w: 0.14, h: 0.2 },
  bh_security: { x: 0.5, y: 0.78, w: 0.2, h: 0.1 },
  bh_secret: { x: 0.5, y: 0.88, w: 0.5, h: 0.1 }
}
