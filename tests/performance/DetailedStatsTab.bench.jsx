import { bench, describe } from 'vitest'
import { getCityKeyFromVenueId } from '../../src/utils/mapGenerator'

describe('DetailedStatsTab venueBlacklist optimization', () => {
  const venueBlacklist = Array.from(
    { length: 50 },
    (_, i) => `venue_${i}_DE_Berlin`
  )
  const reputationByRegion = {
    DE_Berlin: 100,
    DE_Hamburg: 50,
    DE_Munich: 20,
    UK_London: 150,
    US_NY: 80
  }

  bench('baseline: O(N) scan per row', () => {
    Object.entries(reputationByRegion).forEach(([region, rep]) => {
      const isBlacklisted = venueBlacklist.some(v => {
        const cityKey = getCityKeyFromVenueId(v)
        return cityKey !== '' && cityKey === region
      })
    })
  })

  bench('optimized: pre-computed Set', () => {
    const blacklistedCityKeys = new Set(
      venueBlacklist.map(v => getCityKeyFromVenueId(v)).filter(k => k !== '')
    )
    Object.entries(reputationByRegion).forEach(([region, rep]) => {
      const isBlacklisted = blacklistedCityKeys.has(region)
    })
  })
})
