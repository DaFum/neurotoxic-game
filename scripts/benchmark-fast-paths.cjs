async function benchmark() {
  const { pickRandomSubset } =
    await import('../src/utils/mapGenerator/mathUtils.ts')

  console.log('Benchmarking pickRandomSubset fast-paths...')

  // Deterministic LCG so the numbers measure pickRandomSubset, not the RNG.
  let seed = 0x2f6e2b1
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0x100000000
  }

  const smallArray = Array.from({ length: 100 }, (_, i) => i)
  const largeArray = Array.from({ length: 10000 }, (_, i) => i)

  const iterations = 100000

  console.time('pick 1 (small array)')
  for (let i = 0; i < iterations; i++) {
    pickRandomSubset(smallArray, 1, rng)
  }
  console.timeEnd('pick 1 (small array)')

  console.time('pick 2 (small array)')
  for (let i = 0; i < iterations; i++) {
    pickRandomSubset(smallArray, 2, rng)
  }
  console.timeEnd('pick 2 (small array)')

  console.time('pick sparse Fisher-Yates (small array, k=5)')
  for (let i = 0; i < iterations; i++) {
    pickRandomSubset(smallArray, 5, rng)
  }
  console.timeEnd('pick sparse Fisher-Yates (small array, k=5)')

  console.time('pick copy+partial (small array, k=50)')
  for (let i = 0; i < iterations; i++) {
    pickRandomSubset(smallArray, 50, rng)
  }
  console.timeEnd('pick copy+partial (small array, k=50)')

  console.time('pick 1 (large array)')
  for (let i = 0; i < iterations; i++) {
    pickRandomSubset(largeArray, 1, rng)
  }
  console.timeEnd('pick 1 (large array)')

  console.time('pick 2 (large array)')
  for (let i = 0; i < iterations; i++) {
    pickRandomSubset(largeArray, 2, rng)
  }
  console.timeEnd('pick 2 (large array)')

  console.time('pick sparse Fisher-Yates (large array, k=5)')
  for (let i = 0; i < iterations; i++) {
    pickRandomSubset(largeArray, 5, rng)
  }
  console.timeEnd('pick sparse Fisher-Yates (large array, k=5)')

  console.time('pick copy+partial (large array, k=5000)')
  for (let i = 0; i < iterations; i++) {
    pickRandomSubset(largeArray, 5000, rng)
  }
  console.timeEnd('pick copy+partial (large array, k=5000)')
}

benchmark()
