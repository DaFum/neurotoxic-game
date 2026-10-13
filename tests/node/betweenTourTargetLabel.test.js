import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getBetweenTourTargetLabel } from '../../src/utils/betweenTourTargetLabel'

const t = key => `t(${key})`

const context = {
  members: [{ id: 'matze', name: 'Matze', mood: 50, stamina: 50 }],
  rivalsById: {
    rival_abc: {
      snapshot: { id: 'rival_abc', name: 'Grim Harvest' },
      history: {}
    }
  }
}

describe('getBetweenTourTargetLabel', () => {
  it('names Crew through their displayNameKey', () => {
    assert.equal(
      getBetweenTourTargetLabel({ kind: 'crew', id: 'mika' }, t, context),
      't(ui:expedition.crew.mika)'
    )
  })

  it('names band members and Rivals by their stored names', () => {
    assert.equal(
      getBetweenTourTargetLabel({ kind: 'band', id: 'matze' }, t, context),
      'Matze'
    )
    assert.equal(
      getBetweenTourTargetLabel({ kind: 'rival', id: 'rival_abc' }, t, context),
      'Grim Harvest'
    )
  })

  it('names Sponsors through the brand-deal catalog key', () => {
    assert.equal(
      getBetweenTourTargetLabel(
        { kind: 'sponsor', id: 'energy_drink_cx' },
        (key, options) =>
          key === 'economy:brandDeals.energy_drink_cx.name'
            ? 'Toxic Energy Drink'
            : String(options?.defaultValue ?? key),
        context
      ),
      'Toxic Energy Drink'
    )
  })

  it('names Archive leads through the Region label', () => {
    assert.equal(
      getBetweenTourTargetLabel(
        { kind: 'archive', id: 'industrial_belt' },
        t,
        context
      ),
      't(ui:expedition.region.industrial_belt)'
    )
  })

  it('never leaks a raw id when the actor no longer resolves', () => {
    const unknown = 't(ui:expedition.betweenTour.unknownTarget)'
    for (const target of [
      { kind: 'crew', id: 'ghost_crew' },
      { kind: 'band', id: 'ghost_member' },
      { kind: 'rival', id: '__proto__' },
      { kind: 'sponsor', id: 'corp_tech_missing' },
      { kind: 'archive', id: 'nowhere' }
    ]) {
      const label = getBetweenTourTargetLabel(target, t, context)
      assert.equal(label, unknown, `${target.kind}:${target.id}`)
      assert.ok(!label.includes(target.id))
    }
  })
})
