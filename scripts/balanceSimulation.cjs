// Dev-only balance simulation runner.
// Usage: node --import tsx/cjs scripts/balanceSimulation.cjs [--tours N] [--days N]

const { calculateGigFinancials } = require('../src/utils/economyEngine.ts')
const { calculateFameGain, clampPlayerMoney, clampBandHarmony } = require('../src/utils/gameStateUtils.ts')
const { calculateSocialGrowth } = require('../src/utils/socialEngine.ts')
const { logger, LOG_LEVELS } = require('../src/utils/logger.ts')

// Silence engine logs so only the summary table is printed
logger.setLevel(LOG_LEVELS.NONE)

function parsePositiveIntArg(flag, fallback) {
  const idx = process.argv.indexOf(flag)
  const raw = idx !== -1 ? process.argv[idx + 1] : undefined
  if (idx !== -1 && raw === undefined) {
    throw new Error(`${flag} requires a value`)
  }
  const value = raw === undefined ? fallback : Number(raw)
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${flag} must be a positive integer (got: ${JSON.stringify(raw)})`)
  }
  return value
}

const TOURS = parsePositiveIntArg('--tours', 100)
const DAYS_PER_TOUR = parsePositiveIntArg('--days', 30)

const PLAYSTYLES = {
  conservative:    { perfMean: 70, perfVariance: 10, socialActivity: 0.3, spendMultiplier: 0.7 },
  aggressive:      { perfMean: 55, perfVariance: 25, socialActivity: 0.9, spendMultiplier: 1.3 },
  highControversy: { perfMean: 65, perfVariance: 15, socialActivity: 1.0, spendMultiplier: 1.0, controversyBias: 30 },
  noSocial:        { perfMean: 72, perfVariance: 8,  socialActivity: 0.0, spendMultiplier: 0.9 },
}

function randomNormal(mean, variance) {
  const u1 = 1 - Math.random()
  const u2 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return Math.max(0, Math.min(100, mean + z * Math.sqrt(variance)))
}

function makeInitialState() {
  return {
    money: 500,
    fame: 100,
    harmony: 75,
    followers: 0,
    controversy: 10,
    vanCondition: 80,
    vanFuel: 80,
    day: 1,
    bankruptcyCount: 0,
  }
}

function simulateTour(playstyle) {
  const s = makeInitialState()
  const { perfMean, perfVariance, socialActivity, spendMultiplier, controversyBias = 0 } = playstyle

  for (let d = 0; d < DAYS_PER_TOUR; d++) {
    const perf = randomNormal(perfMean, perfVariance)

    // Gig every 2 days
    if (d % 2 === 0) {
      try {
        const gigData = { capacity: 100, price: 10 }
        const financials = calculateGigFinancials({
          gigData,
          performanceScore: perf,
          modifiers: {},
          bandInventory: {},
          playerState: { fame: s.fame },
          gigStats: {},
          context: {}
        })
        const net = financials.income.total - financials.expenses.total * spendMultiplier
        s.money = clampPlayerMoney(s.money + net)

        // calculateFameGain returns the delta; add it to current fame
        const fameGain = calculateFameGain(perf * 0.5, s.fame)
        s.fame = Math.max(0, s.fame + fameGain)

        if (s.money <= 0) s.bankruptcyCount++
      } catch (err) {
        console.error(`[Gig Simulation Error] Day ${d}:`, err instanceof Error ? err.message : String(err))
      }
    }

    // Social
    if (Math.random() < socialActivity) {
      try {
        const controversyInput = Math.max(0, Math.min(100, s.controversy + controversyBias))
        const growth = calculateSocialGrowth('instagram', perf, s.followers, false, controversyInput, 50)
        s.followers = Math.max(0, s.followers + growth)
        s.controversy = Math.max(0, Math.min(100, s.controversy + (controversyBias > 0 ? 2 : -0.5)))
      } catch (err) {
        console.error(`[Social Simulation Error] Day ${d}:`, err instanceof Error ? err.message : String(err))
      }
    }

    // Daily decay
    s.harmony = clampBandHarmony(s.harmony - 0.3)
    s.vanCondition = Math.max(0, s.vanCondition - 0.5)
    s.day++
  }

  return s
}

function runBatch(playstyleName, playstyle) {
  const finals = []
  for (let t = 0; t < TOURS; t++) {
    finals.push(simulateTour(playstyle))
  }
  const avg = key => finals.length ? finals.reduce((sum, f) => sum + (f[key] || 0), 0) / finals.length : 0
  const pct = (key, threshold) => (finals.filter(f => f[key] >= threshold).length / finals.length * 100).toFixed(1) + '%'

  return {
    style: playstyleName,
    avgMoney: avg('money').toFixed(0),
    avgFame: avg('fame').toFixed(0),
    avgFollowers: avg('followers').toFixed(0),
    avgHarmony: avg('harmony').toFixed(1),
    bankruptcyRate: pct('bankruptcyCount', 1),
    richRate: pct('money', 2000),
  }
}

console.log(`\nBalance Simulation — ${TOURS} tours × ${DAYS_PER_TOUR} days\n`)
console.log('Style            | AvgMoney | AvgFame | AvgFollowers | AvgHarmony | Bankruptcy% | Rich%')
console.log('-----------------|----------|---------|--------------|------------|-------------|------')

for (const [name, style] of Object.entries(PLAYSTYLES)) {
  const r = runBatch(name, style)
  console.log(
    `${r.style.padEnd(16)} | ${String(r.avgMoney).padStart(8)} | ${String(r.avgFame).padStart(7)} | ${String(r.avgFollowers).padStart(12)} | ${String(r.avgHarmony).padStart(10)} | ${r.bankruptcyRate.padStart(11)} | ${r.richRate}`
  )
}

console.log('\nBalance concerns to watch:')
console.log('  - If bankruptcyRate > 40% for any style, economy is too punishing.')
console.log('  - If richRate > 60% for conservative, economy is too rewarding.')
console.log('  - If avgHarmony < 20 after 30 days, harmony decay is too fast.')
console.log('  - If noSocial richRate >> conservative richRate, social is irrelevant.')
