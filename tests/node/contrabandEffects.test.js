import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { applySharedBandEffect } from '../../src/utils/contrabandEffects'

describe('contrabandEffects.applySharedBandEffect', () => {
  it('makes guitar_difficulty apply/revert exact additive inverses below the read-time floor', () => {
    const band = { performance: { guitarDifficulty: 1.0 } }
    applySharedBandEffect(band, 'guitar_difficulty', -0.5)
    applySharedBandEffect(band, 'guitar_difficulty', -0.7)
    // Stored value is unclamped (the rhythm game floors the divisor on read).
    assert.ok(Math.abs(band.performance.guitarDifficulty - -0.2) < 1e-9)

    // Reverting the -0.7 effect (negated value) restores the exact prior value.
    applySharedBandEffect(band, 'guitar_difficulty', 0.7)
    assert.ok(Math.abs(band.performance.guitarDifficulty - 0.5) < 1e-9)
  })

  it('treats stamina_max as a no-op (returns false) when the band has no members', () => {
    const band = {}
    assert.equal(applySharedBandEffect(band, 'stamina_max', 10), false)
    assert.equal(band.members, undefined)

    const emptyBand = { members: [] }
    assert.equal(applySharedBandEffect(emptyBand, 'stamina_max', 10), false)
    assert.deepEqual(emptyBand.members, [])
  })

  it('skips effect types outside an equipment allowlist', () => {
    const band = { tempo: 0 }
    const allowed = new Set(['luck'])
    assert.equal(applySharedBandEffect(band, 'tempo', 0.2, allowed), false)
    assert.equal(band.tempo, 0)
  })

  it('applies stress modifiers to the band for stress effectType', () => {
    const band = { stress: 10 }
    const handled = applySharedBandEffect(band, 'stress', -10)
    assert.equal(handled, true)
    assert.equal(band.stress, 0)
  })
})
