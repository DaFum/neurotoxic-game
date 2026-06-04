import type { SlotType } from '../../types/assets'

/**
 * Merch workshop tier-1 chassis slot types.
 */
export const WORKSHOP_T1_SLOTS = [
  'mw_print',
  'mw_drying',
  'mw_storage'
] as const

/**
 * Merch workshop tier-2 chassis slot types, including tier-1 slots.
 */
export const WORKSHOP_T2_SLOTS = [
  ...WORKSHOP_T1_SLOTS,
  'mw_cutting',
  'mw_packaging'
] as const

/**
 * Merch workshop tier-3 chassis slot types, including lower-tier slots.
 */
export const WORKSHOP_T3_SLOTS = [
  ...WORKSHOP_T2_SLOTS,
  'mw_specialty',
  'mw_sales',
  'mw_automation'
] as const

// Merch workshop uses a 21:9 production-line view. Zones are (centre x/y, w/h)
// normalised over the background: print → drying → cutting → packaging →
// storage along the conveyor, with specialty/automation attached above and
// sales as the right-side dispatch gate.
/**
 * Merch workshop centered slot zones over the wide production-line background.
 */
export const WORKSHOP_SLOT_ZONES: Partial<
  Record<SlotType, { x: number; y: number; w: number; h: number }>
> = {
  mw_print: { x: 0.1, y: 0.5, w: 0.15, h: 0.5 },
  mw_drying: { x: 0.28, y: 0.5, w: 0.12, h: 0.5 },
  mw_cutting: { x: 0.43, y: 0.5, w: 0.12, h: 0.5 },
  mw_packaging: { x: 0.58, y: 0.5, w: 0.12, h: 0.5 },
  mw_storage: { x: 0.73, y: 0.5, w: 0.12, h: 0.5 },
  mw_specialty: { x: 0.4, y: 0.15, w: 0.18, h: 0.2 },
  mw_automation: { x: 0.65, y: 0.15, w: 0.15, h: 0.2 },
  mw_sales: { x: 0.9, y: 0.5, w: 0.15, h: 0.8 }
}
