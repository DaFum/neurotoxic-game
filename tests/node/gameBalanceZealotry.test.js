import test from 'node:test'
import assert from 'node:assert'
import {
  VOID_SERMON_CONFIG,
  DARK_WEB_LEAK_CONFIG,
  CULT_INDOCTRINATION_CONFIG,
  PIRATE_RADIO_CONFIG
} from '../../src/data/zealotryActionConfigs.ts'
import {
  SCENARIOS,
  runSingleSimulation,
  createScenarioSeed
} from '../../scripts/game-balance-simulation.mjs'
import {
  runZealotryExperiment
} from '../../scripts/game-balance-zealotry.mjs'
import { streamSeed } from '../../scripts/game-balance-experiments.mjs'

test('Game Balance Zealotry Harness', async t => {
  await t.test('hook-constant payloads match expected config values', () => {
    assert.strictEqual(VOID_SERMON_CONFIG.COST, 750)
    assert.strictEqual(VOID_SERMON_CONFIG.FAME_GAIN, 400)
    assert.strictEqual(VOID_SERMON_CONFIG.ZEALOTRY_GAIN, 25)
    assert.strictEqual(VOID_SERMON_CONFIG.CONTROVERSY_GAIN, 40)
    assert.strictEqual(VOID_SERMON_CONFIG.HARMONY_COST, 25)
    assert.strictEqual(VOID_SERMON_CONFIG.REQUIRED_ZEALOTRY, 35)

    assert.strictEqual(DARK_WEB_LEAK_CONFIG.COST, 500)
    assert.strictEqual(DARK_WEB_LEAK_CONFIG.FAME_GAIN, 300)
    assert.strictEqual(DARK_WEB_LEAK_CONFIG.REQUIRED_CONTROVERSY, 40)

    assert.strictEqual(CULT_INDOCTRINATION_CONFIG.COST, 1000)
    assert.strictEqual(CULT_INDOCTRINATION_CONFIG.FAME_GAIN, 500)
    assert.strictEqual(CULT_INDOCTRINATION_CONFIG.REQUIRED_ZEALOTRY, 50)

    assert.strictEqual(PIRATE_RADIO_CONFIG.COST, 200)
    assert.strictEqual(PIRATE_RADIO_CONFIG.FAME_GAIN, 150)
  })

  await t.test('unchanged default output when dailyActionPolicy is absent', () => {
    const baseScenario = SCENARIOS.find(s => s.id === 'early_game_probe')
    const seed = createScenarioSeed('early_game_probe', 0)

    const runWithoutPolicy = runSingleSimulation(baseScenario, seed)
    const runWithNonePolicy = runSingleSimulation(
      { ...baseScenario, dailyActionPolicy: 'none' },
      seed
    )

    assert.strictEqual(runWithoutPolicy.daysSurvived, runWithNonePolicy.daysSurvived)
    assert.strictEqual(runWithoutPolicy.finalMoney, runWithNonePolicy.finalMoney)
    assert.strictEqual(runWithoutPolicy.finalFame, runWithNonePolicy.finalFame)
    assert.strictEqual(runWithoutPolicy.fameEarned, runWithNonePolicy.fameEarned)
  })

  await t.test('shared paired seeds are identical between candidate and control', () => {
    const cellKey = 'early_game_probe__baseline'
    const seed0 = streamSeed('calibration', cellKey, 0)
    const seed0Again = streamSeed('calibration', cellKey, 0)
    const seed1 = streamSeed('calibration', cellKey, 1)

    assert.strictEqual(seed0, seed0Again)
    assert.notStrictEqual(seed0, seed1)
  })

  await t.test('attempted = successful + rejected invariant holds for all policies', async () => {
    const experiment = await runZealotryExperiment({ runsPerScenario: 5, stream: 'calibration' })

    for (const [cellKey, cellData] of Object.entries(experiment.resultsByCell)) {
      for (const [policyKey, candidateData] of Object.entries(cellData.candidates)) {
        const actionTotals = candidateData.metrics.actionTotals

        for (const [actKey, act] of Object.entries(actionTotals)) {
          assert.strictEqual(
            act.attempted,
            act.successful + act.rejected,
            `Invariant failed for ${cellKey} ${policyKey} ${actKey}: ${act.attempted} != ${act.successful} + ${act.rejected}`
          )

          const totalRejections =
            act.rejections.daily_marker +
            act.rejections.gate +
            act.rejections.cash +
            act.rejections.harmony

          assert.strictEqual(
            act.rejected,
            totalRejections,
            `Rejection reason breakdown sum mismatch for ${cellKey} ${policyKey} ${actKey}`
          )
        }
      }
    }
  })

  await t.test('explicit gate-locked rejections occur when zealotry or controversy is below requirement', () => {
    const baseScenario = SCENARIOS.find(s => s.id === 'early_game_probe')
    const seed = createScenarioSeed('early_game_probe_gate', 0)
    const scenario = {
      ...baseScenario,
      dailyActionPolicy: 'sermon-repeat',
      initialOverrides: {
        ...baseScenario.initialOverrides,
        social: { controversyLevel: 0, zealotry: 0 } // Below zealotry gate 35
      }
    }

    const runRes = runSingleSimulation(scenario, seed)
    const sermonCounters = runRes.zealotryPolicy?.actions?.sermon

    assert.ok(sermonCounters)
    assert.ok(sermonCounters.attempted > 0)
    assert.strictEqual(sermonCounters.successful, 0)
    assert.ok(sermonCounters.rejections.gate > 0)
  })
})
