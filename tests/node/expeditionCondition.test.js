import test from 'node:test'
import assert from 'node:assert/strict'
import {
  clampCondition,
  createDefaultTechnicalCondition,
  getExpeditionConditionPerformanceProfile,
  calculatePostGigTechnicalWear,
  applyTechnicalWear,
  getExpeditionConditionSummary,
  getExpeditionConditionActiveEffects
} from '../../src/domain/expedition/condition'
import { handleSetLastGigStats } from '../../src/context/reducers/gigReducer'
import { createInitialState } from '../../src/context/initialState'

test('Task 5: Expedition Technical Condition and Performance Profile', async t => {
  await t.test(
    'initializes default technical condition to 100 with no defects',
    () => {
      const condition = createDefaultTechnicalCondition()
      assert.equal(condition.pa, 100)
      assert.equal(condition.instruments, 100)
      assert.equal(condition.stageGear, 100)
      assert.deepEqual(condition.defects, [])
    }
  )

  await t.test('clamps condition values strictly between 0 and 100', () => {
    assert.equal(clampCondition(150), 100)
    assert.equal(clampCondition(-20), 0)
    assert.equal(clampCondition(NaN), 0)
    assert.equal(clampCondition(undefined), 0)
    assert.equal(clampCondition(75.6), 76)
  })

  await t.test(
    'evaluates baseline performance profile when all groups >= 70',
    () => {
      const profile = getExpeditionConditionPerformanceProfile({
        pa: 100,
        instruments: 80,
        stageGear: 70,
        defects: []
      })
      assert.equal(profile.audioHazardLevel, 0)
      assert.equal(profile.timingMultiplier, 1.0)
      assert.equal(profile.missStaminaMultiplier, 1.0)
      assert.equal(profile.comboRecoveryMultiplier, 1.0)
      assert.deepEqual(profile.disabledGroups, [])
    }
  )

  await t.test('applies PA wear consequences correctly across bands', () => {
    // 40..69: audioHazardLevel 1
    const worn = getExpeditionConditionPerformanceProfile({
      pa: 55,
      instruments: 100,
      stageGear: 100,
      defects: []
    })
    assert.equal(worn.audioHazardLevel, 1)
    assert.equal(worn.timingMultiplier, 1.0)
    assert.deepEqual(worn.disabledGroups, [])

    // 1..39: audioHazardLevel 2, timing x0.96
    const critical = getExpeditionConditionPerformanceProfile({
      pa: 25,
      instruments: 100,
      stageGear: 100,
      defects: []
    })
    assert.equal(critical.audioHazardLevel, 2)
    assert.equal(critical.timingMultiplier, 0.96)
    assert.deepEqual(critical.disabledGroups, [])

    // 0: disabledGroups includes pa
    const broken = getExpeditionConditionPerformanceProfile({
      pa: 0,
      instruments: 100,
      stageGear: 100,
      defects: []
    })
    assert.ok(broken.disabledGroups.includes('pa'))
    assert.equal(broken.audioHazardLevel, 2)
    assert.equal(broken.timingMultiplier, 0.96)
  })

  await t.test(
    'applies Instruments wear consequences correctly across bands',
    () => {
      // 40..69: timing x0.98
      const worn = getExpeditionConditionPerformanceProfile({
        pa: 100,
        instruments: 50,
        stageGear: 100,
        defects: []
      })
      assert.equal(worn.timingMultiplier, 0.98)
      assert.equal(worn.missStaminaMultiplier, 1.0)
      assert.deepEqual(worn.disabledGroups, [])

      // 1..39: timing x0.93, miss stamina x1.15
      const critical = getExpeditionConditionPerformanceProfile({
        pa: 100,
        instruments: 30,
        stageGear: 100,
        defects: []
      })
      assert.equal(critical.timingMultiplier, 0.93)
      assert.equal(critical.missStaminaMultiplier, 1.15)
      assert.deepEqual(critical.disabledGroups, [])

      // 0: disabledGroups includes instruments
      const broken = getExpeditionConditionPerformanceProfile({
        pa: 100,
        instruments: 0,
        stageGear: 100,
        defects: []
      })
      assert.ok(broken.disabledGroups.includes('instruments'))
      assert.equal(broken.timingMultiplier, 0.93)
      assert.equal(broken.missStaminaMultiplier, 1.15)
    }
  )

  await t.test(
    'applies Stage Gear wear consequences correctly across bands',
    () => {
      // 40..69: combo recovery x0.95
      const worn = getExpeditionConditionPerformanceProfile({
        pa: 100,
        instruments: 100,
        stageGear: 60,
        defects: []
      })
      assert.equal(worn.comboRecoveryMultiplier, 0.95)
      assert.equal(worn.audioHazardLevel, 0)
      assert.deepEqual(worn.disabledGroups, [])

      // 1..39: combo recovery x0.85, audioHazardLevel >= 1
      const critical = getExpeditionConditionPerformanceProfile({
        pa: 100,
        instruments: 100,
        stageGear: 20,
        defects: []
      })
      assert.equal(critical.comboRecoveryMultiplier, 0.85)
      assert.ok(critical.audioHazardLevel >= 1)
      assert.deepEqual(critical.disabledGroups, [])

      // 0: disabledGroups includes stageGear
      const broken = getExpeditionConditionPerformanceProfile({
        pa: 100,
        instruments: 100,
        stageGear: 0,
        defects: []
      })
      assert.ok(broken.disabledGroups.includes('stageGear'))
      assert.equal(broken.comboRecoveryMultiplier, 0.85)
      assert.ok(broken.audioHazardLevel >= 1)
    }
  )

  await t.test('composes multi-group degraded profiles correctly', () => {
    // PA 30 (0.96 timing, hazard 2) + Instruments 50 (0.98 timing) + Stage Gear 20 (0.85 combo recovery, hazard >= 1)
    const profile = getExpeditionConditionPerformanceProfile({
      pa: 30,
      instruments: 50,
      stageGear: 20,
      defects: []
    })
    assert.equal(profile.audioHazardLevel, 2)
    assert.equal(profile.timingMultiplier, 0.9408) // 0.96 * 0.98
    assert.equal(profile.missStaminaMultiplier, 1.0)
    assert.equal(profile.comboRecoveryMultiplier, 0.85)
    assert.deepEqual(profile.disabledGroups, [])
  })

  await t.test(
    'summarizes all 4 groups (Vehicle, PA, Instruments, Stage Gear)',
    () => {
      const state = createInitialState()
      state.player.van = { ...state.player.van, condition: 80 }
      state.expedition = {
        ...state.expedition,
        status: 'active',
        technicalCondition: {
          pa: 60,
          instruments: 40,
          stageGear: 100,
          defects: []
        }
      }
      // (80 + 60 + 40 + 100) / 4 = 70
      assert.equal(getExpeditionConditionSummary(state), 70)

      // Outside active expedition, reports canonical player.van.condition
      state.expedition.status = 'idle'
      assert.equal(getExpeditionConditionSummary(state), 80)
    }
  )

  await t.test('derives post-gig wear and applies it accurately', () => {
    const normalWear = calculatePostGigTechnicalWear(
      {
        accuracy: 85,
        misses: 2,
        failed: false
      },
      1.0
    )
    assert.ok(normalWear.pa > 0)
    assert.ok(normalWear.instruments > 0)
    assert.ok(normalWear.stageGear > 0)

    const failedWear = calculatePostGigTechnicalWear(
      {
        accuracy: 25,
        misses: 15,
        failed: true
      },
      1.0
    )
    assert.ok(failedWear.pa > normalWear.pa)
    assert.ok(failedWear.instruments > normalWear.instruments)

    const doubledWear = calculatePostGigTechnicalWear(
      {
        accuracy: 85,
        misses: 2,
        failed: false
      },
      2.0
    )
    assert.equal(doubledWear.pa, normalWear.pa * 2)

    const initial = { pa: 50, instruments: 50, stageGear: 50, defects: [] }
    const updated = applyTechnicalWear(initial, normalWear)
    assert.equal(updated.pa, 50 - normalWear.pa)
    assert.equal(updated.instruments, 50 - normalWear.instruments)
    assert.equal(updated.stageGear, 50 - normalWear.stageGear)
  })

  await t.test(
    'handleSetLastGigStats settles post-gig wear on active expedition',
    () => {
      const baseState = createInitialState()
      baseState.player.van = { ...baseState.player.van, condition: 100 }
      baseState.expedition = {
        ...baseState.expedition,
        status: 'active',
        technicalCondition: {
          pa: 100,
          instruments: 100,
          stageGear: 100,
          defects: []
        }
      }

      const nextState = handleSetLastGigStats(baseState, {
        score: 15000,
        accuracy: 80,
        misses: 3,
        failed: false
      })

      assert.ok(nextState.expedition?.technicalCondition)
      assert.ok(nextState.expedition.technicalCondition.pa < 100)
      assert.ok(nextState.expedition.technicalCondition.instruments < 100)
      assert.ok(nextState.expedition.technicalCondition.stageGear < 100)
    }
  )

  await t.test('translates performance profile into UI active effects', () => {
    const profile = getExpeditionConditionPerformanceProfile({
      pa: 20, // hazard 2, timing x0.96
      instruments: 20, // timing x0.93, stamina x1.15
      stageGear: 0, // disabled, combo x0.85
      defects: []
    })
    const effects = getExpeditionConditionActiveEffects(profile)
    assert.ok(effects.some(e => e.key === 'ui:pregig.effects.audioHazard2'))
    assert.ok(effects.some(e => e.key === 'ui:pregig.effects.timingPenalty'))
    assert.ok(
      effects.some(e => e.key === 'ui:pregig.effects.missStaminaPenalty')
    )
    assert.ok(
      effects.some(e => e.key === 'ui:pregig.effects.comboRecoveryPenalty')
    )
    assert.ok(
      effects.some(e => e.key === 'ui:pregig.effects.disabled_stageGear')
    )
  })
})
