import { isFiniteNumber } from '../../../utils/gameState'

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

export const getStashStacks = (
  stash: Record<string, unknown> | undefined,
  itemId: string
): number => {
  if (!stash || !Object.hasOwn(stash, itemId)) return 0
  const entry = stash[itemId]
  if (!entry || typeof entry !== 'object') return 0
  const stacks = Object.hasOwn(entry as Record<string, unknown>, 'stacks')
    ? (entry as Record<string, unknown>).stacks
    : undefined
  // Stash entries are always contraband objects (never boolean-owned flags).
  // A null/absent `stacks` means a non-stackable item that is owned = 1 unit,
  // mirroring the reducer's getStashCount (the authority on craftability); this
  // is display-only affordability and must agree with that reducer count.
  return isFiniteNumber(stacks) ? Math.max(0, stacks) : 1
}
