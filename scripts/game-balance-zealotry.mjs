import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildArtifactMetadata } from './utils/balance-report-metadata.mjs'
import {
  pairedMetricStatistics,
  bankruptcyTransitions
} from './utils/paired-statistics.mjs'
import {
  SCENARIOS,
  SIMULATION_CONSTANTS,
  runSingleSimulation
} from './game-balance-simulation.mjs'
import { streamSeed, pairedFamePerGig } from './game-balance-experiments.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT_JSON = path.join(
  ROOT,
  'reports/game-balance-zealotry-results.json'
)
const OUTPUT_MARKDOWN = path.join(
  ROOT,
  'reports/game-balance-zealotry-analysis.md'
)

export const GENERATOR_PATHS = Object.freeze([
  'scripts/game-balance-zealotry.mjs',
  'scripts/game-balance-simulation.mjs',
  'scripts/game-balance-experiments.mjs',
  'scripts/utils/balance-report-metadata.mjs',
  'scripts/utils/paired-statistics.mjs'
])

export const STAGE_PROBE_IDS = Object.freeze([
  'early_game_probe',
  'mid_game_probe',
  'late_game_probe'
])

export const FIXTURE_VARIANTS = Object.freeze({
  baseline: { controversyLevel: 0, zealotry: 0 },
  zealotry_35: { controversyLevel: 0, zealotry: 35 },
  zealotry_50: { controversyLevel: 0, zealotry: 50 },
  controversy_40: { controversyLevel: 40, zealotry: 0 },
  controversy_45: { controversyLevel: 45, zealotry: 0 },
  controversy_55: { controversyLevel: 55, zealotry: 0 }
})

export const POLICIES = Object.freeze([
  'none',
  'sermon-repeat',
  'leak-repeat',
  'cult-repeat',
  'pirate-repeat',
  'legal-stack',
  'sermon-reserve'
])

const parseArgs = () => {
  const args = process.argv.slice(2)
  let runsPerScenario = SIMULATION_CONSTANTS.runsPerScenario
  let stream = 'calibration'

  for (const arg of args) {
    if (arg.startsWith('--runs=')) {
      const parsed = parseInt(arg.slice(7), 10)
      if (Number.isFinite(parsed) && parsed > 0) runsPerScenario = parsed
    } else if (arg.startsWith('--stream=')) {
      stream = arg.slice(9)
    }
  }

  return { runsPerScenario, stream }
}

export const runZealotryExperiment = async ({
  runsPerScenario = SIMULATION_CONSTANTS.runsPerScenario,
  stream = 'calibration'
} = {}) => {
  const baseProbes = SCENARIOS.filter(s => STAGE_PROBE_IDS.includes(s.id))
  if (baseProbes.length !== STAGE_PROBE_IDS.length) {
    throw new Error('Could not find all stage probe scenarios in SCENARIOS')
  }

  const resultsByCell = {}

  for (const probeScenario of baseProbes) {
    for (const [fixtureKey, fixture] of Object.entries(FIXTURE_VARIANTS)) {
      const cellKey = `${probeScenario.id}__${fixtureKey}`

      // First run control ('none')
      const controlScenario = {
        ...probeScenario,
        id: cellKey,
        dailyActionPolicy: 'none',
        initialOverrides: {
          ...probeScenario.initialOverrides,
          social: {
            ...probeScenario.initialOverrides?.social,
            controversyLevel: fixture.controversyLevel,
            zealotry: fixture.zealotry
          }
        }
      }

      const controlRuns = []
      for (let runIndex = 0; runIndex < runsPerScenario; runIndex++) {
        const seed = streamSeed(stream, cellKey, runIndex)
        const runRes = runSingleSimulation(controlScenario, seed)
        controlRuns.push(runRes)
      }

      resultsByCell[cellKey] = {
        probeId: probeScenario.id,
        fixtureKey,
        fixture,
        runsPerScenario,
        candidates: {}
      }

      // Run candidate policies
      for (const policyKey of POLICIES) {
        if (policyKey === 'none') continue

        const candidateScenario = {
          ...controlScenario,
          dailyActionPolicy: policyKey
        }

        const candidateRuns = []
        for (let runIndex = 0; runIndex < runsPerScenario; runIndex++) {
          const seed = streamSeed(stream, cellKey, runIndex)
          const runRes = runSingleSimulation(candidateScenario, seed)
          candidateRuns.push(runRes)
        }

        // Aggregate statistics and action metrics
        const metrics = aggregatePolicyMetrics(
          controlRuns,
          candidateRuns,
          `${cellKey}__${policyKey}__${stream}`
        )

        resultsByCell[cellKey].candidates[policyKey] = {
          policyKey,
          metrics
        }
      }
    }
  }

  const metadata = await buildArtifactMetadata({
    root: ROOT,
    generatorPaths: GENERATOR_PATHS,
    seedNamespace: SIMULATION_CONSTANTS.seedNamespace,
    runsPerScenario
  })

  return {
    metadata,
    stream,
    runsPerScenario,
    resultsByCell
  }
}

const aggregatePolicyMetrics = (controlRuns, candidateRuns, bootstrapSeed) => {
  const n = controlRuns.length

  // Action count aggregations
  const actionTotals = {
    sermon: {
      attempted: 0,
      eligible: 0,
      successful: 0,
      rejected: 0,
      rejections: { daily_marker: 0, gate: 0, cash: 0, harmony: 0 }
    },
    leak: {
      attempted: 0,
      eligible: 0,
      successful: 0,
      rejected: 0,
      rejections: { daily_marker: 0, gate: 0, cash: 0, harmony: 0 }
    },
    cult: {
      attempted: 0,
      eligible: 0,
      successful: 0,
      rejected: 0,
      rejections: { daily_marker: 0, gate: 0, cash: 0, harmony: 0 }
    },
    pirate: {
      attempted: 0,
      eligible: 0,
      successful: 0,
      rejected: 0,
      rejections: { daily_marker: 0, gate: 0, cash: 0, harmony: 0 }
    }
  }

  let totalDealBreakEvents = 0
  let totalTrustLost = 0
  let totalDaysAtControversy85OrHigher = 0
  let totalActiveDealPayoutsLost = 0
  let neverEligibleRuns = 0

  for (const run of candidateRuns) {
    const zp = run.zealotryPolicy || run.counters?.zealotryPolicy
    if (!zp) continue

    totalDealBreakEvents += zp.dealBreakEvents ?? 0
    totalTrustLost += zp.trustLost ?? 0
    totalDaysAtControversy85OrHigher += zp.daysAtControversy85OrHigher ?? 0
    totalActiveDealPayoutsLost += zp.activeDealPayoutsLost ?? 0

    let runTotalEligible = 0
    for (const [actionKey, act] of Object.entries(zp.actions || {})) {
      if (!actionTotals[actionKey]) continue
      actionTotals[actionKey].attempted += act.attempted ?? 0
      actionTotals[actionKey].eligible += act.eligible ?? 0
      actionTotals[actionKey].successful += act.successful ?? 0
      actionTotals[actionKey].rejected += act.rejected ?? 0

      runTotalEligible += act.eligible ?? 0

      for (const [rKey, rVal] of Object.entries(act.rejections || {})) {
        actionTotals[actionKey].rejections[rKey] =
          (actionTotals[actionKey].rejections[rKey] ?? 0) + (rVal ?? 0)
      }
    }

    if (runTotalEligible === 0) {
      neverEligibleRuns++
    }
  }

  const neverEligibleShare = n > 0 ? neverEligibleRuns / n : 0

  const extract = (runs, getter) => runs.map(r => getter(r) ?? 0)

  const pairsForFame = controlRuns.map((controlRun, idx) => ({
    control: {
      fameEarned: controlRun.fameAccounting?.earned ?? 0,
      gigsPlayed: controlRun.gigsPlayed ?? 0
    },
    candidate: {
      fameEarned: candidateRuns[idx].fameAccounting?.earned ?? 0,
      gigsPlayed: candidateRuns[idx].gigsPlayed ?? 0
    }
  }))

  const famePerGig = pairedFamePerGig(pairsForFame)

  const pairedDeltas = {
    daysSurvived: pairedMetricStatistics(
      extract(controlRuns, r => r.daysSurvived),
      extract(candidateRuns, r => r.daysSurvived),
      { bootstrapSeed: `${bootstrapSeed}__days` }
    ),
    finalMoney: pairedMetricStatistics(
      extract(controlRuns, r => r.finalMoney),
      extract(candidateRuns, r => r.finalMoney),
      { bootstrapSeed: `${bootstrapSeed}__money` }
    ),
    finalFame: pairedMetricStatistics(
      extract(controlRuns, r => r.finalFame),
      extract(candidateRuns, r => r.finalFame),
      { bootstrapSeed: `${bootstrapSeed}__fame` }
    ),
    fameEarned: pairedMetricStatistics(
      extract(controlRuns, r => r.fameAccounting?.earned),
      extract(candidateRuns, r => r.fameAccounting?.earned),
      { bootstrapSeed: `${bootstrapSeed}__fameEarned` }
    ),
    gigsPlayed: pairedMetricStatistics(
      extract(controlRuns, r => r.gigsPlayed),
      extract(candidateRuns, r => r.gigsPlayed),
      { bootstrapSeed: `${bootstrapSeed}__gigs` }
    ),
    finalHarmony: pairedMetricStatistics(
      extract(controlRuns, r => r.finalHarmony),
      extract(candidateRuns, r => r.finalHarmony),
      { bootstrapSeed: `${bootstrapSeed}__harmony` }
    ),
    maxDrawdownPct: pairedMetricStatistics(
      extract(controlRuns, r => r.maxPeakToTroughDrop),
      extract(candidateRuns, r => r.maxPeakToTroughDrop),
      { bootstrapSeed: `${bootstrapSeed}__drawdown` }
    ),
    finalControversy: pairedMetricStatistics(
      extract(controlRuns, r => r.finalControversy),
      extract(candidateRuns, r => r.finalControversy),
      { bootstrapSeed: `${bootstrapSeed}__controversy` }
    ),
    bankruptcy: bankruptcyTransitions(
      controlRuns.map(r => r.bankrupt),
      candidateRuns.map(r => r.bankrupt)
    )
  }

  return {
    sampleSize: n,
    neverEligibleRuns,
    neverEligibleShare,
    actionTotals,
    dealBreakMetrics: {
      totalDealBreakEvents,
      totalTrustLost,
      totalDaysAtControversy85OrHigher,
      totalActiveDealPayoutsLost
    },
    pairedFamePerGig: famePerGig,
    pairedDeltas
  }
}

export const generateMarkdownReport = experimentResult => {
  const { metadata, stream, runsPerScenario, resultsByCell } = experimentResult

  let md = '# Zealotry Policy Balance Analysis\n\n'
  md += `**Stream:** \`${stream}\` | **Runs per Scenario:** ${runsPerScenario}\n`
  md += `**Source Fingerprint:** \`${metadata.sourceFingerprint}\`\n`
  md += `**Generator Fingerprint:** \`${metadata.generatorFingerprint}\`\n\n`

  md += '## Cell Summary & Paired Policy Performance\n\n'
  md +=
    '| Cell (Probe / Fixture) | Policy | Attempted | Successful | Rejected | Gate Rejections | Never-Eligible % | Mean Fame Delta | Mean Money Delta | Deal Breaks | Trust Lost |\n'
  md += '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n'

  for (const [cellKey, cellData] of Object.entries(resultsByCell)) {
    for (const [policyKey, candidateData] of Object.entries(
      cellData.candidates
    )) {
      const m = candidateData.metrics
      let primaryAct = {
        attempted: 0,
        successful: 0,
        rejected: 0,
        rejections: { gate: 0 }
      }

      if (policyKey === 'sermon-repeat' || policyKey === 'sermon-reserve') {
        primaryAct = m.actionTotals.sermon
      } else if (policyKey === 'leak-repeat') {
        primaryAct = m.actionTotals.leak
      } else if (policyKey === 'cult-repeat') {
        primaryAct = m.actionTotals.cult
      } else if (policyKey === 'pirate-repeat') {
        primaryAct = m.actionTotals.pirate
      } else if (policyKey === 'legal-stack') {
        for (const act of Object.values(m.actionTotals)) {
          primaryAct.attempted += act.attempted ?? 0
          primaryAct.successful += act.successful ?? 0
          primaryAct.rejected += act.rejected ?? 0
          primaryAct.rejections.gate += act.rejections?.gate ?? 0
        }
      }

      const attempted = primaryAct.attempted
      const successful = primaryAct.successful
      const rejected = primaryAct.rejected
      const gateRejections = primaryAct.rejections.gate
      const neverEligiblePct = (m.neverEligibleShare * 100).toFixed(1)
      const fameDelta = m.pairedDeltas.finalFame.pairedDelta.mean
      const moneyDelta = m.pairedDeltas.finalMoney.pairedDelta.mean
      const dealBreaks = m.dealBreakMetrics.totalDealBreakEvents

      md += `| \`${cellKey}\` | \`${policyKey}\` | ${attempted} | ${successful} | ${rejected} | ${gateRejections} | ${neverEligiblePct}% | ${fameDelta} | ${moneyDelta} | ${dealBreaks} | ${m.dealBreakMetrics.totalTrustLost} |\n`
    }
  }

  md += '\n## Coverage Limits & Methodological Context\n\n'
  md +=
    '- **Matched Stage & Seed:** Every policy candidate is evaluated against the exact same seed stream and stage probe as its paired control.\n'
  md +=
    '- **Control Policy:** Ordinary posting/brand policies (`none`) are used as control. `no_social_probe` is NOT used as control.\n'
  md +=
    '- **Never-unlocked cohorts:** Cells starting at zealotry 0/controversy 0 may record high never-eligible shares for gated policies (e.g. Void Sermon required zealotry 35, Dark Web Leak required controversy 40/55, Cult Indoctrination required zealotry 50).\n'
  md +=
    '- **Descriptive Comparisons:** Cross-cell or cross-fingerprint comparisons are descriptive.\n'

  return md
}

const main = async () => {
  const { runsPerScenario, stream } = parseArgs()
  console.log(
    `Running Zealotry Experiment: runs=${runsPerScenario}, stream=${stream}...`
  )

  const experimentResult = await runZealotryExperiment({
    runsPerScenario,
    stream
  })

  await fs.writeFile(
    OUTPUT_JSON,
    JSON.stringify(experimentResult, null, 2),
    'utf8'
  )
  const markdown = generateMarkdownReport(experimentResult)
  await fs.writeFile(OUTPUT_MARKDOWN, markdown, 'utf8')

  console.log(`Wrote JSON artifact to ${OUTPUT_JSON}`)
  console.log(`Wrote Analysis report to ${OUTPUT_MARKDOWN}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(err => {
    console.error(err)
    process.exit(1)
  })
}
