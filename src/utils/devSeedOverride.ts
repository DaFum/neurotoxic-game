/**
 * Reads a `?seed=<n>` map-seed override from the current URL.
 *
 * @returns The override seed as a UInt32, or `null` when absent, unusable, or
 * when running a production build.
 *
 * @remarks
 * Inert in production regardless of URL content: players must not be able to
 * pick their own map. The override exists so a reported seed can be replayed in
 * dev and QA builds.
 */
export const getDevSeedOverride = (): number | null => {
  if (import.meta.env.PROD) return null
  if (typeof window === 'undefined') return null

  const raw = new URLSearchParams(window.location.search).get('seed')
  if (raw === null || raw.trim() === '') return null

  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return null

  return Math.trunc(parsed) >>> 0
}
