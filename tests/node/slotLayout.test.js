import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { formatSlotZonePercent } from '../../src/utils/assetSections/slotLayout.ts'

describe('slot layout helpers', () => {
  it('formats percent rectangle values as stable CSS percentages', () => {
    assert.equal(formatSlotZonePercent(2.5), '2.5%')
    assert.equal(formatSlotZonePercent(35), '35%')
    assert.equal(formatSlotZonePercent(33.333333), '33.3333%')
  })
})
