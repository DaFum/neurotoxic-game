import assert from 'node:assert/strict'
import { test, describe } from 'node:test'
import {
  parseQuestPayload,
  toQuestState
} from '../../../src/domain/questPayload'

const CURRENT_DAY = 10

describe('parseQuestPayload', () => {
  describe('accepts', () => {
    test('a bare quest id as the id variant', () => {
      const result = parseQuestPayload('quest_prove_yourself', CURRENT_DAY)

      assert.equal(result.ok, true)
      assert.deepEqual(result.payload, {
        kind: 'id',
        id: 'quest_prove_yourself'
      })
    })

    test('a full quest object as the inline variant', () => {
      const result = parseQuestPayload(
        { id: 'q1', label: 'Do a thing', required: 3 },
        CURRENT_DAY
      )

      assert.equal(result.ok, true)
      assert.equal(result.payload.kind, 'inline')
      assert.equal(result.payload.id, 'q1')
      assert.equal(result.payload.quest.required, 3)
    })

    test('a numeric deadlineOffset, resolved to an absolute deadline', () => {
      const result = parseQuestPayload(
        { id: 'q1', deadlineOffset: 5 },
        CURRENT_DAY
      )

      assert.equal(result.payload.quest.deadline, CURRENT_DAY + 5)
      assert.equal(
        Object.hasOwn(result.payload.quest, 'deadlineOffset'),
        false,
        'the relative offset must not reach the reducer'
      )
    })

    test('a padded numeric-string deadlineOffset', () => {
      const result = parseQuestPayload(
        { id: 'q1', deadlineOffset: ' 7 ' },
        CURRENT_DAY
      )

      assert.equal(result.payload.quest.deadline, CURRENT_DAY + 7)
    })
  })

  describe('rejects rather than coerces', () => {
    const cases = [
      ['a number', 42, 'not-a-quest'],
      ['null', null, 'not-a-quest'],
      ['undefined', undefined, 'not-a-quest'],
      ['an array', [], 'not-a-quest'],
      ['a boolean', true, 'not-a-quest'],
      ['an empty id string', '', 'invalid-id'],
      ['a prototype-polluting id string', '__proto__', 'invalid-id'],
      ['an object with no id', { label: 'x' }, 'invalid-id'],
      ['an object with a non-string id', { id: 123 }, 'invalid-id'],
      ['an object with an empty id', { id: '' }, 'invalid-id'],
      ['an object with a forbidden id', { id: 'constructor' }, 'invalid-id'],
      [
        'an unparseable deadlineOffset',
        { id: 'q1', deadlineOffset: 'abc' },
        'invalid-deadline-offset'
      ],
      [
        'an empty-string deadlineOffset',
        { id: 'q1', deadlineOffset: '' },
        'invalid-deadline-offset'
      ],
      [
        'a non-finite deadlineOffset',
        { id: 'q1', deadlineOffset: Number.POSITIVE_INFINITY },
        'invalid-deadline-offset'
      ],
      [
        'a NaN deadlineOffset',
        { id: 'q1', deadlineOffset: Number.NaN },
        'invalid-deadline-offset'
      ],
      [
        'a structurally invalid body',
        { id: 'q1', progressRules: [1, 2, 3] },
        'malformed-quest'
      ],
      [
        'a non-positive required count',
        { id: 'q1', required: 0 },
        'malformed-quest'
      ]
    ]

    for (const [name, raw, reason] of cases) {
      test(`${name} -> ${reason}`, () => {
        const result = parseQuestPayload(raw, CURRENT_DAY)

        assert.equal(result.ok, false, `${name} must be rejected`)
        assert.equal(result.reason, reason)
      })
    }

    test('a payload carrying a prototype-polluting key', () => {
      const hostile = JSON.parse('{"id":"q1","__proto__":{"admin":true}}')
      const result = parseQuestPayload(hostile, CURRENT_DAY)

      assert.equal(result.ok, false)
      assert.equal(result.reason, 'forbidden-keys')
    })

    test('a payload nesting a prototype-polluting key', () => {
      const hostile = JSON.parse(
        '{"id":"q1","rewardData":{"__proto__":{"admin":true}}}'
      )
      const result = parseQuestPayload(hostile, CURRENT_DAY)

      assert.equal(result.ok, false)
      assert.equal(result.reason, 'forbidden-keys')
    })

    test('rejection reasons never echo the hostile value', () => {
      const result = parseQuestPayload(
        { id: 'q1', deadlineOffset: '<script>alert(1)</script>' },
        CURRENT_DAY
      )

      assert.equal(result.ok, false)
      assert.doesNotMatch(result.reason, /script/)
    })
  })

  test('does not mutate the caller-supplied payload', () => {
    const raw = { id: 'q1', deadlineOffset: 5 }
    parseQuestPayload(raw, CURRENT_DAY)

    assert.equal(raw.deadlineOffset, 5)
    assert.equal(Object.hasOwn(raw, 'deadline'), false)
  })
})

describe('toQuestState', () => {
  test('collapses the id variant to a minimal quest', () => {
    assert.deepEqual(toQuestState({ kind: 'id', id: 'q1' }), { id: 'q1' })
  })

  test('returns the inline quest unchanged', () => {
    const quest = { id: 'q1', label: 'x' }

    assert.equal(toQuestState({ kind: 'inline', id: 'q1', quest }), quest)
  })
})
