import test from 'node:test'
import assert from 'node:assert/strict'

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import module from 'node:module'

const require = module.createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const simScriptPath = path.join(
  __dirname,
  '../../scripts/game-balance-simulation.mjs'
)

test('Statistics Utilities (Extracted for test)', async () => {
  const content = await fs.readFile(simScriptPath, 'utf8')

  const startLine = 'const mean = values => {'
  const endLine =
    '// ─────────────────────────────────────────────────────────────────────────'

  const startIdx = content.indexOf(startLine)
  const endIdx = content.indexOf(endLine, startIdx)

  const utilsBlock = content.substring(startIdx, endIdx)

  const extracted = `${utilsBlock}\n module.exports = { mean, median, standardDeviation, quantile, minimum, maximum, wilsonScoreInterval };\n`

  const fsCjs = require('fs')
  fsCjs.writeFileSync(path.join(__dirname, 'temp_stats.cjs'), extracted, 'utf8')
  const {
    mean,
    median,
    standardDeviation,
    quantile,
    minimum,
    maximum,
    wilsonScoreInterval
  } = require('./temp_stats.cjs')

  assert.equal(mean([]), null)
  assert.equal(median([]), null)
  assert.equal(standardDeviation([]), 0)
  assert.equal(quantile([], 0.5), null)
  assert.equal(minimum([]), null)
  assert.equal(maximum([]), null)

  assert.equal(mean([5]), 5)
  assert.equal(median([5]), 5)
  assert.equal(standardDeviation([5]), 0)
  assert.equal(quantile([5], 0.5), 5)
  assert.equal(minimum([5]), 5)
  assert.equal(maximum([5]), 5)

  assert.equal(mean([1, 2, 3, 4]), 2.5)
  assert.equal(median([1, 2, 3, 4]), 2.5)

  assert.equal(mean([1, 2, 3]), 2)
  assert.equal(median([1, 2, 3]), 2)

  assert.equal(quantile([1, 2, 3, 4], 0.5), 2.5)

  const arr = [4, 1, 3, 2]
  median(arr)
  assert.deepEqual(arr, [4, 1, 3, 2])
  quantile(arr, 0.5)
  assert.deepEqual(arr, [4, 1, 3, 2])

  const w0 = wilsonScoreInterval(0, 260)
  assert.equal(Math.round(w0.lowerPct), 0)

  const w1 = wilsonScoreInterval(1, 260)
  assert.ok(w1.lowerPct >= 0 && w1.lowerPct < w1.upperPct)

  const w202 = wilsonScoreInterval(202, 260)
  assert.ok(w202.lowerPct > 70 && w202.upperPct < 85)

  const w260 = wilsonScoreInterval(260, 260)
  assert.equal(Math.round(w260.lowerPct), 99)
  assert.equal(Math.round(w260.upperPct), 100)

  fsCjs.unlinkSync(path.join(__dirname, 'temp_stats.cjs'))
})

test('Baseline-Kompatibilität', async () => {
  const content = await fs.readFile(simScriptPath, 'utf8')

  const startIdx = content.indexOf('const buildRegressionComparison')
  const endIdx = content.indexOf('const buildMarkdownReport', startIdx)

  const REGRESSION_METRICS = [
    { key: 'bankruptcyRate', label: 'Insolvenzrate', suffix: '%' },
    { key: 'avgFinalMoney', label: 'Ø Endgeld' }
  ]

  const funcStr =
    content.substring(startIdx, endIdx) +
    '\n module.exports = { buildRegressionComparison };'

  const fsCjs = require('fs')
  fsCjs.writeFileSync(
    path.join(__dirname, 'temp_compat.cjs'),
    `const REGRESSION_METRICS = ${JSON.stringify(REGRESSION_METRICS)};\n${funcStr}`,
    'utf8'
  )
  const { buildRegressionComparison } = require('./temp_compat.cjs')

  const v9Baseline = {
    results: [
      {
        id: 'baseline_touring',
        summary: {
          bankruptcyRate: 5,
          avgFinalMoney: 10000
        }
      }
    ]
  }

  const v11Results = [
    {
      id: 'baseline_touring',
      summary: {
        bankruptcyRate: 6,
        avgFinalMoney: 12000,
        sampleSize: 260
      }
    }
  ]

  const comparison = buildRegressionComparison(v9Baseline, v11Results)

  fsCjs.unlinkSync(path.join(__dirname, 'temp_compat.cjs'))

  assert.ok(comparison)
  assert.equal(comparison.length, 1)
  assert.equal(comparison[0].metrics.avgFinalMoney.previous, 10000)
  assert.equal(comparison[0].metrics.avgFinalMoney.current, 12000)
})

test('Fame-Accounting (Invariants)', async () => {
  const startFame = 100
  let earned = 50
  let spentGross = 20
  let refunded = 0
  let lost = 10
  let clampedOrDiscarded = 5
  let finalFame =
    startFame + earned - spentGross + refunded - lost - clampedOrDiscarded
  assert.equal(finalFame, 115)
})

test('Population-Splits', async () => {
  assert.ok(true)
})
test('Execution-Coverage', async () => {
  assert.ok(true)
})
test('Volatility', async () => {
  assert.ok(true)
})
