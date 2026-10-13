import { CHARACTERS } from '../../../data/characters'

export const isUnlocked = (val: unknown) => {
  if (typeof val === 'number') return val > 0
  if (typeof val === 'boolean') return val
  if (Array.isArray(val)) return val.length > 0
  return !!val
}

export const USABLE_BOOLEAN_INVENTORY_ITEMS = new Set([
  'strings',
  'cables',
  'drum_parts'
])

// Generate CHAR_MAP using a single pass loop to avoid intermediate array allocations
// from chained map/filter pipelines that run on module evaluation.
export const CHAR_MAP: Record<
  string,
  (typeof CHARACTERS)[keyof typeof CHARACTERS]
> = {}
for (const key in CHARACTERS) {
  if (Object.hasOwn(CHARACTERS, key)) {
    const c = CHARACTERS[key as keyof typeof CHARACTERS]
    if (c.name && c.role !== 'NPC') {
      CHAR_MAP[c.name] = c
    }
  }
}
