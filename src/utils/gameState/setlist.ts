import { hasTrait } from '../traitUtils'

import { EXPENSE_CONSTANTS } from '../economyEngine'

import { finiteNumberOr } from '../finiteNumber'

import { logger } from '../logger'

import { isForbiddenKey, isLooseRecord, safeJsonParse } from '../objectUtils'

import type {
  BandMember,
  GameState,
  RelationshipChange,
  StashEntry,
  EventDelta
} from '../../types'

/**
 * Normalizes an unknown setlist payload to an array of objects with an 'id' property.
 * @param setlist - The setlist payload to normalize.
 * @returns Normalized setlist.
 */
export const normalizeSetlistForSave = (
  setlist: unknown
): Array<{ id: string }> => {
  if (!Array.isArray(setlist)) return []

  const result: { id: string }[] = []
  for (const song of setlist) {
    if (typeof song === 'string') {
      result.push({ id: song })
    } else if (
      song &&
      typeof song === 'object' &&
      typeof (song as { id?: unknown }).id === 'string'
    ) {
      result.push({ id: (song as { id: string }).id })
    }
  }
  return result
}
