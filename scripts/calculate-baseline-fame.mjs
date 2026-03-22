import { calculateFameGain } from '../src/utils/gameStateUtils.js'

/**
 * Mathematically isolates and logs the fame calculation, demonstrating the true
 * "Baseline Touring" experience an actual player would see.
 */

const TARGET_DAYS = 75 // The typical length of a complete game simulation run
const MAX_FAME_GAIN = 500
const FLAT_FAME_PENALTY_PER_BAD_GIG = 5

console.log('--- NEUROTOXIC: 75-Day Baseline Tour Simulation ---')
console.log(`Simulating ${TARGET_DAYS} Days of Player Actions.\n`)

// Initialize typical starting stats for a player
let state = {
  day: 1,
  fame: 0,
  gigsPlayed: 0,
  band: {
    harmony: 80,
    mood: 80,
    stamina: 100
  }
}

// Helpers
const clamp = (val, min, max) => Math.max(min, Math.min(max, val))

while (state.day <= TARGET_DAYS) {
  // In the game, advancing a day (traveling) costs 1 day.
  // Playing a gig happens on the SAME day after traveling.
  state.day += 1

  // Determine Condition Text BEFORE taking an action
  let conditionStr = 'Ready to rock'
  if (state.band.stamina < 30) conditionStr = 'Exhausted'
  else if (state.band.mood < 40) conditionStr = 'Stressed'
  else if (state.band.harmony < 30) conditionStr = 'Infighting'

  // Simulated human player 'Resting' behavior:
  // If the band is exhausted or infighting, a human will typically use items/visit clinic
  // or spend the day hanging out instead of playing a gig.
  if (state.band.stamina < 30 || state.band.harmony < 30) {
    console.log(`[Day ${state.day.toString().padStart(2, '0')}] Action: Rest / Use Items | Condition: ${conditionStr.padEnd(14)}`)

    // Resting/Items recovers stats
    state.band.stamina = clamp(state.band.stamina + 40, 0, 100)
    state.band.mood = clamp(state.band.mood + 30, 0, 100)
    state.band.harmony = clamp(state.band.harmony + 15, 0, 100)

    // Time passing without a gig triggers Reputation Decay
  const decayAmount = 45 // High daily decay and opportunity cost when resting instead of playing
    state.fame = Math.max(0, state.fame - decayAmount)
    console.log(`          > Time Passes: Fame Decay -${decayAmount} | Total Fame: ${Math.round(state.fame)}`)

    // Proceed to next day without a gig
    continue
  }

  // Travel fatigue applied right before gig
  state.band.stamina = clamp(state.band.stamina - 15, 0, 100)
  state.band.mood = clamp(state.band.mood - 10, 0, 100)

  // A human player performs well consistently unless the band is broken
let score = 65 + Math.floor(Math.random() * 8) - 4 // Normal baseline score when playing this frequently (avg ~65)
  if (state.band.harmony < 15) {
      score = 45 // Score drops even for humans if the band is completely broken (jitter penalty)
  }
  score = clamp(score, 5, 100)

  const previousFame = state.fame
  let fameDelta = 0
  let outcomeText = ''

  if (score >= 62) {
    // Good Gig
    const rawGain = 50 + Math.floor(score * 1.5)
    fameDelta = calculateFameGain(rawGain, state.fame, MAX_FAME_GAIN)

    // Rewards
    state.band.harmony = clamp(state.band.harmony + 2, 0, 100)
    state.band.mood = clamp(state.band.mood + 2, 0, 100)
    state.band.stamina = clamp(state.band.stamina - 8, 0, 100) // Drains less if good

    const dampFactor = previousFame > 50
      ? `(Dampened: ${(Math.exp(-(previousFame - 50) * 0.01)).toFixed(2)}x)`
      : ''
    outcomeText = `Good Show! Fame +${fameDelta} ${dampFactor}`
  } else {
    // Bad Gig
    fameDelta = -FLAT_FAME_PENALTY_PER_BAD_GIG

    // Penalties
    state.band.harmony = clamp(state.band.harmony - 5, 0, 100)
    state.band.mood = clamp(state.band.mood - 3, 0, 100)
    state.band.stamina = clamp(state.band.stamina - 10, 0, 100)

    outcomeText = `Bad Show... Fame ${fameDelta}`
  }

  // Even a human player cannot prevent the band from cancelling the show
  // if harmony drops to critically low levels due to exhaustion and random events.
  if (state.band.harmony < 15 && Math.random() < 0.25) {
    fameDelta = -(FLAT_FAME_PENALTY_PER_BAD_GIG * 2)
    outcomeText = `CANCELLED! Harmony too low. Fame ${fameDelta}`
    score = 0
  }

  state.gigsPlayed++

  // Update Fame
  state.fame = Math.max(0, state.fame + fameDelta)

  console.log(`[Day ${state.day.toString().padStart(2, '0')}] Action: Play Gig ${state.gigsPlayed.toString().padStart(2, '0')}     | Condition: ${conditionStr.padEnd(14)} | Score: ${score.toString().padStart(2, ' ')} | ${outcomeText.padEnd(45)} | Total Fame: ${Math.round(state.fame)}`)

  // Random negative world event simulating "Friction" (controversy, bad PR)
  if (Math.random() < 0.15) { // Occurs occasionally per day
    const eventFameLoss = 15
    state.fame = Math.max(0, state.fame - eventFameLoss)
    console.log(`          > Event: Social Media Controversy / Bad PR! Fame -${eventFameLoss} | Total Fame: ${Math.round(state.fame)}`)
  }
}

console.log('\n--- End of Tour ---')
console.log(`Final Fame: ${state.fame}`)
console.log(`Total Gigs Played: ${state.gigsPlayed}`)
console.log(`Final Harmony: ${state.band.harmony} | Mood: ${state.band.mood} | Stamina: ${state.band.stamina}`)
