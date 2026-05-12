import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateGameEvent } from '../src/utils/eventValidator.ts'
import { EVENTS_DB } from '../src/data/events/index.ts'

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

  it('throws when an option has no label', () => {
    const e = {
      ...baseEvent,
      options: [{ label: '', outcomeText: 'events:x.outcome', effect: {} }]
    }
    assert.throws(() => validateGameEvent(e), /label/)
  })

  it('throws when an option has no effect and no skillCheck', () => {
    const e = {
      ...baseEvent,
      options: [{ label: 'events:x.label', outcomeText: 'events:x.outcome' }]
    }
    assert.throws(() => validateGameEvent(e), /effect/)
  })

  it('throws when crisis event id does not start with crisis_', () => {
    const e = {
      ...baseEvent,
      category: 'crisis',
      tags: ['crisis'],
      id: 'bad_id',
      chance: 0.1,
      trigger: 'random'
    }
    assert.throws(() => validateGameEvent(e), /crisis_/)
  })

  it('throws when consequence event has no prerequisiteEventId', () => {
    const e = { ...baseEvent, category: 'consequences' }
    assert.throws(() => validateGameEvent(e), /prerequisiteEventId/)
  })

  it('throws when quest event has no questId', () => {
    const e = { ...baseEvent, category: 'quest' }
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
