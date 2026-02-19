import assert from 'node:assert'
import { test } from 'node:test'
import { getScheduledHitTimeMs } from '../src/utils/audio/timingUtils.js'

test('getScheduledHitTimeMs', async t => {
  await t.test('schedules within lead window', () => {
    const scheduledMs = getScheduledHitTimeMs({
      noteTimeMs: 1050,
      gigTimeMs: 1000,
      audioTimeMs: 1000,
      maxLeadMs: 60
    })
    assert.strictEqual(scheduledMs, 1050)
  })

  await t.test('fires immediately when outside lead window', () => {
    const scheduledMs = getScheduledHitTimeMs({
      noteTimeMs: 1200,
      gigTimeMs: 1000,
      audioTimeMs: 1000,
      maxLeadMs: 30
    })
    assert.strictEqual(scheduledMs, 1000)
  })

  await t.test('handles clock offsets between gig and audio time', () => {
    const scheduledMs = getScheduledHitTimeMs({
      noteTimeMs: 1700,
      gigTimeMs: 1500,
      audioTimeMs: 1600,
      maxLeadMs: 200
    })
    assert.strictEqual(scheduledMs, 1800)
  })
})
