import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { FLAGS } from '../../src/data/flags.registry'
import { EVENTS_DB } from '../../src/data/events/index'
import { filterEvents } from '../../src/utils/eventEngine/filterEvents'
import { selectEvent } from '../../src/utils/eventEngine/eventSelection'
import { validateGameEvent } from '../../src/utils/eventValidator'

// Every story-arc outcome flag (plus the in-progress Prove Yourself flag)
// must unlock an aftermath beat, so finishing or failing an arc has a
// consequence. APOLOGY_TOUR_COMPLETE is already read by the comeback chain.
const AFTERMATH_FLAGS = [
  FLAGS.APOLOGY_TOUR_FAILED,
  FLAGS.BACK_FROM_PIT_COMPLETE,
  FLAGS.BACK_FROM_PIT_FAILED,
  FLAGS.BAND_PACT_COMPLETE,
  FLAGS.BAND_PACT_FAILED,
  FLAGS.EGO_CRISIS_RESOLVED,
  FLAGS.EGO_CRISIS_FAILED,
  FLAGS.PROVE_YOURSELF_ACTIVE,
  FLAGS.PROVE_YOURSELF_COMPLETE,
  FLAGS.PROVE_YOURSELF_FAILED,
  FLAGS.SINCERE_REDEMPTION_COMPLETE,
  FLAGS.SINCERE_REDEMPTION_FAILED
]

const aftermathEvents = EVENTS_DB.band.filter(e =>
  e.tags?.includes('aftermath')
)

const findAftermath = flag => {
  const event = aftermathEvents.find(e => e.requiredFlag === flag)
  assert.ok(event, `no aftermath event declares requiredFlag ${flag}`)
  return event
}

const stateWith = flags => ({
  activeStoryFlags: flags,
  eventCooldowns: [],
  pendingEvents: [],
  player: { day: 5 },
  band: { harmony: 80, members: [] },
  social: {}
})

const locales = Object.fromEntries(
  ['en', 'de'].map(lang => [
    lang,
    JSON.parse(readFileSync(`public/locales/${lang}/events.json`, 'utf8'))
  ])
)

describe('story arc aftermath events', () => {
  test('one validated aftermath event per outcome flag', () => {
    assert.equal(aftermathEvents.length, AFTERMATH_FLAGS.length)
    for (const flag of AFTERMATH_FLAGS) {
      const event = findAftermath(flag)
      assert.equal(validateGameEvent(event), true)
      assert.ok(['travel', 'post_gig'].includes(event.trigger), event.id)
    }
  })

  for (const flag of AFTERMATH_FLAGS) {
    test(`${flag} makes its aftermath eligible and boosts it x5`, () => {
      const event = findAftermath(flag)

      // Condition: truthy with the flag, false without it.
      assert.equal(event.condition(stateWith([flag])), true)
      assert.equal(event.condition(stateWith([])), false)
      assert.equal(event.condition({}), false)

      // Eligible at its rolled trigger point only once the flag is set.
      const ids = state =>
        filterEvents(EVENTS_DB.band, event.trigger, state).map(e => e.id)
      assert.ok(ids(stateWith([flag])).includes(event.id))
      assert.ok(!ids(stateWith([])).includes(event.id))

      // Weighting: the authored chance alone would miss a 0.05 roll; the
      // requiredFlag x5 boost turns it into an effective 5 * chance.
      const effective = event.chance * 5
      assert.ok(event.chance < 0.05 && effective > 0.05)
      const pick = roll =>
        selectEvent([event], stateWith([flag]), event.trigger, () => roll)
      assert.equal(pick(0.05)?.id, event.id)
      assert.equal(pick(effective + 0.01), null)
    })
  }

  test('aftermath beats cannot saturate a trigger when outcome flags persist', () => {
    // Worst reachable case: one outcome per arc (an arc ends complete or
    // failed, never both), all still set. Every beat sharing a trigger is then
    // eligible together; their boosted weights must leave headroom for the rest
    // of the pool and the "no event" share of selectEvent.
    const oneOutcomePerArc = [
      FLAGS.APOLOGY_TOUR_FAILED,
      FLAGS.BACK_FROM_PIT_COMPLETE,
      FLAGS.BAND_PACT_COMPLETE,
      FLAGS.EGO_CRISIS_RESOLVED,
      FLAGS.PROVE_YOURSELF_ACTIVE,
      FLAGS.PROVE_YOURSELF_COMPLETE,
      FLAGS.SINCERE_REDEMPTION_COMPLETE
    ]
    for (const trigger of ['travel', 'post_gig']) {
      const eligible = filterEvents(
        aftermathEvents,
        trigger,
        stateWith(oneOutcomePerArc)
      )
      const weight = eligible.reduce((sum, event) => sum + event.chance * 5, 0)
      assert.ok(weight <= 0.5, `${trigger} aftermath weight ${weight}`)
    }
  })

  test('effects stay modest and every option starts the shared cooldown', () => {
    for (const event of aftermathEvents) {
      assert.ok(event.options.length >= 2, event.id)
      for (const option of event.options) {
        const effects = option.effect.effects
        for (const effect of effects) {
          if (effect.type === 'stat') {
            assert.ok(
              Math.abs(effect.value) <= 15,
              `${event.id} ${effect.stat}`
            )
          }
        }
        assert.ok(
          effects.some(
            e => e.type === 'cooldown' && e.eventId === event.id && e.value > 0
          ),
          `${event.id} option lacks a timed cooldown`
        )
      }
    }
  })

  test('EN and DE copy exists for every aftermath key', () => {
    for (const event of aftermathEvents) {
      const keys = [event.title, event.description]
      for (const option of event.options) {
        keys.push(option.label, option.outcomeText)
      }
      for (const key of keys) {
        const [, rest] = key.split(':')
        for (const lang of ['en', 'de']) {
          assert.ok(
            Object.hasOwn(locales[lang], rest),
            `missing ${lang} key ${key}`
          )
        }
      }
    }
  })
})
