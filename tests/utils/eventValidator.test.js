import { test, describe } from 'vitest'
import assert from 'node:assert'
import { validateCrisisEvent } from '../../src/utils/eventValidator'

describe('validateCrisisEvent', () => {
  const getValidEvent = () => ({
    id: 'crisis_test',
    category: 'band',
    tags: ['crisis'],
    title: 'events:test_title',
    description: 'events:test_desc',
    trigger: 'random',
    chance: 0.5,
    options: [
      {
        label: 'events:opt1_label',
        outcomeText: 'events:opt1_outcome',
        effect: { type: 'modify', stat: 'harmony', value: -10 }
      }
    ]
  })

  test('returns true for a completely valid event', () => {
    assert.strictEqual(validateCrisisEvent(getValidEvent()), true)
  })

  test('throws if event is not an object', () => {
    assert.throws(() => validateCrisisEvent(null), /Event must be an object/)
    assert.throws(
      () => validateCrisisEvent(undefined),
      /Event must be an object/
    )
    assert.throws(
      () => validateCrisisEvent('string'),
      /Event must be an object/
    )
    assert.throws(() => validateCrisisEvent(123), /Event must be an object/)
    assert.throws(() => validateCrisisEvent(true), /Event must be an object/)
  })

  test('throws if id is invalid', () => {
    const ev = getValidEvent()
    delete ev.id
    assert.throws(() => validateCrisisEvent(ev), /Invalid event id/)

    ev.id = 123
    assert.throws(() => validateCrisisEvent(ev), /Invalid event id/)

    ev.id = 'not_crisis_test'
    assert.throws(() => validateCrisisEvent(ev), /Invalid event id/)
  })

  test('throws if category is invalid', () => {
    const ev = getValidEvent()
    delete ev.category
    assert.throws(() => validateCrisisEvent(ev), /Invalid category/)

    ev.category = 'invalid_category'
    assert.throws(() => validateCrisisEvent(ev), /Invalid category/)
  })

  test('throws if tags are invalid or missing "crisis"', () => {
    const ev = getValidEvent()
    delete ev.tags
    assert.throws(() => validateCrisisEvent(ev), /must have "crisis" tag/)

    ev.tags = ['other_tag']
    assert.throws(() => validateCrisisEvent(ev), /must have "crisis" tag/)

    ev.tags = 'crisis'
    assert.throws(() => validateCrisisEvent(ev), /must have "crisis" tag/)
  })

  test('throws if title is invalid', () => {
    const ev = getValidEvent()
    delete ev.title
    assert.throws(() => validateCrisisEvent(ev), /Invalid title key/)

    ev.title = 'not_events_prefixed'
    assert.throws(() => validateCrisisEvent(ev), /Invalid title key/)
  })

  test('throws if description is invalid', () => {
    const ev = getValidEvent()
    delete ev.description
    assert.throws(() => validateCrisisEvent(ev), /Invalid description key/)

    ev.description = 'not_events_prefixed'
    assert.throws(() => validateCrisisEvent(ev), /Invalid description key/)
  })

  test('throws if trigger is invalid', () => {
    const ev = getValidEvent()
    delete ev.trigger
    assert.throws(() => validateCrisisEvent(ev), /Invalid trigger/)

    ev.trigger = 'invalid_trigger'
    assert.throws(() => validateCrisisEvent(ev), /Invalid trigger/)
  })

  test('throws if chance is invalid', () => {
    const ev = getValidEvent()
    delete ev.chance
    assert.throws(() => validateCrisisEvent(ev), /Invalid chance/)

    ev.chance = -0.1
    assert.throws(() => validateCrisisEvent(ev), /Invalid chance/)

    ev.chance = 1.1
    assert.throws(() => validateCrisisEvent(ev), /Invalid chance/)

    ev.chance = '0.5'
    assert.throws(() => validateCrisisEvent(ev), /Invalid chance/)
  })

  test('throws if condition is present but not a function', () => {
    const ev = getValidEvent()
    ev.condition = 'not_a_function'
    assert.throws(() => validateCrisisEvent(ev), /Condition must be a function/)

    ev.condition = () => true // valid
    assert.strictEqual(validateCrisisEvent(ev), true)
  })

  test('throws if options are invalid or empty', () => {
    const ev = getValidEvent()
    delete ev.options
    assert.throws(
      () => validateCrisisEvent(ev),
      /must have at least one option/
    )

    ev.options = []
    assert.throws(
      () => validateCrisisEvent(ev),
      /must have at least one option/
    )

    ev.options = 'not_array'
    assert.throws(
      () => validateCrisisEvent(ev),
      /must have at least one option/
    )
  })

  describe('option validation', () => {
    test('throws if option label is invalid', () => {
      const ev = getValidEvent()
      delete ev.options[0].label
      assert.throws(
        () => validateCrisisEvent(ev),
        /Invalid option label at index 0/
      )

      ev.options[0].label = 'not_events_prefixed'
      assert.throws(
        () => validateCrisisEvent(ev),
        /Invalid option label at index 0/
      )
    })

    test('throws if outcomeText is invalid', () => {
      const ev = getValidEvent()
      delete ev.options[0].outcomeText
      assert.throws(
        () => validateCrisisEvent(ev),
        /Invalid outcomeText at index 0/
      )

      ev.options[0].outcomeText = 'not_events_prefixed'
      assert.throws(
        () => validateCrisisEvent(ev),
        /Invalid outcomeText at index 0/
      )
    })

    test('throws if neither effect nor skillCheck is present', () => {
      const ev = getValidEvent()
      delete ev.options[0].effect
      assert.throws(
        () => validateCrisisEvent(ev),
        /must have effect or skillCheck/
      )
    })

    describe('effect validation', () => {
      test('throws if effect is not an object or is an array', () => {
        const ev = getValidEvent()
        ev.options[0].effect = 'string'
        assert.throws(
          () => validateCrisisEvent(ev),
          /Effect must be an object at index 0/
        )

        ev.options[0].effect = []
        assert.throws(
          () => validateCrisisEvent(ev),
          /Effect must be a plain object, not an array at index 0/
        )
      })

      test('throws if effect missing type', () => {
        const ev = getValidEvent()
        delete ev.options[0].effect.type
        assert.throws(
          () => validateCrisisEvent(ev),
          /Effect must have a type at index 0/
        )
      })

      test('validates composite effects', () => {
        const ev = getValidEvent()
        ev.options[0].effect = {
          type: 'composite'
          // missing effects array
        }
        assert.throws(
          () => validateCrisisEvent(ev),
          /Composite effect must have a non-empty effects array at index 0/
        )

        ev.options[0].effect.effects = []
        assert.throws(
          () => validateCrisisEvent(ev),
          /Composite effect must have a non-empty effects array at index 0/
        )

        ev.options[0].effect.effects = [
          { type: 'modify', stat: 'money', value: 10 },
          { stat: 'harmony', value: -5 } // missing type
        ]
        assert.throws(
          () => validateCrisisEvent(ev),
          /Invalid child effect at composite index 1 for option index 0/
        )

        // valid composite
        ev.options[0].effect.effects[1].type = 'modify'
        assert.strictEqual(validateCrisisEvent(ev), true)
      })

      test('validates skillCheck effects (as type in effect)', () => {
        const ev = getValidEvent()
        ev.options[0].effect = {
          type: 'skillCheck'
          // missing success/failure
        }
        assert.throws(
          () => validateCrisisEvent(ev),
          /SkillCheck effect must have a success object at index 0/
        )

        ev.options[0].effect.success = { type: 'modify' }
        assert.throws(
          () => validateCrisisEvent(ev),
          /SkillCheck effect must have a failure object at index 0/
        )

        ev.options[0].effect.failure = { type: 'modify' }
        assert.strictEqual(validateCrisisEvent(ev), true)

        // Invalid nested effect
        ev.options[0].effect.success = { stat: 'money' } // missing type
        assert.throws(
          () => validateCrisisEvent(ev),
          /Invalid success effect in skillCheck at option index 0/
        )
      })
    })

    describe('skillCheck validation (as prop on option)', () => {
      test('validates option.skillCheck structure', () => {
        const ev = getValidEvent()
        delete ev.options[0].effect

        ev.options[0].skillCheck = {
          // missing stat, threshold, success, failure
        }
        assert.throws(
          () => validateCrisisEvent(ev),
          /SkillCheck stat must be a string/
        )

        ev.options[0].skillCheck.stat = 'musicianship'
        assert.throws(
          () => validateCrisisEvent(ev),
          /SkillCheck threshold must be a number/
        )

        ev.options[0].skillCheck.threshold = 50
        assert.throws(
          () => validateCrisisEvent(ev),
          /SkillCheck success must be an object/
        )

        ev.options[0].skillCheck.success = []
        assert.throws(
          () => validateCrisisEvent(ev),
          /SkillCheck success must be an object/
        )

        ev.options[0].skillCheck.success = { type: 'modify' }
        assert.throws(
          () => validateCrisisEvent(ev),
          /SkillCheck failure must be an object/
        )

        ev.options[0].skillCheck.failure = { type: 'modify' }
        assert.strictEqual(validateCrisisEvent(ev), true) // now valid

        // Invalid nested effect in success/failure of option.skillCheck
        ev.options[0].skillCheck.success = { stat: 'money' } // missing type
        assert.throws(
          () => validateCrisisEvent(ev),
          /Effect must have a type at index 0/
        )
      })
    })
  })
})
