import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { formatSlotZonePercent, getSlotZonePositionStyle } from '../../src/utils/assetSections/slotLayout.ts'

describe('slot layout helpers', () => {
  it('formats percent rectangle values as stable CSS percentages', () => {
    assert.equal(formatSlotZonePercent(2.5), '2.5%')
    assert.equal(formatSlotZonePercent(35), '35%')
    assert.equal(formatSlotZonePercent(33.333333), '33.3333%')
  })

  it('calculates positioning style object from zone coordinates', () => {
    const zone = { x: 0.5, y: 0.55, w: 0.3, h: 0.2 }
    const style = getSlotZonePositionStyle(zone)
    assert.deepEqual(style, {
      left: '35%',
      top: '45%',
      width: '30%',
      height: '20%'
    })
  })
})
