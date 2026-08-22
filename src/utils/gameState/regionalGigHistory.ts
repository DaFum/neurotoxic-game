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
  let processedCount = 0

  // ⚡ BOLT OPTIMIZATION: Replaced Object.keys() with for...in loop to avoid array allocation.
  // Replaced days.filter() with a procedural loop to avoid closure allocation.
  for (const regionId in record) {
    if (!Object.hasOwn(record, regionId)) continue

    // Maintain the 100 limit previously handled by .slice(0, 100)
    if (processedCount >= 100) break
    processedCount++

    if (isForbiddenKey(regionId)) continue

    const days = record[regionId]
    if (!Array.isArray(days)) continue

    const validDays = new Set<number>()
    for (let i = 0; i < days.length; i++) {
      const day = days[i]
      if (
        typeof day === 'number' &&
        Number.isFinite(day) &&
        Number.isInteger(day) &&
        day >= 1
      ) {
        validDays.add(day)
      }
    }

    normalized[regionId] = Array.from(validDays)
      .sort((left, right) => left - right)
      .slice(-256)
  }

  return normalized
}

const MAX_REGIONS = 100

const mostRecentDay = (days: number[]): number =>
  days.length > 0 ? (days[days.length - 1] as number) : -1

/**
 * Appends a gig day to a region's history, bounding the total structure.
 *
 * The appended region is always retained: when the history is already at the
 * region cap and `regionId` is new, the region whose last gig is oldest is
 * evicted, so the gig just played is never the one dropped.
 *
 * A forbidden `regionId` is dropped rather than recorded. `player.location` is
 * persisted and only loosely constrained, and `getRegionKeyForLocation` passes
 * `constructor` / `__proto__` through unchanged, so reading the entry with a
 * bare index would resolve an inherited `Object.prototype` value instead of
 * `undefined` and the spread below would throw mid post-gig resolution.
 */
export const appendToRegionalGigHistory = (
  history: Record<string, number[]> | undefined | null,
  regionId: string,
  day: number
): Record<string, number[]> => {
  const normalized = normalizeRegionalGigHistory(history ?? {})
  if (isForbiddenKey(regionId)) return normalized
  if (!Number.isFinite(day) || !Number.isInteger(day) || day < 1) {
    return normalized
  }

  const existing = Object.hasOwn(normalized, regionId)
    ? normalized[regionId]
    : undefined
  const currentDays = Array.isArray(existing) ? existing : []

  if (!Object.hasOwn(normalized, regionId)) {
    let regionCount = 0
    let stalestRegion = ''
    let oldestDay = Infinity

    // ⚡ BOLT OPTIMIZATION: Replaced Object.keys() and reduce() with for...in loop to avoid array and closure allocation.
    for (const id in normalized) {
      if (!Object.hasOwn(normalized, id)) continue
      regionCount++
      const recentDay = mostRecentDay(normalized[id] as number[])
      if (recentDay < oldestDay) {
        oldestDay = recentDay
        stalestRegion = id
      }
    }

    if (regionCount >= MAX_REGIONS && stalestRegion) {
      delete normalized[stalestRegion]
    }
  }

  return normalizeRegionalGigHistory({
    ...normalized,
    [regionId]: [...currentDays, day]
  })
}
