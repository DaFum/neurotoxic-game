import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { EVENTS_DB } from '../../src/data/events/index'
import { createInitialState } from '../../src/context/initialState'
import {
  isOptionAffordable,
  getOptionPreviewMoney
} from '../../src/utils/eventEngine/resolvers'
import { withExpeditionSpendableCash } from '../../src/domain/expedition/spendableCash'

// Walks the whole event registry against the protected-cash rule, so a data
// edit (an option made `disabled`, a sibling's condition changed, a new event
// whose every option costs money) cannot silently switch the rule or the
// no-lockout fallback on or off.

const BALANCE = 10000
const SPENDABLE_LEVELS = [0, 30, 100]

const events = Object.values(EVENTS_DB)
  .flat()
  .filter(event => Array.isArray(event.options) && event.options.length > 0)

const stateFor = (event, spendable) => {
  const base = createInitialState()
  return {
    ...base,
    player: { ...base.player, money: BALANCE },
    expedition: {
      ...base.expedition,
      status: 'active',
      protectedCareerCash: BALANCE - spendable
    },
    activeEvent: { id: event.id, options: event.options }
  }
}

const label = (event, option) => `${event.id} / ${option.label}`

const directCost = (option, state) => {
  const total = getOptionPreviewMoney(option, state)
  return total !== null && total < 0 ? -total : 0
}

// Whether the modal would let the player pick the option, ignoring the rule
// under test: not disabled, and its condition holds on the spendable view.
const choosableIgnoringRule = (option, state) =>
  !option.disabled &&
  (typeof option.condition !== 'function' ||
    Boolean(option.condition(withExpeditionSpendableCash(state))))

describe('paid event options under protected expedition cash', () => {
  test('the registry has paid options to check', () => {
    const state = stateFor(events[0], 0)
    const paid = events.flatMap(event =>
      event.options.filter(option => directCost(option, state) > 0)
    )
    assert.ok(events.length > 0)
    assert.ok(paid.length > 0, 'no event option with a direct money cost found')
  })

  test('an event never loses its last choosable option to the rule', () => {
    for (const spendable of SPENDABLE_LEVELS) {
      for (const event of events) {
        const state = stateFor(event, spendable)
        const choosable = event.options.filter(option =>
          choosableIgnoringRule(option, state)
        )
        if (choosable.length === 0) continue
        const stillChoosable = choosable.filter(option =>
          isOptionAffordable(option, state)
        )
        assert.ok(
          stillChoosable.length > 0,
          `${event.id} locks with €${spendable} spendable: every choosable option is refused`
        )
      }
    }
  })

  test('a paid option is refused while a free, choosable sibling exists', () => {
    let refused = 0
    let fallback = 0
    for (const event of events) {
      const state = stateFor(event, 0)
      for (const option of event.options) {
        if (directCost(option, state) === 0) continue
        const freeSibling = event.options.some(
          sibling =>
            sibling !== option &&
            directCost(sibling, state) === 0 &&
            choosableIgnoringRule(sibling, state)
        )
        if (freeSibling) {
          assert.equal(
            isOptionAffordable(option, state),
            false,
            `${label(event, option)} is payable although a free sibling exists`
          )
          refused++
        } else {
          // Nothing else to pick: the cost stays payable so the event cannot lock.
          assert.equal(
            isOptionAffordable(option, state),
            true,
            `${label(event, option)} is refused but no sibling is choosable`
          )
          fallback++
        }
      }
    }
    assert.ok(refused > 0, 'no paid option with a free sibling was exercised')
    assert.ok(fallback > 0, 'no lockout-fallback event was exercised')
  })

  test('a paid option within spendable cash is never refused', () => {
    for (const event of events) {
      const state = stateFor(event, BALANCE)
      for (const option of event.options) {
        assert.equal(
          isOptionAffordable(option, state),
          true,
          `${label(event, option)} is refused although the whole balance is spendable`
        )
      }
    }
  })

  test('the rule is a no-op outside a run', () => {
    for (const event of events) {
      const state = {
        ...stateFor(event, 0),
        expedition: { ...createInitialState().expedition, status: 'idle' }
      }
      for (const option of event.options) {
        assert.equal(
          isOptionAffordable(option, state),
          true,
          label(event, option)
        )
      }
    }
  })
})
