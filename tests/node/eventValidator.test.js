import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateGameEvent } from '../../src/utils/eventValidator.ts'
import { ALL_RAW_EVENTS, EVENTS_DB } from '../../src/data/events/index.ts'

describe('validateGameEvent', () => {
  const baseEvent = {
    id: 'test_event',
    category: 'band',
    title: 'events:test.title',
    description: 'events:test.desc',
    options: [
      {
        label: 'events:test.opt1.label',
        outcomeText: 'events:test.opt1.outcome',
        effect: { type: 'stat', stat: 'harmony', value: -5 }
      }
    ]
  }

  it('accepts a valid base event', () => {
    assert.strictEqual(validateGameEvent(baseEvent), true)
  })

  it('throws when id is missing', () => {
    const e = { ...baseEvent, id: '' }
    assert.throws(() => validateGameEvent(e), /id/)
  })

  it('throws when title does not start with events:', () => {
    const e = { ...baseEvent, title: 'Bad Title' }
    assert.throws(() => validateGameEvent(e), /title/)
  })

  it('throws when options is empty', () => {
    const e = { ...baseEvent, options: [] }
    assert.throws(() => validateGameEvent(e), /options/)
  })

  it('throws when an option is null', () => {
    const e = { ...baseEvent, options: [null] }
    assert.throws(() => validateGameEvent(e), /non-null object/)
  })

  it('throws when an option label does not start with events:', () => {
    const e = {
      ...baseEvent,
      options: [
        { label: 'Bad Label', outcomeText: 'events:x.outcome', effect: {} }
      ]
    }
    assert.throws(() => validateGameEvent(e), /label/)
  })

  it('throws when an option outcomeText does not start with events:', () => {
    const e = {
      ...baseEvent,
      options: [
        { label: 'events:x.label', outcomeText: 'Bad outcome', effect: {} }
      ]
    }
    assert.throws(() => validateGameEvent(e), /outcomeText/)
  })

  it('throws when an option has no effect and no skillCheck', () => {
    const e = {
      ...baseEvent,
      options: [{ label: 'events:x.label', outcomeText: 'events:x.outcome' }]
    }
    assert.throws(() => validateGameEvent(e), /effect/)
  })

  it('throws when crisis-tagged event id does not start with crisis_', () => {
    const e = { ...baseEvent, tags: ['crisis'], id: 'bad_id', chance: 0.1 }
    assert.throws(() => validateGameEvent(e), /crisis_/)
  })

  it('throws when crisis-tagged event has NaN chance', () => {
    const e = { ...baseEvent, tags: ['crisis'], id: 'crisis_test', chance: NaN }
    assert.throws(() => validateGameEvent(e), /chance/)
  })

  it('throws when event has prerequisiteEventId but it is empty', () => {
    const e = { ...baseEvent, prerequisiteEventId: '' }
    assert.throws(() => validateGameEvent(e), /prerequisiteEventId/)
  })

  it('throws when event has questId but it is empty', () => {
    const e = { ...baseEvent, questId: '' }
    assert.throws(() => validateGameEvent(e), /questId/)
  })
})

describe('EVENTS_DB — all events pass validateGameEvent', () => {
  for (const [category, events] of Object.entries(EVENTS_DB)) {
    it(`all ${category} events are valid`, () => {
      assert.ok(Array.isArray(events), `${category} must be an array`)
      for (const event of events) {
        try {
          validateGameEvent(event)
        } catch (err) {
          assert.fail(
            `${category} event "${event?.id ?? '(no id)'}" failed validation: ${err instanceof Error ? err.message : String(err)}`
          )
        }
      }
    })
  }
})

describe('validateGameEvent — social_set and item effect targets', () => {
  const withEffect = effect => ({
    id: 'target_event',
    category: 'band',
    title: 'events:test.title',
    description: 'events:test.desc',
    options: [
      {
        label: 'events:test.opt1.label',
        outcomeText: 'events:test.opt1.outcome',
        effect
      }
    ]
  })

  const rejected = [
    ['a __proto__ stat', { type: 'social_set', stat: '__proto__', value: {} }],
    [
      'a constructor stat',
      { type: 'social_set', stat: 'constructor', value: 1 }
    ],
    ['an unknown stat', { type: 'social_set', stat: 'followers', value: 5 }],
    ['a NaN value', { type: 'social_set', stat: 'loyalty', value: Number.NaN }],
    [
      'an Infinity value',
      { type: 'social_set', stat: 'loyalty', value: Number.POSITIVE_INFINITY }
    ],
    ['a string value', { type: 'social_set', stat: 'loyalty', value: '5' }],
    ['an unknown trend', { type: 'social_set', stat: 'trend', value: 'HYPE' }],
    ['a __proto__ item', { type: 'item', item: '__proto__', value: true }],
    ['a constructor item', { type: 'item', item: 'constructor' }],
    ['an unknown item', { type: 'item', item: 'laser_cannon' }],
    ['a NaN item value', { type: 'item', item: 'strings', value: Number.NaN }],
    ['a string item value', { type: 'item', item: 'strings', value: 'x' }]
  ]
  for (const [label, effect] of rejected) {
    it(`rejects ${label}`, () => {
      assert.throws(() => validateGameEvent(withEffect(effect)))
    })
  }

  it('rejects a bad target inside a composite', () => {
    const composite = {
      type: 'composite',
      effects: [{ type: 'social_set', stat: '__proto__', value: {} }]
    }
    assert.throws(() => validateGameEvent(withEffect(composite)))
  })

  const accepted = [
    ['egoFocus null', { type: 'social_set', stat: 'egoFocus', value: null }],
    ['egoFocus name', { type: 'social_set', stat: 'egoFocus', value: 'Matze' }],
    ['a known trend', { type: 'social_set', stat: 'trend', value: 'DRAMA' }],
    ['a finite stat', { type: 'social_set', stat: 'loyalty', value: 10 }],
    ['a bare golden_pick grant', { type: 'item', item: 'golden_pick' }],
    ['an item quantity', { type: 'item', item: 'strings', value: -2 }]
  ]
  for (const [label, effect] of accepted) {
    it(`accepts ${label}`, () => {
      assert.strictEqual(validateGameEvent(withEffect(effect)), true)
    })
  }
})

describe('ALL_RAW_EVENTS — the validator drops no shipped event', () => {
  it('every raw registry event passes validateGameEvent', () => {
    for (const event of ALL_RAW_EVENTS) {
      assert.doesNotThrow(
        () => validateGameEvent(event),
        `event "${event?.id ?? '(no id)'}" is rejected`
      )
    }
    const registered = Object.values(EVENTS_DB).flat().length
    assert.equal(registered, ALL_RAW_EVENTS.length)
  })
})
