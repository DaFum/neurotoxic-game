import { isForbiddenKey } from '../objectUtils'

/**
 * Normalizes and bounds the regional gig history to prevent save corruption.
 * - Filters out unsafe/forbidden keys.
 * - Keeps max 100 regions.
 * - Keeps max 256 unique, positive integer days per region, sorted ascending.
 */
export const normalizeRegionalGigHistory = (
  history: unknown
): Record<string, number[]> => {
  if (typeof history !== 'object' || history === null) return {}

  const normalized: Record<string, number[]> = {}

  const record = history as Record<string, unknown>
  for (const regionId of Object.keys(record).slice(0, 100)) {
    if (!Object.hasOwn(record, regionId)) continue
    if (isForbiddenKey(regionId)) continue

    const days = record[regionId]
    if (!Array.isArray(days)) continue

    const validDays = days.filter(
      (day): day is number =>
        typeof day === 'number' &&
        Number.isFinite(day) &&
        Number.isInteger(day) &&
        day >= 0
    )

    normalized[regionId] = [...new Set(validDays)]
      .sort((left, right) => left - right)
      .slice(-256)
  }

  return normalized
}

/**
 * Appends a gig day to a region's history, bounding the total structure.
 */
export const appendToRegionalGigHistory = (
  history: Record<string, number[]> | undefined | null,
  regionId: string,
  day: number
): Record<string, number[]> => {
  const safeHistory = history ?? {}
  const currentDays = Array.isArray(safeHistory[regionId])
    ? safeHistory[regionId]
    : []

  return normalizeRegionalGigHistory({
    ...safeHistory,
    [regionId]: [...currentDays, day]
  })
}
