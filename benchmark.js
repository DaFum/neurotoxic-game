import { performance } from 'perf_hooks'
import { MapGenerator } from './src/utils/mapGenerator.js'

function runBenchmark() {
  const seed = 12345
  const iterations = 1000
  const depth = 50 // Use a larger depth to amplify the O(N^2) behavior

  const gen = new MapGenerator(seed)

  // Warm up
  for (let i = 0; i < 100; i++) {
    gen.generateMap(10)
  }

  const start = performance.now()
  for (let i = 0; i < iterations; i++) {
    gen.generateMap(depth)
  }
  const end = performance.now()

  const timeMs = end - start
  console.log(`Time taken for ${iterations} maps at depth ${depth}: ${timeMs.toFixed(2)} ms`)
  console.log(`Average time per map: ${(timeMs / iterations).toFixed(2)} ms`)
}

runBenchmark()
