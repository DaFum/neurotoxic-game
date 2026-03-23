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
const eventsPoolSet = eventsPool.map(arr => new Set(arr))
const venuePool = [null, { name: 'Some Venue' }, { name: 'Kaminstube' }]
const bandStates = [
  { members: [] },
  { members: [{ traits: { social_manager: { id: 'social_manager' } } }] },
  { members: [{ traits: { showman: { id: 'showman' } } }] },
  { members: [{ traits: { social_manager: { id: 'social_manager' }, showman: { id: 'showman' } } }] }
]

async function runBenchmark() {
  console.log('Warming up (Array)...')
  for (let i = 0; i < 10000; i++) {
    const score = performanceScores[i % performanceScores.length]
    const events = eventsPool[i % eventsPool.length]
    const venue = venuePool[i % venuePool.length]
    const bandState = bandStates[i % bandStates.length]

    calculateViralityScore(score, events, venue, bandState)
  }

  console.log(`Running benchmark with ${ITERATIONS} iterations (Array inputs)...`)
  const startArray = performance.now()

  for (let i = 0; i < ITERATIONS; i++) {
    const score = performanceScores[i % performanceScores.length]
    const events = eventsPool[i % eventsPool.length]
    const venue = venuePool[i % venuePool.length]
    const bandState = bandStates[i % bandStates.length]

    calculateViralityScore(score, events, venue, bandState)
  }

  const endArray = performance.now()
  console.log(`Total time (Array): ${(endArray - startArray).toFixed(2)} ms`)

  console.log('Warming up (Set)...')
  for (let i = 0; i < 10000; i++) {
    const score = performanceScores[i % performanceScores.length]
    const events = eventsPoolSet[i % eventsPoolSet.length]
    const venue = venuePool[i % venuePool.length]
    const bandState = bandStates[i % bandStates.length]

    calculateViralityScore(score, events, venue, bandState)
  }

  console.log(`Running benchmark with ${ITERATIONS} iterations (Set inputs)...`)
  const startSet = performance.now()

  for (let i = 0; i < ITERATIONS; i++) {
    const score = performanceScores[i % performanceScores.length]
    const events = eventsPoolSet[i % eventsPoolSet.length]
    const venue = venuePool[i % venuePool.length]
    const bandState = bandStates[i % bandStates.length]

    calculateViralityScore(score, events, venue, bandState)
  }

  const endSet = performance.now()
  console.log(`Total time (Set): ${(endSet - startSet).toFixed(2)} ms`)
}

runBenchmark().catch(console.error)
