import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { deriveGigVisualStatus } from '../../src/utils/gigVisualStatus'

describe('deriveGigVisualStatus', () => {
  describe('overloadDanger', () => {
    it('is false at or below the 80 threshold', () => {
      assert.strictEqual(deriveGigVisualStatus({ overload: 79 }).overloadDanger, false)
      assert.strictEqual(deriveGigVisualStatus({ overload: 80 }).overloadDanger, false)
    })

    it('is true above the 80 threshold', () => {
      assert.strictEqual(deriveGigVisualStatus({ overload: 81 }).overloadDanger, true)
    })
  })

  describe('overloadCritical', () => {
    it('is false at or below the 90 threshold', () => {
      assert.strictEqual(deriveGigVisualStatus({ overload: 89 }).overloadCritical, false)
      assert.strictEqual(deriveGigVisualStatus({ overload: 90 }).overloadCritical, false)
    })

    it('is true above the 90 threshold', () => {
      assert.strictEqual(deriveGigVisualStatus({ overload: 91 }).overloadCritical, true)
    })
  })

  describe('corruptionDanger', () => {
    it('is false at or below the 80 threshold', () => {
      assert.strictEqual(deriveGigVisualStatus({ corruptionLevel: 79 }).corruptionDanger, false)
      assert.strictEqual(deriveGigVisualStatus({ corruptionLevel: 80 }).corruptionDanger, false)
    })

    it('is true above the 80 threshold', () => {
      assert.strictEqual(deriveGigVisualStatus({ corruptionLevel: 81 }).corruptionDanger, true)
    })
  })
})
