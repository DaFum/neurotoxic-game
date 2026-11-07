import test from 'node:test'
import assert from 'node:assert'
import {
  ZEALOTRY_ACTIONS,
  createZealotryCounters
} from '../../scripts/game-balance-simulation.mjs'
import { aggregatePolicyMetrics } from '../../scripts/game-balance-zealotry.mjs'

test('zealotry counter schema', async t => {
  await t.test('action keys and order derive from ZEALOTRY_ACTIONS', () => {
    assert.deepStrictEqual(
      Object.keys(createZealotryCounters().actions),
      Object.keys(ZEALOTRY_ACTIONS)
    )
    assert.deepStrictEqual(Object.keys(ZEALOTRY_ACTIONS), [
      'sermon',
      'leak',
      'cult',
      'pirate'
    ])
  })

  await t.test('each call returns independent nested counters', () => {
    const a = createZealotryCounters('x')
    const b = createZealotryCounters('x')
    a.actions.sermon.attempted++
    a.actions.sermon.rejections.gate++
    assert.strictEqual(b.actions.sermon.attempted, 0)
    assert.strictEqual(b.actions.sermon.rejections.gate, 0)
    assert.notStrictEqual(a.actions.sermon, a.actions.leak)
    assert.notStrictEqual(
      a.actions.sermon.rejections,
      a.actions.leak.rejections
    )
  })

  await t.test('aggregation totals use the same schema', () => {
    const zp = createZealotryCounters('legal-stack')
    zp.actions.cult.attempted = 2
    zp.actions.cult.eligible = 1
    const runs = [{ zealotryPolicy: zp }]
    const { actionTotals } = aggregatePolicyMetrics(runs, runs, 'seed')
    assert.deepStrictEqual(
      Object.keys(actionTotals),
      Object.keys(ZEALOTRY_ACTIONS)
    )
    assert.strictEqual(actionTotals.cult.attempted, 2)
    assert.strictEqual(actionTotals.pirate.attempted, 0)
  })

  await t.test('unknown action in counters throws, never dropped', () => {
    const zp = createZealotryCounters('legal-stack')
    zp.actions.newAction = { attempted: 3 }
    const runs = [{ zealotryPolicy: zp }]
    assert.throws(
      () => aggregatePolicyMetrics(runs, runs, 'seed'),
      /Unknown zealotry action in counters: newAction/
    )
  })

  await t.test('known rejection reasons sum across runs', () => {
    const a = createZealotryCounters('legal-stack')
    const b = createZealotryCounters('legal-stack')
    a.actions.leak.rejections.cash = 2
    b.actions.leak.rejections.cash = 3
    b.actions.leak.rejections.daily_marker = 1
    const runs = [{ zealotryPolicy: a }, { counters: { zealotryPolicy: b } }]
    const { actionTotals } = aggregatePolicyMetrics(runs, runs, 'seed')
    assert.deepStrictEqual(actionTotals.leak.rejections, {
      daily_marker: 1,
      gate: 0,
      cash: 5,
      harmony: 0
    })
  })

  await t.test('unknown rejection reason throws, never dropped', () => {
    for (const reason of [
      'newReason',
      'constructor',
      'toString',
      '__proto__'
    ]) {
      const zp = createZealotryCounters('legal-stack')
      Object.defineProperty(zp.actions.sermon.rejections, reason, {
        value: 1,
        enumerable: true
      })
      const runs = [{ zealotryPolicy: zp }]
      assert.throws(
        () => aggregatePolicyMetrics(runs, runs, 'seed'),
        err =>
          err instanceof RangeError &&
          err.message ===
            `Unknown zealotry rejection reason in counters: sermon.${reason}`,
        reason
      )
    }
  })
})
