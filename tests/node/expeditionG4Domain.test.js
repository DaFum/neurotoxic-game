import assert from 'node:assert/strict'
import test from 'node:test'

import {
  EXPEDITION_CONTRACTS_BY_ID,
  MAX_NATIVE_EXPEDITION_CONTRACTS
} from '../../src/data/expedition/contracts.ts'
import {
  areExpeditionContractsCompatible,
  evaluateExpeditionConstraint,
  materializeContractConstraints
} from '../../src/domain/expedition/contracts.ts'
import { getExpeditionCrowdHypeProfile } from '../../src/domain/expedition/crowdHype.ts'
import { EXPEDITION_FINALES_BY_ID } from '../../src/data/expedition/finales.ts'
import { selectExpeditionFinaleType } from '../../src/domain/expedition/finales.ts'
import { deriveExpeditionDraftCandidates } from '../../src/domain/expedition/runDrafts.ts'

test('G4 contract registry is complete, numeric, and generically evaluable', () => {
  assert.equal(MAX_NATIVE_EXPEDITION_CONTRACTS, 2)
  assert.deepEqual([...EXPEDITION_CONTRACTS_BY_ID.keys()].sort(), [
    'contract_all_in',
    'contract_keep_it_clean',
    'contract_no_rest_finale',
    'contract_route_target',
    'contract_three_good_gigs'
  ])
  for (const template of EXPEDITION_CONTRACTS_BY_ID.values()) {
    assert.ok(Number.isFinite(template.reward.money))
    assert.ok(Number.isFinite(template.failure.heat))
    for (const constraint of template.constraints) {
      if (constraint.kind !== 'visit_matching_node') {
        assert.equal(
          typeof evaluateExpeditionConstraint(constraint, {}),
          'object'
        )
      }
    }
  }
})

test('contract compatibility and route materialization are canonical', () => {
  assert.equal(
    areExpeditionContractsCompatible([
      'contract_keep_it_clean',
      'contract_all_in'
    ]),
    false
  )
  assert.equal(
    areExpeditionContractsCompatible([
      'contract_three_good_gigs',
      'contract_all_in'
    ]),
    true
  )
  assert.equal(
    areExpeditionContractsCompatible(['contract_all_in', 'contract_all_in']),
    false
  )
  const template = EXPEDITION_CONTRACTS_BY_ID.get('contract_route_target')
  const map = {
    nodeOrder: ['start', 'special'],
    meta: {
      start: { nodeClass: 'START', specialSubtype: null },
      special: { nodeClass: 'SPECIAL', specialSubtype: 'RIVAL_ENCOUNTER' }
    }
  }
  assert.deepEqual(materializeContractConstraints(template, map), [
    { id: 'visit_route_target', kind: 'visit_node', targetNodeId: 'special' }
  ])
})

test('crowd hype affects only the declared combo multiplier bands', () => {
  assert.equal(getExpeditionCrowdHypeProfile(39).comboBonusMultiplier, 1)
  assert.equal(getExpeditionCrowdHypeProfile(40).comboBonusMultiplier, 1.1)
  assert.equal(getExpeditionCrowdHypeProfile(70).comboBonusMultiplier, 1.18)
  assert.equal(getExpeditionCrowdHypeProfile(90).comboBonusMultiplier, 1.25)
})

test('finale profiles are complete and priority is deterministic', () => {
  assert.equal(EXPEDITION_FINALES_BY_ID.size, 6)
  assert.equal(
    selectExpeditionFinaleType({ specialFinaleRequired: true }),
    'contract_special'
  )
  assert.equal(selectExpeditionFinaleType({ nemesisLevel: 4 }), 'rival_battle')
  assert.equal(
    selectExpeditionFinaleType({ technicalConditionAggregate: 24 }),
    'disaster_gig'
  )
  assert.equal(selectExpeditionFinaleType({ heat: 75 }), 'illegal_show')
  assert.equal(
    selectExpeditionFinaleType({ exposure: 60, hasSponsorObligation: true }),
    'corporate_showcase'
  )
  assert.equal(selectExpeditionFinaleType({}), 'regional_headliner')
})

test('run draft candidates are deterministic, unique, and always contain three options', () => {
  const first = deriveExpeditionDraftCandidates(42, 'node:abc', [
    'road_warrior'
  ])
  const second = deriveExpeditionDraftCandidates(42, 'node:abc', [
    'road_warrior'
  ])
  assert.deepEqual(first, second)
  assert.equal(first.length, 3)
  assert.equal(new Set(first).size, 3)
  assert.ok(!first.includes('road_warrior'))
})
