import { test, describe } from 'vitest'
import assert from 'node:assert/strict'
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

  test('accepts every registered event category', () => {
    for (const category of [
      'transport',
      'band',
      'gig',
      'financial',
      'special'
    ]) {
      const event = { ...getValidEvent(), category }
      assert.strictEqual(validateCrisisEvent(event), true)
    }
  })

  test('throws if event is not an object', () => {
    ;[null, undefined, 'string', 123, true].forEach(input => {
      assert.throws(() => validateCrisisEvent(input), /Event must be an object/)
    })
  })

  // Field-level validation: each entry deletes the field, verifies the throw,
  // then sets an invalid value and verifies again.
  const fieldCases = [
    {
      field: 'id',
      pattern: /Invalid event id/,
      mutations: [
        ev => {
          delete ev.id
        },
        ev => {
          ev.id = 123
        },
        ev => {
          ev.id = 'not_crisis_test'
        }
      ]
    },
    {
      field: 'category',
      pattern: /Invalid category/,
      mutations: [
        ev => {
          delete ev.category
        },
        ev => {
          ev.category = 'invalid_category'
        }
      ]
    },
    {
      field: 'tags',
      pattern: /must have "crisis" tag/,
      mutations: [
        ev => {
          delete ev.tags
        },
        ev => {
          ev.tags = ['other_tag']
        },
        ev => {
          ev.tags = 'crisis'
        }
      ]
    },
    {
      field: 'title',
      pattern: /Invalid title key/,
      mutations: [
        ev => {
          delete ev.title
        },
        ev => {
          ev.title = 'not_events_prefixed'
        }
      ]
    },
    {
      field: 'description',
      pattern: /Invalid description key/,
      mutations: [
        ev => {
          delete ev.description
        },
        ev => {
          ev.description = 'not_events_prefixed'
        }
      ]
    },
    {
      field: 'trigger',
      pattern: /Invalid trigger/,
      mutations: [
        ev => {
          delete ev.trigger
        },
        ev => {
          ev.trigger = 'invalid_trigger'
        }
      ]
    },
    {
      field: 'chance',
      pattern: /Invalid chance/,
      mutations: [
        ev => {
          delete ev.chance
        },
        ev => {
          ev.chance = -0.1
        },
        ev => {
          ev.chance = 1.1
        },
        ev => {
          ev.chance = Number.NaN
        },
        ev => {
          ev.chance = Number.POSITIVE_INFINITY
        },
        ev => {
          ev.chance = '0.5'
        }
      ]
    }
  ]

  fieldCases.forEach(({ field, pattern, mutations }) => {
    test(`throws if ${field} is invalid`, () => {
      mutations.forEach(mutate => {
        const ev = getValidEvent()
        mutate(ev)
        assert.throws(() => validateCrisisEvent(ev), pattern)
      })
    })
  })

  test('throws if condition is present but not a function', () => {
    const ev = getValidEvent()
    ev.condition = 'not_a_function'
    assert.throws(() => validateCrisisEvent(ev), /Condition must be a function/)

    ev.condition = () => true
    assert.strictEqual(validateCrisisEvent(ev), true)
  })

  test('throws if options are invalid or empty', () => {
    ;[undefined, [], 'not_array'].forEach(value => {
      const ev = getValidEvent()
      if (value === undefined) delete ev.options
      else ev.options = value
      assert.throws(
        () => validateCrisisEvent(ev),
        /must have at least one option/
      )
    })
  })

  describe('option validation', () => {
    test('throws if option label is invalid', () => {
      ;[undefined, 'not_events_prefixed'].forEach(value => {
        const ev = getValidEvent()
        if (value === undefined) delete ev.options[0].label
        else ev.options[0].label = value
        assert.throws(
          () => validateCrisisEvent(ev),
          /Invalid option label at index 0/
        )
      })
    })

    test('throws if outcomeText is invalid', () => {
      ;[undefined, 'not_events_prefixed'].forEach(value => {
        const ev = getValidEvent()
        if (value === undefined) delete ev.options[0].outcomeText
        else ev.options[0].outcomeText = value
        assert.throws(
          () => validateCrisisEvent(ev),
          /Invalid outcomeText at index 0/
        )
      })
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
        ev.options[0].effect = { type: 'composite' }
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
          { stat: 'harmony', value: -5 }
        ]
        assert.throws(
          () => validateCrisisEvent(ev),
          /Invalid child effect at composite index 1 for option index 0/
        )

        ev.options[0].effect.effects[1].type = 'modify'
        assert.strictEqual(validateCrisisEvent(ev), true)
      })

      test('validates skillCheck effects (as type in effect)', () => {
        const ev = getValidEvent()
        ev.options[0].effect = { type: 'skillCheck' }
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

        ev.options[0].effect.success = { stat: 'money' }
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
        ev.options[0].skillCheck = {}

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
        assert.strictEqual(validateCrisisEvent(ev), true)

        ev.options[0].skillCheck.success = { stat: 'money' }
        assert.throws(
          () => validateCrisisEvent(ev),
          /Effect must have a type at index 0/
        )
      })
    })
  })
})
