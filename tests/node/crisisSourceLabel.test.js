import test from 'node:test'
import assert from 'node:assert/strict'
import { getCrisisSourceLabel } from '../../src/ui/expedition/crisisSourceLabel.ts'

// Echoes the key so each assertion names the translation it resolved to; a
// defaultValue is honoured the way i18next honours it for a missing key.
const t = (key, options) => {
  if (key === 'venues:berlin_so36.name') return 'SO36'
  return options && Object.hasOwn(options, 'defaultValue')
    ? `${key}|${options.defaultValue}`
    : key
}

const context = {
  gameMap: {
    nodes: {
      exp_4_0: {
        venue: { id: 'berlin_so36', name: 'venues:berlin_so36.name' }
      },
      exp_5_0: { type: 'SPECIAL' }
    },
    connections: []
  },
  members: [{ id: 'matze', name: 'Matze' }, null],
  obligations: [
    { id: 'obl_1', sourceType: 'native', sourceId: 'contract_all_in' }
  ]
}

test('bankruptcy sources map to the fixed resource labels', () => {
  assert.equal(
    getCrisisSourceLabel(t, 'bankruptcy', 'expedition_cash', context),
    'ui:expedition.crisis.source.expedition_cash'
  )
  assert.equal(
    getCrisisSourceLabel(
      t,
      'bankruptcy',
      'expedition_unpaid_obligation',
      context
    ),
    'ui:expedition.crisis.source.expedition_unpaid_obligation'
  )
})

test('a stranded run names the venue of its node, or the route', () => {
  assert.equal(
    getCrisisSourceLabel(t, 'fuel_stranded', 'exp_4_0', context),
    'SO36'
  )
  for (const sourceId of ['exp_5_0', 'exp_9_9', 'expedition_route']) {
    assert.equal(
      getCrisisSourceLabel(t, 'fuel_stranded', sourceId, context),
      'ui:expedition.crisis.source.expedition_route'
    )
  }
})

test('technical shutdowns name the condition group', () => {
  assert.equal(
    getCrisisSourceLabel(t, 'technical_shutdown', 'stageGear', context),
    'ui:expedition.condition.group.stageGear'
  )
  assert.equal(
    getCrisisSourceLabel(t, 'technical_shutdown', 'not_a_group', context),
    'ui:expedition.crisis.source.unknown'
  )
})

test('crew collapses name the band member or the Crew member', () => {
  assert.equal(
    getCrisisSourceLabel(t, 'crew_collapse', 'matze', context),
    'Matze'
  )
  assert.equal(
    getCrisisSourceLabel(t, 'crew_collapse', 'mika', context),
    'ui:expedition.crew.mika'
  )
  assert.equal(
    getCrisisSourceLabel(t, 'crew_collapse', 'ghost', context),
    'ui:expedition.crisis.source.unknown'
  )
})

test('authority proofs resolve to the authority label, not the proof id', () => {
  assert.equal(
    getCrisisSourceLabel(t, 'authority_crisis', 'authority:run_1:4', context),
    'ui:expedition.crisis.source.authority'
  )
})

test('contract breaches name the contract behind the obligation', () => {
  assert.equal(
    getCrisisSourceLabel(t, 'critical_contract_breach', 'obl_1', context),
    'ui:expedition.contract.contract_all_in|ui:expedition.crisis.source.unknown'
  )
  assert.equal(
    getCrisisSourceLabel(t, 'critical_contract_breach', 'obl_404', context),
    'ui:expedition.crisis.source.unknown'
  )
})

test('prototype keys never resolve against the map or the Crew registry', () => {
  assert.equal(
    getCrisisSourceLabel(t, 'fuel_stranded', '__proto__', context),
    'ui:expedition.crisis.source.expedition_route'
  )
  assert.equal(
    getCrisisSourceLabel(t, 'crew_collapse', 'constructor', context),
    'ui:expedition.crisis.source.unknown'
  )
})
