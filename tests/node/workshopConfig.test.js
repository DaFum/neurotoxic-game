import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  WORKSHOP_SLOT_ZONES,
  WORKSHOP_T1_SLOTS,
  WORKSHOP_T2_SLOTS,
  WORKSHOP_T3_SLOTS
} from '../../src/utils/assetSections/workshopConfig.ts'

describe('WORKSHOP_SLOT_ZONES', () => {
  it('defines tier slot progression for the merch workshop', () => {
    assert.deepEqual(
      [...WORKSHOP_T1_SLOTS],
      ['mw_print', 'mw_drying', 'mw_storage']
    )
    assert.deepEqual(
      [...WORKSHOP_T2_SLOTS],
      ['mw_print', 'mw_drying', 'mw_storage', 'mw_cutting', 'mw_packaging']
    )
    assert.deepEqual(
      [...WORKSHOP_T3_SLOTS],
      [
        'mw_print',
        'mw_drying',
        'mw_storage',
        'mw_cutting',
        'mw_packaging',
        'mw_specialty',
        'mw_sales',
        'mw_automation'
      ]
    )
  })

  it('maps every workshop slot type to a normalized production-line zone', () => {
    const workshopSlotTypes = [
      ...new Set([
        ...WORKSHOP_T1_SLOTS,
        ...WORKSHOP_T2_SLOTS,
        ...WORKSHOP_T3_SLOTS
      ])
    ]

    for (const slotType of workshopSlotTypes) {
      const zone = WORKSHOP_SLOT_ZONES[slotType]
      assert.ok(zone, `${slotType} missing zone`)
      assert.ok(zone.x >= 0 && zone.x <= 1, `${slotType} x normalized`)
      assert.ok(zone.y >= 0 && zone.y <= 1, `${slotType} y normalized`)
      assert.ok(zone.w > 0 && zone.w <= 1, `${slotType} w normalized`)
      assert.ok(zone.h > 0 && zone.h <= 1, `${slotType} h normalized`)
    }
  })

  it('keeps main stations ordered left to right along the conveyor line', () => {
    const mainLine = [
      'mw_print',
      'mw_drying',
      'mw_cutting',
      'mw_packaging',
      'mw_storage'
    ]

    for (let i = 1; i < mainLine.length; i += 1) {
      const previous = WORKSHOP_SLOT_ZONES[mainLine[i - 1]]
      const current = WORKSHOP_SLOT_ZONES[mainLine[i]]
      assert.ok(previous && current)
      assert.ok(
        current.x > previous.x,
        `${current} should be right of ${previous}`
      )
      assert.equal(current.y, 0.5, `${current} should stay on main line`)
    }
  })

  it('places specialty and automation above the line and sales at the right gate', () => {
    assert.ok(WORKSHOP_SLOT_ZONES.mw_specialty)
    assert.ok(WORKSHOP_SLOT_ZONES.mw_automation)
    assert.ok(WORKSHOP_SLOT_ZONES.mw_sales)
    assert.ok(WORKSHOP_SLOT_ZONES.mw_specialty.y < 0.5)
    assert.ok(WORKSHOP_SLOT_ZONES.mw_automation.y < 0.5)
    assert.ok(WORKSHOP_SLOT_ZONES.mw_sales.x > WORKSHOP_SLOT_ZONES.mw_storage.x)
  })
})
