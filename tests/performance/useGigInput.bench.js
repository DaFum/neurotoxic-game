import { performance } from 'perf_hooks'

const RUNS = 1000000

function runBenchmark(lanesCount) {
  const KEYS = Array.from({ length: lanesCount + 5 }, (_, i) => `Key${i}`)

  const lanes = Array.from({ length: lanesCount }, (_, i) => ({
    id: `lane${i}`,
    key: `Key${i}`
  }))

  const gameStateRef = { current: { lanes } }

  const events = Array.from({ length: RUNS }, () => ({
    key: KEYS[Math.floor(Math.random() * KEYS.length)],
    repeat: false
  }))

  let _hits = 0
  const startCurrent = performance.now()
  for (let i = 0; i < RUNS; i++) {
    const e = events[i]
    if (e.repeat || e.key === 'Escape') continue

    const laneIndex = gameStateRef.current.lanes.findIndex(l => l.key === e.key)
    if (laneIndex !== -1) _hits++
  }
  const endCurrent = performance.now()
  const timeCurrent = endCurrent - startCurrent

  let cachedLanesArray = null
  let keyToLaneMap = new Map()

  const getLaneIndex = (key) => {
    const currentLanes = gameStateRef.current?.lanes
    if (currentLanes && currentLanes !== cachedLanesArray) {
      cachedLanesArray = currentLanes
      keyToLaneMap.clear()
      currentLanes.forEach((lane, index) => {
        if (lane.key) {
          keyToLaneMap.set(lane.key, index)
        }
      })
    }
    return keyToLaneMap.get(key)
  }

  let _hitsMap = 0
  const startMap = performance.now()
  for (let i = 0; i < RUNS; i++) {
    const e = events[i]
    if (e.repeat || e.key === 'Escape') continue

    const laneIndex = getLaneIndex(e.key)
    if (laneIndex !== undefined) _hitsMap++
  }
  const endMap = performance.now()
  const timeMap = endMap - startMap

  console.log(`\n--- N = ${lanesCount} ---`)
  console.log(`Current O(N): ${timeCurrent.toFixed(2)}ms`)
  console.log(`Optimized O(1): ${timeMap.toFixed(2)}ms`)
  console.log(`Improvement: ${(((timeCurrent - timeMap) / timeCurrent) * 100).toFixed(2)}%`)
}

runBenchmark(3)
runBenchmark(10)
runBenchmark(50)
