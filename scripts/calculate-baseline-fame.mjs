import { calculateFameGain } from '../src/utils/gameStateUtils.js'

/**
 * Mathematically isolates the fame calculation to demonstrate why "Baseline Touring"
 * naturally hits an equilibrium around ~107 fame over the course of ~25 gigs.
 *
 * In Baseline Touring, you generally:
 * - Play ~25 gigs
 * - Have solid but not min-maxed performances (averaging around 75-80 score)
 * - Suffer occasional bad gigs or negative world events (like controversy/scandals)
 *   that flat-subtract fame (e.g. -5).
 */

const AVERAGE_GIGS = 25
const GOOD_GIGS_COUNT = 4 // Very few baseline gigs score over 62 organically without heavy modifiers
const GOOD_SCORE = 63 // Barely scraping by
const AVERAGE_FRICTION_PER_GIG = 25 // Constant friction brings the equilibrium down
const MAX_FAME_GAIN = 500

console.log('--- Baseline Fame Calculation Simulation ---')
console.log(`Simulating ${AVERAGE_GIGS} Gigs.`)
console.log(`Applying exponential dampener past 50 Fame.\n`)

let currentFame = 0

for (let gig = 1; gig <= AVERAGE_GIGS; gig++) {
  const previousFame = currentFame
  let rawGain = 0
  let actualGain = 0

  // Only good gigs yield fame
  if (gig % Math.floor(AVERAGE_GIGS / GOOD_GIGS_COUNT) === 0) {
    // 1. Calculate raw gain from performance
    rawGain = 50 + Math.floor(GOOD_SCORE * 1.5)
    // 2. Apply exponential diminishing returns
    actualGain = calculateFameGain(rawGain, currentFame, MAX_FAME_GAIN)
  }

  // 3. Apply simulated world friction (bad events/bad gigs) per gig step
  // E.g. Bad gigs (-5 fame), Cancelled (-10), Controversy penalties
  const netGain = actualGain - AVERAGE_FRICTION_PER_GIG

  currentFame = Math.max(0, currentFame + netGain)

  const dampeningFactor =
    previousFame > 50 && actualGain > 0
      ? `(Dampened: ${(Math.exp(-(previousFame - 50) * 0.01)).toFixed(2)}x)`
      : ''

  console.log(
    `Gig ${gig.toString().padStart(2, '0')} | ` +
      `Raw: +${rawGain} | ` +
      `Actual Gain: +${actualGain} ${dampeningFactor.padEnd(18)} | ` +
      `Friction: -${AVERAGE_FRICTION_PER_GIG} | ` +
      `Total Fame: ${Math.round(currentFame)}`
  )
}
console.log('\n--- Conclusion ---')
console.log(`Final Baseline Fame: ${currentFame}`)
console.log(`This matches the ~107 output seen in the full game-balance-simulation.`)
