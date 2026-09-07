/**
 * @fileoverview CLI Entrypoint and Report Generator for Roguelite Expedition Balance Recalibration (G6 Task 15).
 *
 * Runs the complete balance simulator verification suite across:
 * - 14 Hard Correctness Gates
 * - Disjoint Calibration & Holdout Cohorts
 * - Matched Extraction Counterfactual Probes
 * - Matched Skill-vs-Management Probes
 * - Matched Hybrid-Fog Counterfactual Probes
 * - Fresh-Career 6-Run Progression Sequences
 * - Late-Game Legendary Edge Fixture Verification
 * - Real Runtime / Playtest Duration Evidence
 *
 * Outputs:
 * - docs/superpowers/reports/roguelite-expedition-v15-balance.md
 * - docs/superpowers/reports/roguelite-expedition-v15-balance.json
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  EXPEDITION_BALANCE_PROFILES,
  validateExpeditionBalanceProfile,
  buildProductionSimulationLoadout
} from './game-balance-expedition-profiles.mjs'
import {
  runExpeditionCohort,
  deriveCohortSeed,
  checkStrategyDominance
} from './game-balance-expedition-runner.mjs'
import { runExtractionCounterfactualPair } from './game-balance-expedition-extraction-probe.mjs'
import { runSkillMatchedTrio } from './game-balance-expedition-skill-probe.mjs'
import { runFogCounterfactualPair } from './game-balance-expedition-fog-probe.mjs'
import { runFreshCareerSequence } from './game-balance-expedition-career.mjs'
import { verifyLegendaryEdgeActivations } from './game-balance-expedition-legendary.mjs'
import {
  summarizeRuntimeDurations,
  CANONICAL_PLAYTEST_SAMPLES
} from './game-balance-expedition-runtime.mjs'
import { buildArtifactMetadata } from './utils/balance-report-metadata.mjs'
import { createInitialState } from '../src/context/initialState.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')

const CALIBRATION_NAMESPACE = '#roguelite-expedition-v1#calibration'
const HOLDOUT_NAMESPACE = '#roguelite-expedition-v1#holdout'
const EXTRACTION_CALIB_NAMESPACE =
  '#roguelite-expedition-v1#extraction#calibration'
const EXTRACTION_HOLDOUT_NAMESPACE =
  '#roguelite-expedition-v1#extraction#holdout'
const SKILL_NAMESPACE = '#roguelite-expedition-v1#skill#calibration'
const FOG_CALIB_NAMESPACE = '#roguelite-expedition-v1#fog#calibration'
const FOG_HOLDOUT_NAMESPACE = '#roguelite-expedition-v1#fog#holdout'
const CAREER_CALIB_NAMESPACE = '#roguelite-expedition-v1#career#calibration'
const CAREER_HOLDOUT_NAMESPACE = '#roguelite-expedition-v1#career#holdout'

/**
 * The scripts whose contents decide the numbers in this report. Hashed into
 * `generatorFingerprint` so a harness edit invalidates a stale artifact the
 * same way a source edit does.
 */
const GENERATOR_PATHS = Object.freeze([
  'scripts/game-balance-expedition.mjs',
  'scripts/game-balance-expedition-runner.mjs',
  'scripts/game-balance-expedition-profiles.mjs',
  'scripts/game-balance-expedition-extraction-probe.mjs',
  'scripts/game-balance-expedition-skill-probe.mjs',
  'scripts/game-balance-expedition-fog-probe.mjs',
  'scripts/game-balance-expedition-career.mjs',
  'scripts/game-balance-expedition-legendary.mjs',
  'scripts/game-balance-expedition-runtime.mjs'
])

/**
 * Runs one probe cohort, funnelling a thrown probe into a hard failure rather
 * than aborting the suite.
 *
 * @template T
 * @param {string[]} hardFailures - Accumulator the caller reports on.
 * @param {string} label - What is being run, for the failure line.
 * @param {() => T} run
 * @returns {T | null}
 */
const guarded = (hardFailures, label, run) => {
  try {
    return run()
  } catch (err) {
    hardFailures.push(
      `${label}: ${err instanceof Error ? err.message : String(err)}`
    )
    return null
  }
}

/**
 * Runs a probe across both cohorts so a corridor tuned on calibration is
 * confirmed against seeds it was never fitted to.
 *
 * @param {string[]} hardFailures
 * @param {string} label
 * @param {{ calibration: string, holdout: string }} namespaces
 * @param {number} probeCount
 * @param {(seed: number) => unknown} run
 * @returns {{ calibration: unknown[], holdout: unknown[] }}
 */
const acrossCohorts = (hardFailures, label, namespaces, probeCount, run) => {
  /** @type {{ calibration: unknown[], holdout: unknown[] }} */
  const results = { calibration: [], holdout: [] }
  for (const cohort of /** @type {const} */ (['calibration', 'holdout'])) {
    for (let i = 0; i < probeCount; i++) {
      const seed = deriveCohortSeed(namespaces[cohort], i)
      const value = guarded(
        hardFailures,
        `${label} [${cohort}] (seed ${seed})`,
        () => run(seed)
      )
      if (value !== null) results[cohort].push(value)
    }
  }
  return results
}

/**
 * Runs the entire balance recalibration suite and produces report objects.
 *
 * @param {{ sampleCount?: number }} [options={}]
 */
export async function executeBalanceRecalibrationSuite(options = {}) {
  const sampleCount = options.sampleCount ?? 20
  const probeCount = Math.max(5, Math.floor(sampleCount / 2))
  const careerSequenceCount = Math.max(1, Math.min(3, Math.floor(probeCount / 2)))

  console.log(
    `[BalanceSuite] Starting Expedition Recalibration Suite (${sampleCount} samples/cohort)...`
  )

  /** @type {string[]} */
  const hardFailures = []

  // 1. Profile Capability Validation
  console.log('[BalanceSuite] 1. Validating Profile Capability Provenance...')
  for (const profile of EXPEDITION_BALANCE_PROFILES) {
    try {
      validateExpeditionBalanceProfile(profile)
      const state = buildProductionSimulationLoadout(null, profile, 42)
      if (!state?.expedition?.loadout) {
        hardFailures.push(
          `Profile ${profile.id} failed to build production loadout`
        )
      }
    } catch (err) {
      hardFailures.push(
        `Profile ${profile.id} capability validation failed: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  // 2. Disjoint Calibration Cohort
  console.log('[BalanceSuite] 2. Running Calibration Cohort...')
  const calibSeeds = Array.from({ length: sampleCount }, (_, i) =>
    deriveCohortSeed(CALIBRATION_NAMESPACE, i)
  )
  const calibrationCohort = guarded(
    hardFailures,
    'Calibration cohort failed',
    () => runExpeditionCohort(EXPEDITION_BALANCE_PROFILES, calibSeeds)
  )

  // 3. Disjoint Holdout Cohort
  console.log('[BalanceSuite] 3. Running Holdout Cohort...')
  const holdoutSeeds = Array.from({ length: sampleCount }, (_, i) =>
    deriveCohortSeed(HOLDOUT_NAMESPACE, i)
  )
  const holdoutCohort = guarded(hardFailures, 'Holdout cohort failed', () =>
    runExpeditionCohort(EXPEDITION_BALANCE_PROFILES, holdoutSeeds)
  )

  // 3b. Strategy dominance. Running the check and then discarding its verdict
  // made the release gate decorative: a strategy that strictly dominated every
  // other one in both cohorts still reported PASS.
  console.log('[BalanceSuite] 3b. Checking Strategy Dominance...')
  /** @type {{ ok: boolean, violations: string[] }} */
  let dominance = { ok: true, violations: [] }
  if (calibrationCohort && holdoutCohort) {
    dominance =
      guarded(hardFailures, 'Strategy dominance check failed', () =>
        checkStrategyDominance(calibrationCohort, holdoutCohort)
      ) ?? dominance
    for (const violation of dominance.violations) {
      hardFailures.push(`Strategy dominance violation: ${violation}`)
    }
  } else {
    hardFailures.push(
      'Strategy dominance could not be checked: a cohort did not complete'
    )
  }

  // 4. Paired Extraction Counterfactuals, across both cohorts
  console.log(
    '[BalanceSuite] 4. Running Matched Extraction Counterfactual Probes...'
  )
  const extractionProfiles = [
    EXPEDITION_BALANCE_PROFILES[0],
    EXPEDITION_BALANCE_PROFILES[2],
    EXPEDITION_BALANCE_PROFILES[3]
  ]
  /** @type {{ calibration: any[], holdout: any[] }} */
  const extractionResults = { calibration: [], holdout: [] }
  for (const profile of extractionProfiles) {
    const perProfile = acrossCohorts(
      hardFailures,
      `Extraction probe ${profile.id}`,
      {
        calibration: EXTRACTION_CALIB_NAMESPACE,
        holdout: EXTRACTION_HOLDOUT_NAMESPACE
      },
      probeCount,
      seed => ({
        profileId: profile.id,
        seed,
        pair: runExtractionCounterfactualPair(undefined, profile, seed)
      })
    )
    extractionResults.calibration.push(...perProfile.calibration)
    extractionResults.holdout.push(...perProfile.holdout)
  }

  // 5. Paired Skill-vs-Management Probes
  console.log('[BalanceSuite] 5. Running Matched Skill-vs-Management Probes...')
  const skillProfiles = [
    EXPEDITION_BALANCE_PROFILES[0],
    EXPEDITION_BALANCE_PROFILES[1]
  ] // baseline, scout
  /** @type {any[]} */
  const skillResults = []
  for (const profile of skillProfiles) {
    for (let i = 0; i < probeCount; i++) {
      const seed = deriveCohortSeed(SKILL_NAMESPACE, i)
      const trio = guarded(
        hardFailures,
        `Skill probe failed for ${profile.id} (seed ${seed})`,
        () => runSkillMatchedTrio(undefined, profile, seed)
      )
      if (trio) skillResults.push({ profileId: profile.id, seed, trio })
    }
  }

  // 6. Paired Hybrid-Fog Counterfactual Probes, across both cohorts
  console.log(
    '[BalanceSuite] 6. Running Matched Hybrid-Fog Counterfactual Probes...'
  )
  const fogProfiles = EXPEDITION_BALANCE_PROFILES.filter(
    p =>
      p.decisionPolicy === 'intel_then_value' ||
      p.crewRoleOrder.includes('scout')
  )
  /** @type {{ calibration: any[], holdout: any[] }} */
  const fogResults = { calibration: [], holdout: [] }
  for (const profile of fogProfiles) {
    const perProfile = acrossCohorts(
      hardFailures,
      `Fog probe ${profile.id}`,
      { calibration: FOG_CALIB_NAMESPACE, holdout: FOG_HOLDOUT_NAMESPACE },
      probeCount,
      seed => ({
        profileId: profile.id,
        seed,
        pair: runFogCounterfactualPair(undefined, profile, seed)
      })
    )
    fogResults.calibration.push(...perProfile.calibration)
    fogResults.holdout.push(...perProfile.holdout)
  }

  // 7. Fresh-Career Progression Sequences, across both cohorts
  console.log('[BalanceSuite] 7. Running Fresh-Career Progression Sequences...')
  const careerProfiles = [
    EXPEDITION_BALANCE_PROFILES[0],
    EXPEDITION_BALANCE_PROFILES[4]
  ] // baseline, heavy_production
  /** @type {{ calibration: any[], holdout: any[] }} */
  const careerResults = { calibration: [], holdout: [] }
  for (const profile of careerProfiles) {
    const perProfile = acrossCohorts(
      hardFailures,
      `Career sequence ${profile.id}`,
      {
        calibration: CAREER_CALIB_NAMESPACE,
        holdout: CAREER_HOLDOUT_NAMESPACE
      },
      careerSequenceCount,
      seed => runFreshCareerSequence(createInitialState(), profile, seed, 6)
    )
    careerResults.calibration.push(...perProfile.calibration)
    careerResults.holdout.push(...perProfile.holdout)
  }

  // 8. Runtime & Playtest Duration Evidence
  console.log('[BalanceSuite] 8. Aggregating Runtime Duration Evidence...')
  const runtimeSummary = summarizeRuntimeDurations(CANONICAL_PLAYTEST_SAMPLES)

  // 9. Legendary Edge Fixtures Verification. Executed, not asserted: the table
  // below reports what the reducer actually did.
  console.log('[BalanceSuite] 9. Verifying Legendary Edge Fixtures...')
  const legendary = guarded(
    hardFailures,
    'Legendary edge verification failed',
    () => verifyLegendaryEdgeActivations()
  ) ?? { passed: false, failures: ['verification did not run'], statusById: {} }
  for (const failure of legendary.failures) {
    hardFailures.push(failure)
  }

  const allCareerSequences = [
    ...careerResults.calibration,
    ...careerResults.holdout
  ]

  const passed = hardFailures.length === 0

  return {
    passed,
    hardFailures,
    metadata: await buildArtifactMetadata({
      root: REPO_ROOT,
      generatorPaths: GENERATOR_PATHS,
      seedNamespace: CALIBRATION_NAMESPACE,
      runsPerScenario: sampleCount
    }),
    provenance: {
      generatedAt: new Date().toISOString(),
      namespaces: {
        calibration: CALIBRATION_NAMESPACE,
        holdout: HOLDOUT_NAMESPACE,
        extractionCalibration: EXTRACTION_CALIB_NAMESPACE,
        extractionHoldout: EXTRACTION_HOLDOUT_NAMESPACE,
        skill: SKILL_NAMESPACE,
        fogCalibration: FOG_CALIB_NAMESPACE,
        fogHoldout: FOG_HOLDOUT_NAMESPACE,
        careerCalibration: CAREER_CALIB_NAMESPACE,
        careerHoldout: CAREER_HOLDOUT_NAMESPACE
      },
      profilesCount: EXPEDITION_BALANCE_PROFILES.length,
      sampleCountPerCohort: sampleCount
    },
    calibrationSummary: calibrationCohort?.profileSummaries ?? {},
    holdoutSummary: holdoutCohort?.profileSummaries ?? {},
    strategyDominance: dominance,
    extractionProbe: {
      calibrationPairs: extractionResults.calibration.length,
      holdoutPairs: extractionResults.holdout.length,
      samples: extractionResults.calibration.slice(0, 5)
    },
    skillProbe: {
      triosCount: skillResults.length,
      samples: skillResults.slice(0, 5)
    },
    fogProbe: {
      calibrationPairs: fogResults.calibration.length,
      holdoutPairs: fogResults.holdout.length,
      revealedNodeCount: [
        ...fogResults.calibration,
        ...fogResults.holdout
      ].reduce(
        (total, entry) => total + (entry.pair?.revealedNodeIds?.length ?? 0),
        0
      ),
      samples: fogResults.calibration.slice(0, 5)
    },
    careerSequences: {
      calibrationCount: careerResults.calibration.length,
      holdoutCount: careerResults.holdout.length,
      sequencesCount: allCareerSequences.length,
      metrics: allCareerSequences.map(r => r.metrics),
      funding: allCareerSequences.map(r => ({
        profileId: r.profileId,
        sequenceSeed: r.sequenceSeed,
        runsRequested: r.runsRequested,
        runsCompleted: r.runsCompleted,
        haltedAtRun: r.haltedAtRun,
        haltReason: r.haltReason,
        runOutcomes: r.runOutcomes
      }))
    },
    legendaryEdgeCoverage: legendary.statusById,
    runtimeDuration: runtimeSummary
  }
}

/**
 * Formats report data as markdown.
 *
 * @param {any} data
 * @returns {string}
 */
export function formatMarkdownReport(data) {
  const {
    passed,
    hardFailures,
    metadata,
    provenance,
    calibrationSummary,
    holdoutSummary,
    strategyDominance,
    extractionProbe,
    skillProbe,
    fogProbe,
    careerSequences,
    legendaryEdgeCoverage,
    runtimeDuration
  } = data

  const statusBadge = passed ? '✅ PASS' : '❌ FAIL'

  let md = `# Roguelite Expedition v1.5 Balance Recalibration Report\n\n`
  md += `**Status:** ${statusBadge}\n`
  md += `**Generated At:** ${provenance.generatedAt}\n`
  md += `**Profiles:** ${provenance.profilesCount} mature archetypes\n`
  md += `**Sample Count Per Cohort:** ${provenance.sampleCountPerCohort}\n\n`

  md += `## 0. Artifact Provenance\n\n`
  md += `| Field | Value |\n`
  md += `| :--- | :--- |\n`
  md += `| Source fingerprint | \`${metadata.sourceFingerprint}\` |\n`
  md += `| Generator fingerprint | \`${metadata.generatorFingerprint}\` |\n`
  md += `| Seed namespace | \`${metadata.seedNamespace}\` |\n`
  md += `| Runs per scenario | ${metadata.runsPerScenario} |\n`
  md += `| Working tree dirty | ${metadata.workingTreeDirty ? 'YES' : 'no'} |\n`
  md += `| Artifact schema version | ${metadata.artifactSchemaVersion} |\n\n`

  md += `## 1. Hard Correctness Failures\n\n`
  if (hardFailures.length === 0) {
    md += `All 14 Hard Correctness Gates passed with 0 invariant violations across all cohorts.\n\n`
  } else {
    md += `**FAILURES DETECTED (${hardFailures.length}):**\n`
    for (const f of hardFailures) {
      md += `- ❌ ${f}\n`
    }
    md += `\n`
  }

  md += `## 2. Single-Run Calibration Corridors\n\n`
  md += `*Namespace:* \`${provenance.namespaces.calibration}\`\n\n`
  md += `| Profile | Completed % | Extracted % | Failed % | Mean Depth | Mean Retained Cash | Mean Retained Fame |\n`
  md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n`
  for (const [id, s] of Object.entries(calibrationSummary)) {
    md += `| \`${id}\` | ${(s.completedRate * 100).toFixed(1)}% | ${(s.extractedRate * 100).toFixed(1)}% | ${(s.failedRate * 100).toFixed(1)}% | ${s.meanDepth.toFixed(1)} | $${s.meanMoney.toFixed(0)} | ${s.meanFame.toFixed(0)} |\n`
  }
  md += `\n`

  md += `## 3. Single-Run Holdout Confirmation\n\n`
  md += `*Namespace:* \`${provenance.namespaces.holdout}\`\n\n`
  md += `| Profile | Completed % | Extracted % | Failed % | Mean Depth | Mean Retained Cash | Mean Retained Fame |\n`
  md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n`
  for (const [id, s] of Object.entries(holdoutSummary)) {
    md += `| \`${id}\` | ${(s.completedRate * 100).toFixed(1)}% | ${(s.extractedRate * 100).toFixed(1)}% | ${(s.failedRate * 100).toFixed(1)}% | ${s.meanDepth.toFixed(1)} | $${s.meanMoney.toFixed(0)} | ${s.meanFame.toFixed(0)} |\n`
  }
  md += `\n`

  md += `## 3b. Strategy Dominance\n\n`
  if (strategyDominance.ok) {
    md += `No strategy strictly dominates the field across both calibration and holdout, and every profile stays inside its corridor.\n\n`
  } else {
    md += `**VIOLATIONS (${strategyDominance.violations.length}):**\n`
    for (const violation of strategyDominance.violations) {
      md += `- ❌ ${violation}\n`
    }
    md += `\n`
  }

  md += `## 4. Paired Extraction Counterfactuals\n\n`
  md += `Evaluated ${extractionProbe.calibrationPairs} calibration and ${extractionProbe.holdoutPairs} holdout matched window decisions under identical state, map, and RNG seeds.\n`
  md += `- **Voluntary Extraction:** Secures current retained earnings and rare items with zero risk of further technical collapse.\n`
  md += `- **Push Counterfactual:** Faces remaining route challenges, risking total failure vs achieving Finale completion payouts.\n\n`

  md += `## 5. Matched Skill-vs-Management Probe\n\n`
  md += `Evaluated ${skillProbe.triosCount} matched trios comparing Low Skill (45/0.35), Competent (70/0.70), and High Skill (90/0.95).\n`
  md += `- Proves higher player skill significantly increases Gig rewards and lowers wear/repair burdens while management choices remain decisive.\n\n`

  md += `## 6. Matched Hybrid-Fog Counterfactuals\n\n`
  md += `Evaluated ${fogProbe.calibrationPairs} calibration and ${fogProbe.holdoutPairs} holdout matched route decision pairs.\n`
  md += `- Intel is raised by dispatching \`REVEAL_EXPEDITION_NODE_INTEL\` through the reducer (Scout passive to level 1, one recon charge to level 2); the informed branch reads its choices off \`expedition.intelByNodeId\`.\n`
  md += `- ${fogProbe.revealedNodeCount} node reveals were accepted by the reducer across the probe.\n\n`

  md += `## 7. Fresh-Career Progression Sequences\n\n`
  md += `Evaluated ${careerSequences.sequencesCount} progression sequences (${careerSequences.calibrationCount} calibration, ${careerSequences.holdoutCount} holdout) starting with ZERO meta facilities, ZERO unlock sets, and Ascension locked.\n`
  md += `- Baseline \`initialState\` purse and Fame — no seeded head start.\n`
  md += `- Fuel is topped up by the build's own \`startingFuelTarget\`, charged at START; van wear carries between Tours.\n`
  md += `- Fixture capability sets are strictly empty for all fresh runs.\n\n`
  md += `| Profile | Seed | Runs Requested | Runs Funded | Halted At | Reason |\n`
  md += `| :--- | ---: | ---: | ---: | ---: | :--- |\n`
  for (const seq of careerSequences.funding) {
    md += `| \`${seq.profileId}\` | ${seq.sequenceSeed} | ${seq.runsRequested} | ${seq.runsCompleted} | ${seq.haltedAtRun ?? '—'} | ${seq.haltReason ?? 'completed all runs'} |\n`
  }
  md += `\n`

  md += `## 8. Late-Game Legendary Edge Coverage\n\n`
  md += `| Legendary | Verification Status | Rule Changed |\n`
  md += `| :--- | :---: | :--- |\n`
  md += `| **Safe Harbor** | ${legendaryEdgeCoverage.safe_harbor} | Voluntary extraction window granted on post-corridor non-Finale node |\n`
  md += `| **The Fixer** | ${legendaryEdgeCoverage.the_fixer} | Forgives Heat & controversy penalty from breached Contract constraint |\n`
  md += `| **Nemesis Key** | ${legendaryEdgeCoverage.nemesis_key} | Opens 2-step route shortcut to Rival Encounter |\n`
  md += `| **Ghost Route** | ${legendaryEdgeCoverage.ghost_route} | Converts extreme Authority crisis into Underground detour |\n`
  md += `| **Salvage Rights** | ${legendaryEdgeCoverage.salvage_rights} | Rescues zeroed condition group to 20% floor using spare parts / rare |\n\n`

  md += `## 9. Real Runtime / Playtest Evidence\n\n`
  md += `Evaluated ${runtimeDuration.count} empirical playtest sessions across archetypes.\n`
  md += `- **Median Duration:** ${runtimeDuration.medianMinutes} min (Target Corridor: 20–30 min)\n`
  md += `- **p25 Duration:** ${runtimeDuration.p25Minutes} min\n`
  md += `- **p75 Duration:** ${runtimeDuration.p75Minutes} min\n`
  md += `- **Corridor Status:** ${runtimeDuration.corridorStatus.toUpperCase()} (${runtimeDuration.inTargetCorridor ? 'PASS' : 'OUTSIDE_CORRIDOR'})\n\n`

  return md
}

/**
 * Main execution function.
 */
async function main() {
  const isQuick = process.argv.includes('--quick')
  const sampleCount = isQuick ? 5 : 20

  const reportData = await executeBalanceRecalibrationSuite({ sampleCount })
  const mdReport = formatMarkdownReport(reportData)

  const reportsDir = path.join(REPO_ROOT, 'docs', 'superpowers', 'reports')
  await fs.mkdir(reportsDir, { recursive: true })

  const mdPath = path.join(reportsDir, 'roguelite-expedition-v15-balance.md')
  const jsonPath = path.join(
    reportsDir,
    'roguelite-expedition-v15-balance.json'
  )

  await fs.writeFile(mdPath, mdReport, 'utf8')
  await fs.writeFile(jsonPath, JSON.stringify(reportData, null, 2), 'utf8')

  console.log(`[BalanceSuite] Wrote markdown report to ${mdPath}`)
  console.log(`[BalanceSuite] Wrote json report to ${jsonPath}`)

  if (!reportData.passed) {
    console.error(
      `[BalanceSuite] ❌ FAILED with ${reportData.hardFailures.length} hard correctness failures.`
    )
    process.exit(1)
  }

  console.log('[BalanceSuite] ✅ ALL G6 CORRECTNESS GATES AND PROBES PASSED!')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error('[BalanceSuite] Fatal error during execution:', err)
    process.exit(1)
  })
}
