// TODO: Implement this
import { describe, it, expect } from 'vitest'
import { FINANCIAL_EVENTS } from '../src/data/events/financial'
import { RELATIONSHIP_EVENTS } from '../src/data/events/relationshipEvents'
import { SPECIAL_EVENTS } from '../src/data/events/special'
import { CONSEQUENCE_EVENTS } from '../src/data/events/consequences'

const hasValidOptions = evt =>
  Array.isArray(evt.options) && evt.options.length > 0

describe('event data tables', () => {
  it('financial events contain valid structure and category', () => {
    expect(FINANCIAL_EVENTS.length).toBeGreaterThan(0)
    FINANCIAL_EVENTS.forEach(evt => {
      expect(evt.category).toBe('financial')
      expect(evt.chance).toBeGreaterThan(0)
      expect(evt.chance).toBeLessThanOrEqual(1)
      expect(hasValidOptions(evt)).toBe(true)
    })
  })

  it('relationship events expose conditional availability branches', () => {
    expect(RELATIONSHIP_EVENTS.length).toBeGreaterThan(0)
    expect(
      RELATIONSHIP_EVENTS.some(evt => typeof evt.condition === 'function')
    ).toBe(true)

    const toxic = RELATIONSHIP_EVENTS.find(evt => evt.id === 'toxic_infighting')
    expect(
      toxic.condition({
        band: {
          members: [{ name: 'A', relationships: { B: 10 } }, { name: 'B' }]
        }
      })
    ).toEqual({ member1: 'A', member2: 'B' })
    expect(
      toxic.condition({
        band: {
          members: [{ name: 'A', relationships: { B: 60 } }, { name: 'B' }]
        }
      })
    ).toBe(false)
  })

  it('special events have valid optional reward/penalty effects', () => {
    expect(SPECIAL_EVENTS.length).toBeGreaterThan(0)
    SPECIAL_EVENTS.forEach(evt => {
      expect(evt.category).toBe('special')
      expect(hasValidOptions(evt)).toBe(true)
    })
    expect(
      SPECIAL_EVENTS.some(evt =>
        evt.options.some(opt => opt.effect || opt.skillCheck)
      )
    ).toBe(true)
  })

  it('consequence events evaluate positive/negative condition branches safely', () => {
    expect(CONSEQUENCE_EVENTS.length).toBeGreaterThan(0)

    const venueComplaint = CONSEQUENCE_EVENTS.find(
      evt => evt.id === 'consequences_venue_complaint'
    )
    const positive = venueComplaint.condition({
      lastGigStats: { score: 10 },
      eventCooldowns: []
    })
    const negative = venueComplaint.condition({
      lastGigStats: { score: 90 },
      eventCooldowns: []
    })

    expect(positive).toBe(true)
    expect(negative).toBe(false)
    expect(() => venueComplaint.condition({})).not.toThrow()

    const allIds = new Set(CONSEQUENCE_EVENTS.map(evt => evt.id))
    expect(allIds.size).toBe(CONSEQUENCE_EVENTS.length)
  })
})
