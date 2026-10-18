/**
 * @fileoverview A hostile win downgrades a friendly Rival instead of erasing it.
 *
 * The spec lets a Rival move toward Respect or Alliance. A hostile Finale or
 * Social result walks that back one step at a time, and Nemesis level 4 stays
 * the only way to the Nemesis relationship.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getHostileRivalRelationship } from '../../src/domain/expedition/rivals.ts'

describe('hostile rival relationship', () => {
  it('downgrades an alliance to respect, then respect to rival', () => {
    assert.equal(getHostileRivalRelationship('alliance', 1), 'respect')
    assert.equal(getHostileRivalRelationship('respect', 2), 'rival')
  })

  it('makes unknown or competitive rivals hostile', () => {
    assert.equal(getHostileRivalRelationship('unknown', 1), 'rival')
    assert.equal(getHostileRivalRelationship('competitive', 1), 'rival')
    assert.equal(getHostileRivalRelationship('rival', 2), 'rival')
  })

  it('reaches nemesis only at level 4, whatever it was before', () => {
    assert.equal(getHostileRivalRelationship('alliance', 4), 'nemesis')
    assert.equal(getHostileRivalRelationship('rival', 3), 'rival')
    assert.equal(getHostileRivalRelationship('nemesis', 4), 'nemesis')
  })
})
