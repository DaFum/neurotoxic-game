import { calculateFameGain, BALANCE_CONSTANTS } from '../src/utils/gameStateUtils.js'

/**
 * Mathematically isolates and logs the fame calculation, demonstrating the true
 * "Baseline Touring" experience an actual player would see.
 *
 * Economic model (simplified, matching game constants):
 *   - Daily living cost: €64 / day (EXPENSE_CONSTANTS.DAILY.BASE_COST + 3 members × €8)
 *   - Clinic / rest cost: €150 per visit
 *   - Gig net income: tiered by fame / venue difficulty (post-merch-depletion estimate)
 *       fame < 60  → diff-2 venues (~€350 net after travel + modifier costs)
 *       fame < 200 → diff-3 venues (~€1,200 net)
 *       fame ≥ 200 → diff-4 venues (~€4,500 net)
 */

const TARGET_DAYS = 75 // The typical length of a complete game simulation run
const MAX_FAME_GAIN = 500
const FLAT_FAME_PENALTY_PER_BAD_GIG = BALANCE_CONSTANTS.FAME_LOSS_BAD_GIG
const DAILY_COST = 64   // matches EXPENSE_CONSTANTS.DAILY.BASE_COST + 3 members × 8
const CLINIC_COST = 150 // matches simulation clinic visit cost

// Initialize typical starting stats for a player
let state = {
  day: 1,
  fame: 0,
  money: 500,
  gigsPlayed: 0,
  band: {
    harmony: 80,
    mood: 80,
    stamina: 100
  }
}

// Helpers
const clamp = (val, min, max) => Math.max(min, Math.min(max, val))

/**
 * Returns estimated net gig income by venue difficulty tier.
 * Figures represent tickets + bar cut after travel and PreGig modifier costs,
 * and assume merch inventory has run dry after the first few gigs.
 */
const estimateGigNet = fame => {
  if (fame >= 200) return 4500  // diff-4: ~700-cap venue, €20 ticket, ~40% fill
  if (fame >= 60)  return 1200  // diff-3: ~321-cap venue, €14 ticket, ~40% fill
  return 350                    // diff-2: ~185-cap venue, €6 ticket, ~30% fill
}

console.log('--- NEUROTOXIC: 75-Day Baseline Tour Simulation ---')
console.log(`Simulating ${TARGET_DAYS} Days of Player Actions.\n`)
console.log('Day'.padEnd(7) + 'Action'.padEnd(32) + 'Condition'.padEnd(16) +
  'Score'.padEnd(7) + 'Outcome'.padEnd(46) + 'Fame'.padEnd(8) + 'Money')

while (state.day <= TARGET_DAYS) {
  // Advancing a day costs 1 day. Playing a gig happens on the SAME day after traveling.
  state.day += 1

  // Apply daily living cost
  state.money = Math.max(0, state.money - DAILY_COST)

  // Determine Condition Text BEFORE taking an action
  let conditionStr = 'Ready to rock'
  if (state.band.stamina < 30) conditionStr = 'Exhausted'
  else if (state.band.mood < 40) conditionStr = 'Stressed'
  else if (state.band.harmony < 30) conditionStr = 'Infighting'

  // Simulated human player 'Resting' behavior:
  // If the band is exhausted or infighting, a human will typically visit the clinic.
  if (state.band.stamina < 30 || state.band.harmony < 30) {
    // Clinic costs €150; if broke, band rests for free but recovers less
    const canAffordClinic = state.money >= CLINIC_COST
    const recoveryLabel = canAffordClinic ? 'Clinic Visit' : 'Free Rest   '

    if (canAffordClinic) {
      state.money -= CLINIC_COST
      state.band.stamina  = clamp(state.band.stamina  + 40, 0, 100)
      state.band.mood     = clamp(state.band.mood     + 30, 0, 100)
      state.band.harmony  = clamp(state.band.harmony  + 15, 0, 100)
    } else {
      // Reduced recovery without paid care
      state.band.stamina  = clamp(state.band.stamina  + 20, 0, 100)
      state.band.mood     = clamp(state.band.mood     + 10, 0, 100)
      state.band.harmony  = clamp(state.band.harmony  +  5, 0, 100)
    }

    console.log(
      `[Day ${state.day.toString().padStart(2, '0')}] ` +
      `${recoveryLabel.padEnd(30)} | ` +
      `${conditionStr.padEnd(14)} | ` +
      `     | ` +
      `${'(skipped gig)'.padEnd(44)} | ` +
      `${Math.round(state.fame).toString().padStart(5)} | ` +
      `€${state.money}`
    )

    continue
  }

  // Travel fatigue applied right before gig
  state.band.stamina = clamp(state.band.stamina - 15, 0, 100)
  state.band.mood    = clamp(state.band.mood    - 10, 0, 100)

  // A human player performs well consistently unless the band is broken
  let score = 65 + Math.floor(Math.random() * 8) - 4 // avg ~65, range 61-68
  if (state.band.harmony < 15) {
    score = 45 // Score drops when harmony is critically low (noteJitter penalty)
  }
  score = clamp(score, 5, 100)

  const previousFame = state.fame
  let fameDelta = 0
  let outcomeText = ''

  // Good gig threshold aligns with applyPostGigState in game-balance-simulation.mjs
  if (score >= 78) {
    // Great Gig — harmony reward
    const rawGain = 50 + Math.floor(score * 1.5)
    fameDelta = calculateFameGain(rawGain, state.fame, MAX_FAME_GAIN)

    state.band.harmony = clamp(state.band.harmony + 2, 0, 100)
    state.band.mood    = clamp(state.band.mood    + 2, 0, 100)
    state.band.stamina = clamp(state.band.stamina - 8, 0, 100)

    const dampFactor = previousFame > 50
      ? `(Dampened: ${(Math.exp(-(previousFame - 50) * 0.01)).toFixed(2)}x)`
      : ''
    outcomeText = `Great Show! Fame +${fameDelta} ${dampFactor}`
  } else if (score >= 62) {
    // Decent Gig — fame gain, no harmony bonus
    const rawGain = 50 + Math.floor(score * 1.5)
    fameDelta = calculateFameGain(rawGain, state.fame, MAX_FAME_GAIN)

    state.band.mood    = clamp(state.band.mood    + 1, 0, 100)
    state.band.stamina = clamp(state.band.stamina - 8, 0, 100)

    const dampFactor = previousFame > 50
      ? `(Dampened: ${(Math.exp(-(previousFame - 50) * 0.01)).toFixed(2)}x)`
      : ''
    outcomeText = `Decent Show  Fame +${fameDelta} ${dampFactor}`
  } else {
    // Bad Gig
    fameDelta = -FLAT_FAME_PENALTY_PER_BAD_GIG

    state.band.harmony = clamp(state.band.harmony - 5, 0, 100)
    state.band.mood    = clamp(state.band.mood    - 3, 0, 100)
    state.band.stamina = clamp(state.band.stamina - 10, 0, 100)

    outcomeText = `Bad Show...  Fame ${fameDelta}`
  }

  // Show cancellation if harmony is critically low
  if (state.band.harmony < 15 && Math.random() < BALANCE_CONSTANTS.LOW_HARMONY_CANCELLATION_CHANCE) {
    fameDelta = -(FLAT_FAME_PENALTY_PER_BAD_GIG * 2)
    outcomeText = `CANCELLED! Harmony too low. Fame ${fameDelta}`
    score = 0
  }

  state.gigsPlayed++
  state.fame = Math.max(0, state.fame + fameDelta)

  // Add estimated gig income
  const gigNet = estimateGigNet(previousFame)
  state.money += gigNet

  console.log(
    `[Day ${state.day.toString().padStart(2, '0')}] ` +
    `Gig ${state.gigsPlayed.toString().padStart(2, '0')}`.padEnd(30) + ` | ` +
    `${conditionStr.padEnd(14)} | ` +
    `${score.toString().padStart(3)}  | ` +
    `${outcomeText.padEnd(44)} | ` +
    `${Math.round(state.fame).toString().padStart(5)} | ` +
    `€${state.money} (+€${gigNet})`
  )

  // Random world friction event (controversy, bad PR)
  if (Math.random() < 0.15) {
    const eventFameLoss = 15
    state.fame = Math.max(0, state.fame - eventFameLoss)
    console.log(`          > Event: Bad PR! Fame -${eventFameLoss} | Total Fame: ${Math.round(state.fame)}`)
  }
}

console.log('\n--- End of Tour ---')
console.log(`Final Fame:      ${Math.round(state.fame)}`)
console.log(`Final Money:     €${state.money}`)
console.log(`Total Gigs:      ${state.gigsPlayed}`)
console.log(`Final Harmony:   ${state.band.harmony} | Mood: ${state.band.mood} | Stamina: ${state.band.stamina}`)
