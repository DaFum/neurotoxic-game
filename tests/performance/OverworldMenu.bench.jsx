import { bench, describe } from 'vitest'

describe('OverworldMenu activeCat find optimization', () => {
  const menuCategories = [
    { id: 'management' },
    { id: 'hustles' },
    { id: 'logistics' },
    { id: 'system' }
  ]
  const activeCat = 'system'

  bench('baseline: Array.prototype.find', () => {
    const _cat = menuCategories.find(c => c.id === activeCat)
  })

  // To simulate useMemo, we just calculate it. In React it wouldn't be calculated
  // again unless activeCat changes.
  const memoizedCat = menuCategories.find(c => c.id === activeCat)

  bench('optimized: useMemo find', () => {
    const _cat = memoizedCat
  })
})
