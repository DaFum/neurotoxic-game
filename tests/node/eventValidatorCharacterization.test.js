// Characterization tests for the option and skill-check mechanics shared by
// validateCrisisEvent and validateGameEvent (issue #3584). Each validator keeps
// its own policies (option object guard, presence rule, field read order,
// diagnostics), so every expectation is pinned per validator and never derived
// from the other one.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateCrisisEvent,
  validateGameEvent
} from '../../src/utils/eventValidator.ts'

const throwsExactly = (fn, message, ErrorClass = Error) =>
  assert.throws(fn, err => {
    assert.strictEqual(err.constructor, ErrorClass)
    assert.strictEqual(err.message, message)
    return true
  })

const throwsNative = fn =>
  assert.throws(fn, err => {
    assert.strictEqual(err.constructor, TypeError)
    return true
  })

const validEffect = () => ({ type: 'stat', stat: 'harmony', value: -5 })
const option = extra => ({
  label: 'events:l',
  outcomeText: 'events:o',
  ...extra
})
const skillCheck = extra => ({
  stat: 'skill',
  threshold: 5,
  success: validEffect(),
  failure: validEffect(),
  ...extra
})
const withProto = (proto, own) => Object.assign(Object.create(proto), own)
const arrayWith = props => Object.assign([], props)
const functionWith = props => Object.assign(() => {}, props)
const throwingFailure = () => {
  const sc = { stat: 5, threshold: 5, success: validEffect() }
  Object.defineProperty(sc, 'failure', {
    enumerable: true,
    get() {
      throw new Error('failure read')
    }
  })
  return sc
}

const MISSING_TYPE = id => 'Effect must have a type at index 0 for event ' + id
const CYCLIC = id => 'Cyclic effect at index 0 for event ' + id
const CHILD_PREFIX = id =>
  'Invalid child effect at composite index 0 for option index 0 in event ' +
  id +
  ': '
const SUCCESS_PREFIX = id =>
  'Invalid success effect in skillCheck at option index 0 for event ' +
  id +
  ': '

/**
 * Recursion and cause-chain cases are identical for both entry points because
 * both delegate effects to the same private validateEffect.
 */
const describeRecursion = (validate, buildEvent, id) => {
  describe('recursive effects', () => {
    it('accepts a shared leaf and a shared nested composite across siblings', () => {
      const leaf = validEffect()
      const inner = { type: 'composite', effects: [leaf, leaf] }
      const effect = { type: 'composite', effects: [inner, inner, leaf] }
      assert.strictEqual(validate(buildEvent([option({ effect })])), true)
    })

    it('rejects a composite self-cycle with a wrapped cyclic cause', () => {
      const effect = { type: 'composite', effects: [] }
      effect.effects.push(effect)
      assert.throws(
        () => validate(buildEvent([option({ effect })])),
        err => {
          assert.strictEqual(err.message, CHILD_PREFIX(id) + CYCLIC(id))
          assert.strictEqual(err.cause.message, CYCLIC(id))
          return true
        }
      )
    })

    it('rejects a composite -> skillCheck -> composite ancestor cycle', () => {
      const outer = { type: 'composite', effects: [] }
      outer.effects.push({
        type: 'skillCheck',
        success: outer,
        failure: validEffect()
      })
      throwsExactly(
        () => validate(buildEvent([option({ effect: outer })])),
        CHILD_PREFIX(id) + SUCCESS_PREFIX(id) + CYCLIC(id)
      )
    })

    it('accepts one subtree reused by both option skill-check branches', () => {
      const shared = { type: 'composite', effects: [validEffect()] }
      const event = buildEvent([
        option({ skillCheck: skillCheck({ success: shared, failure: shared }) })
      ])
      assert.strictEqual(validate(event), true)
    })

    it('keeps the full cause chain down to the missing-type error', () => {
      const effect = {
        type: 'composite',
        effects: [
          { type: 'skillCheck', success: { value: 1 }, failure: validEffect() }
        ]
      }
      assert.throws(
        () => validate(buildEvent([option({ effect })])),
        err => {
          assert.strictEqual(
            err.message,
            CHILD_PREFIX(id) + SUCCESS_PREFIX(id) + MISSING_TYPE(id)
          )
          assert.strictEqual(
            err.cause.message,
            SUCCESS_PREFIX(id) + MISSING_TYPE(id)
          )
          assert.strictEqual(err.cause.cause.message, MISSING_TYPE(id))
          assert.strictEqual(err.cause.cause.cause, undefined)
          return true
        }
      )
    })

    it('does not wrap option skill-check branch errors', () => {
      for (const branch of ['success', 'failure']) {
        const event = buildEvent([
          option({ skillCheck: skillCheck({ [branch]: { value: 1 } }) })
        ])
        assert.throws(
          () => validate(event),
          err => {
            assert.strictEqual(err.message, MISSING_TYPE(id))
            assert.strictEqual(err.cause, undefined)
            return true
          }
        )
      }
    })
  })
}

describe('validateCrisisEvent option and skill-check characterization', () => {
  const ID = 'crisis_x'
  const crisisEvent = (options, overrides = {}) => ({
    id: ID,
    category: 'band',
    tags: ['crisis'],
    trigger: 'random',
    chance: 0.5,
    title: 'events:t',
    description: 'events:d',
    options,
    ...overrides
  })
  const run = options => validateCrisisEvent(crisisEvent(options))
  const NO_PAYLOAD =
    'Option at index 0 for event crisis_x must have effect or skillCheck'

  describe('option shape (no object guard)', () => {
    it('throws a native TypeError for null, undefined and hole options', () => {
      throwsNative(() => run([null]))
      throwsNative(() => run([undefined]))
      // eslint-disable-next-line no-sparse-arrays
      throwsNative(() => run([,]))
    })

    it('reports primitive options as an invalid label', () => {
      for (const opt of [5, 'events:x', true]) {
        throwsExactly(
          () => run([opt]),
          'Invalid option label at index 0 for event crisis_x'
        )
      }
    })

    it('accepts array, function and prototype-backed options', () => {
      const props = option({ effect: validEffect() })
      assert.strictEqual(run([arrayWith(props)]), true)
      assert.strictEqual(run([functionWith(props)]), true)
      assert.strictEqual(run([withProto(props, {})]), true)
    })

    it('pins label and outcomeText diagnostics with the option index', () => {
      throwsExactly(
        () => run([option({ label: 5, effect: validEffect() })]),
        'Invalid option label at index 0 for event crisis_x'
      )
      throwsExactly(
        () =>
          run([
            option({ effect: validEffect() }),
            option({ outcomeText: 'bad', effect: validEffect() })
          ]),
        'Invalid outcomeText at index 1 for event crisis_x'
      )
    })
  })

  describe('presence policy (truthiness, inherited allowed)', () => {
    it('accepts inherited effect or skillCheck', () => {
      assert.strictEqual(
        run([withProto({ effect: validEffect() }, option())]),
        true
      )
      assert.strictEqual(
        run([withProto({ skillCheck: skillCheck() }, option())]),
        true
      )
    })

    it('ignores falsey effect next to a valid skillCheck', () => {
      for (const effect of [null, false, 0, '', undefined]) {
        assert.strictEqual(
          run([option({ effect, skillCheck: skillCheck() })]),
          true
        )
      }
    })

    it('ignores falsey skillCheck next to a valid effect', () => {
      for (const sc of [null, false, 0, '', undefined]) {
        assert.strictEqual(
          run([option({ effect: validEffect(), skillCheck: sc })]),
          true
        )
      }
    })

    it('throws the presence error when both are falsey or missing', () => {
      throwsExactly(() => run([option()]), NO_PAYLOAD)
      throwsExactly(
        () => run([option({ effect: 0, skillCheck: null })]),
        NO_PAYLOAD
      )
    })

    it('validates a truthy effect before the skillCheck', () => {
      throwsExactly(
        () => run([option({ effect: 'boom', skillCheck: { stat: 5 } })]),
        'Effect must be an object at index 0 for event crisis_x'
      )
      throwsExactly(
        () => run([option({ effect: [] })]),
        'Effect must be a plain object, not an array at index 0 for event crisis_x'
      )
    })
  })

  describe('option-level skillCheck', () => {
    const STAT = 'SkillCheck stat must be a string in event crisis_x'
    const THRESHOLD =
      'SkillCheck threshold must be a finite number in event crisis_x'
    const SUCCESS = 'SkillCheck success must be an object in event crisis_x'
    const FAILURE = 'SkillCheck failure must be an object in event crisis_x'
    const runSc = sc => run([option({ skillCheck: sc })])

    it('treats truthy primitive and array skillChecks as missing a stat', () => {
      for (const sc of [5, 'str', true, []]) {
        throwsExactly(() => runSc(sc), STAT)
      }
    })

    it('accepts inherited skillCheck fields', () => {
      assert.strictEqual(runSc(withProto(skillCheck(), {})), true)
    })

    it('pins stat, threshold and branch-shape diagnostics', () => {
      for (const stat of [5, undefined, null]) {
        throwsExactly(() => runSc(skillCheck({ stat })), STAT)
      }
      for (const threshold of [NaN, Infinity, new Number(5), '5', undefined]) {
        throwsExactly(() => runSc(skillCheck({ threshold })), THRESHOLD)
      }
      for (const bad of [null, undefined, 5, 'x', [], () => {}]) {
        throwsExactly(() => runSc(skillCheck({ success: bad })), SUCCESS)
        throwsExactly(() => runSc(skillCheck({ failure: bad })), FAILURE)
      }
    })

    it('checks stat, threshold, success shape, failure shape, then contents', () => {
      throwsExactly(() => runSc({ stat: 5, threshold: NaN }), STAT)
      throwsExactly(() => runSc({ stat: 's', threshold: NaN }), THRESHOLD)
      throwsExactly(
        () => runSc(skillCheck({ success: 5, failure: 5 })),
        SUCCESS
      )
      throwsExactly(
        () => runSc(skillCheck({ success: {}, failure: 5 })),
        FAILURE
      )
    })

    it('forwards the option index to branch effect errors', () => {
      throwsExactly(
        () =>
          run([
            option({ effect: validEffect() }),
            option({ skillCheck: skillCheck({ failure: {} }) })
          ]),
        'Effect must have a type at index 1 for event crisis_x'
      )
    })

    it('reads every skillCheck field before checking any (eager read)', () => {
      throwsExactly(() => runSc(throwingFailure()), 'failure read')
    })
  })

  describe('metadata ordering', () => {
    it('reports chance before options', () => {
      throwsExactly(
        () => validateCrisisEvent(crisisEvent([], { chance: NaN })),
        'Invalid chance: NaN for event crisis_x'
      )
    })

    it('reports a non-array options list', () => {
      throwsExactly(
        () => validateCrisisEvent(crisisEvent({ 0: option() })),
        'Event crisis_x must have at least one option'
      )
    })
  })

  describeRecursion(validateCrisisEvent, crisisEvent, ID)
})

describe('validateGameEvent option and skill-check characterization', () => {
  const ID = 'x'
  const gameEvent = (options, overrides = {}) => ({
    id: ID,
    title: 'events:t',
    description: 'events:d',
    options,
    ...overrides
  })
  const run = options => validateGameEvent(gameEvent(options))
  const NO_PAYLOAD =
    'Event "x" option[0]: must have either an effect or a skillCheck'

  describe('option shape (object guard)', () => {
    it('rejects non-object options with the guard message', () => {
      const props = option({ effect: validEffect() })
      // eslint-disable-next-line no-sparse-arrays
      const hole = [,]
      for (const options of [
        [null],
        [undefined],
        hole,
        [5],
        ['events:x'],
        [arrayWith(props)],
        [functionWith(props)]
      ]) {
        throwsExactly(
          () => run(options),
          'Event "x" option[0]: must be a non-null object'
        )
      }
    })

    it('accepts inherited label and outcomeText with an own effect', () => {
      assert.strictEqual(
        run([
          withProto(
            { label: 'events:l', outcomeText: 'events:o' },
            { effect: validEffect() }
          )
        ]),
        true
      )
    })

    it('pins label and outcomeText diagnostics with JSON rendering', () => {
      throwsExactly(
        () => run([option({ label: 5, effect: validEffect() })]),
        `Event "x" option[0]: label must start with 'events:' (got: 5)`
      )
      throwsExactly(
        () => run([option({ label: undefined, effect: validEffect() })]),
        `Event "x" option[0]: label must start with 'events:' (got: undefined)`
      )
      throwsExactly(
        () =>
          run([
            option({ effect: validEffect() }),
            option({ outcomeText: 'bad', effect: validEffect() })
          ]),
        `Event "x" option[1]: outcomeText must start with 'events:' (got: "bad")`
      )
    })
  })

  describe('presence policy (own and not undefined)', () => {
    it('rejects inherited-only effect or skillCheck', () => {
      throwsExactly(
        () => run([withProto({ effect: validEffect() }, option())]),
        NO_PAYLOAD
      )
      throwsExactly(
        () => run([withProto({ skillCheck: skillCheck() }, option())]),
        NO_PAYLOAD
      )
    })

    it('treats own undefined as absent', () => {
      assert.strictEqual(
        run([option({ effect: undefined, skillCheck: skillCheck() })]),
        true
      )
      assert.strictEqual(
        run([option({ effect: validEffect(), skillCheck: undefined })]),
        true
      )
      throwsExactly(
        () => run([option({ effect: undefined, skillCheck: undefined })]),
        NO_PAYLOAD
      )
    })

    it('selects and rejects own falsey effects', () => {
      for (const effect of [null, false, 0, '']) {
        throwsExactly(
          () => run([option({ effect, skillCheck: skillCheck() })]),
          'Effect must be an object at index 0 for event x'
        )
      }
      throwsExactly(
        () => run([option({ effect: [] })]),
        'Effect must be a plain object, not an array at index 0 for event x'
      )
    })

    it('selects own falsey skillChecks', () => {
      throwsNative(() =>
        run([option({ effect: validEffect(), skillCheck: null })])
      )
      for (const sc of [false, 0, '']) {
        throwsExactly(
          () => run([option({ effect: validEffect(), skillCheck: sc })]),
          'Event "x" option[0]: skillCheck.stat must be a string'
        )
      }
    })
  })

  describe('option-level skillCheck', () => {
    const STAT = 'Event "x" option[0]: skillCheck.stat must be a string'
    const THRESHOLD =
      'Event "x" option[0]: skillCheck.threshold must be a finite number'
    const SUCCESS = 'Event "x" option[0]: skillCheck.success must be an object'
    const FAILURE = 'Event "x" option[0]: skillCheck.failure must be an object'
    const runSc = sc => run([option({ skillCheck: sc })])

    it('treats primitive and array skillChecks as missing a stat', () => {
      for (const sc of [5, 'str', true, []]) {
        throwsExactly(() => runSc(sc), STAT)
      }
    })

    it('accepts inherited skillCheck fields', () => {
      assert.strictEqual(runSc(withProto(skillCheck(), {})), true)
    })

    it('pins stat, threshold and branch-shape diagnostics', () => {
      for (const stat of [5, undefined, null]) {
        throwsExactly(() => runSc(skillCheck({ stat })), STAT)
      }
      for (const threshold of [NaN, Infinity, new Number(5), '5', undefined]) {
        throwsExactly(() => runSc(skillCheck({ threshold })), THRESHOLD)
      }
      for (const bad of [null, undefined, 5, 'x', [], () => {}]) {
        throwsExactly(() => runSc(skillCheck({ success: bad })), SUCCESS)
        throwsExactly(() => runSc(skillCheck({ failure: bad })), FAILURE)
      }
    })

    it('checks stat, threshold, success shape, failure shape, then contents', () => {
      throwsExactly(() => runSc({ stat: 5, threshold: NaN }), STAT)
      throwsExactly(() => runSc({ stat: 's', threshold: NaN }), THRESHOLD)
      throwsExactly(
        () => runSc(skillCheck({ success: 5, failure: 5 })),
        SUCCESS
      )
      throwsExactly(
        () => runSc(skillCheck({ success: {}, failure: 5 })),
        FAILURE
      )
    })

    it('forwards the option index to branch effect errors', () => {
      throwsExactly(
        () =>
          run([
            option({ effect: validEffect() }),
            option({ skillCheck: skillCheck({ failure: {} }) })
          ]),
        'Effect must have a type at index 1 for event x'
      )
    })

    it('checks stat before reading the branches (progressive read)', () => {
      throwsExactly(() => runSc(throwingFailure()), STAT)
    })
  })

  describe('metadata ordering', () => {
    it('reports options before the crisis chance', () => {
      throwsExactly(
        () =>
          validateGameEvent(
            gameEvent([], { id: 'crisis_x', tags: ['crisis'], chance: NaN })
          ),
        'Event "crisis_x": options must be a non-empty array'
      )
    })

    it('rejects an own undefined prerequisiteEventId', () => {
      throwsExactly(
        () =>
          validateGameEvent(
            gameEvent([option({ effect: validEffect() })], {
              prerequisiteEventId: undefined
            })
          ),
        'Event "x": prerequisiteEventId must be a non-empty string when present'
      )
    })
  })

  describeRecursion(validateGameEvent, gameEvent, ID)
})

describe('event-level title and description keys', () => {
  const REJECTED = [
    undefined,
    42,
    ' events:t',
    'Events:t',
    'title',
    new String('events:t')
  ]
  const crisis = overrides => ({
    id: 'crisis_x',
    category: 'band',
    tags: ['crisis'],
    trigger: 'random',
    chance: 0.5,
    title: 'events:t',
    description: 'events:d',
    options: [option({ effect: validEffect() })],
    ...overrides
  })
  const game = overrides => ({
    id: 'x',
    title: 'events:t',
    description: 'events:d',
    options: [option({ effect: validEffect() })],
    ...overrides
  })

  it('accepts the bare events: prefix in both validators', () => {
    const keys = { title: 'events:', description: 'events:' }
    assert.equal(validateCrisisEvent(crisis(keys)), true)
    assert.equal(validateGameEvent(game(keys)), true)
  })

  it('keeps each validator diagnostic for rejected keys', () => {
    for (const value of REJECTED) {
      throwsExactly(
        () => validateCrisisEvent(crisis({ title: value })),
        'Invalid title key: ' + String(value) + ' for event crisis_x'
      )
      throwsExactly(
        () => validateCrisisEvent(crisis({ description: value })),
        'Invalid description key: ' + String(value) + ' for event crisis_x'
      )
      throwsExactly(
        () => validateGameEvent(game({ title: value })),
        `Event "x": title must start with 'events:' (got: ${JSON.stringify(value)})`
      )
      throwsExactly(
        () => validateGameEvent(game({ description: value })),
        `Event "x": description must start with 'events:' (got: ${JSON.stringify(value)})`
      )
    }
  })
})
