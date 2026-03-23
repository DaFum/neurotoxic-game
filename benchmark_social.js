import { calculateViralityScore } from './src/utils/socialEngine.js'

// Setup benchmark variables
const ITERATIONS = 1_000_000

// Create random test data
const performanceScores = Array.from({ length: 100 }, () => Math.random() * 100)
const eventsPool = [
  [],
  ['stage_diver'],
  ['influencer_spotted'],
  ['stage_diver', 'influencer_spotted'],
  ['some_other_event'],
  ['stage_diver', 'some_other_event', 'influencer_spotted']
]
const venuePool = [null, { name: 'Some Venue' }, { name: 'Kaminstube' }]
const bandStates = [
  {},
  { traits: { social_manager: true } },
  { traits: { showman: true } },
  { traits: { social_manager: true, showman: true } }
]

// Mock for bandHasTrait (since we aren't loading traitLogic.js correctly)
// Wait, we can just let it call it. Let's see if it works.

async function runBenchmark() {
  console.log('Warming up...')
  for (let i = 0; i < 10000; i++) {
    calculateViralityScore(80, ['stage_diver'], { name: 'Kaminstube' }, {})
  }

  console.log(`Running benchmark with ${ITERATIONS} iterations...`)
  const start = performance.now()

  for (let i = 0; i < ITERATIONS; i++) {
    const score = performanceScores[i % performanceScores.length]
    const events = eventsPool[i % eventsPool.length]
    const venue = venuePool[i % venuePool.length]
    const bandState = bandStates[i % bandStates.length]

    calculateViralityScore(score, events, venue, bandState)
  }

  const end = performance.now()
  console.log(`Total time: ${(end - start).toFixed(2)} ms`)
}

runBenchmark().catch(console.error)
