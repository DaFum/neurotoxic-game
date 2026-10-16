import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

mock.module('../../src/data/events/index.ts', {
  namedExports: {
    EVENTS_DB: {
      band: [
        {
          id: 'fixture_event',
          options: [
            {
              id: 'ordinary_locked',
              effect: { type: 'stat', stat: 'harmony', value: 1 },
              condition: state => state.allowed
            },
            {
              id: 'expedition_locked',
              effects: [
                { type: 'expedition', result: 'attention_drawn' },
                [{ type: 'expedition', result: 'equipment_scuffed' }],
                { type: 'expedition', result: 'forged_result' }
              ],
              condition: () => false
            },
            {
              id: 'throws',
              condition: () => {
                throw new Error('unavailable')
              }
            },
            {
              id: 'open',
              effect: { type: 'expedition', result: 'attention_faded' }
            }
          ]
        }
      ]
    }
  }
})

const {
  isDeclaredExpeditionEventResult,
  isExpeditionEventOptionAvailable,
  isValidExpeditionEventProofId
} = await import('../../src/domain/expedition/eventProof.ts')

test('conditions are enforced even on options without Expedition results', () => {
  assert.equal(
    isExpeditionEventOptionAvailable(
      { allowed: false },
      'fixture_event',
      'ordinary_locked'
    ),
    false
  )
  assert.equal(
    isExpeditionEventOptionAvailable(
      { allowed: true },
      'fixture_event',
      'ordinary_locked'
    ),
    true
  )
  for (const id of ['expedition_locked', 'throws']) {
    assert.equal(
      isExpeditionEventOptionAvailable({}, 'fixture_event', id),
      false
    )
  }
  assert.equal(
    isExpeditionEventOptionAvailable({}, 'fixture_event', 'open'),
    true
  )
})

test('proofs accept only declared option/result pairs from nested effects', () => {
  for (const id of ['attention_drawn', 'equipment_scuffed']) {
    assert.equal(
      isDeclaredExpeditionEventResult('fixture_event', 'expedition_locked', id),
      true
    )
    assert.equal(
      isValidExpeditionEventProofId(`fixture_event:expedition_locked:${id}:3`),
      true
    )
  }
  for (const [option, result] of [
    ['expedition_locked', 'forged_result'],
    ['ordinary_locked', 'attention_drawn'],
    ['open', 'attention_drawn']
  ]) {
    assert.equal(
      isDeclaredExpeditionEventResult('fixture_event', option, result),
      false
    )
  }
})
