const RUNS = 1000000
const BAND_SIZE = 4

const band = {
  members: Array.from({ length: BAND_SIZE }, (_, i) => ({
    name: `Member ${i}`,
    id: `m${i}`,
    traits: []
  }))
}

const diceRoll = 0.5

function currentImplementation(band, diceRoll) {
  const memberNames = band.members.map(m => m.name)
  const target = memberNames[Math.floor(diceRoll * memberNames.length)]
  return target
}

function optimizedImplementation(band, diceRoll) {
  const target = band.members[Math.floor(diceRoll * band.members.length)].name
  return target
}

console.log(
  `Running benchmark with band size ${BAND_SIZE} over ${RUNS} iterations...`
)

// Baseline
const startBaseline = performance.now()
for (let i = 0; i < RUNS; i++) {
  currentImplementation(band, diceRoll)
}
const endBaseline = performance.now()
const timeBaseline = endBaseline - startBaseline

console.log(`Current Implementation Total time: ${timeBaseline.toFixed(2)}ms`)

// Optimized
const startOptimized = performance.now()
for (let i = 0; i < RUNS; i++) {
  optimizedImplementation(band, diceRoll)
}
const endOptimized = performance.now()
const timeOptimized = endOptimized - startOptimized

console.log(
  `Optimized Implementation Total time: ${timeOptimized.toFixed(2)}ms`
)

const improvement = ((timeBaseline - timeOptimized) / timeBaseline) * 100
console.log(`Improvement: ${improvement.toFixed(2)}%`)
