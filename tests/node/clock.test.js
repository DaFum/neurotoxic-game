import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { createFixedClock, systemClock } from '../../src/utils/clock'
import { createPersistedState } from '../../src/context/usePersistence'
import { createApplyEventDeltaAction } from '../../src/context/actionCreators'
import { createInitialState } from '../../src/context/initialState'

describe('clock service', () => {
  it('reports the fixed instant for now() and today()', () => {
    const clock = createFixedClock(1_700_000_000_000)

    assert.equal(clock.now(), 1_700_000_000_000)
    assert.equal(clock.today().getTime(), 1_700_000_000_000)
    assert.equal(clock.now(), clock.now())
  })

  it('returns a fresh Date each call so callers cannot mutate the clock', () => {
    const clock = createFixedClock(1_700_000_000_000)
    const first = clock.today()
    first.setFullYear(1990)

    assert.equal(clock.today().getTime(), 1_700_000_000_000)
  })

  it('systemClock tracks the host clock', () => {
    const before = Date.now()
    const now = systemClock.now()
    const after = Date.now()

    assert.ok(now >= before && now <= after)
    assert.equal(systemClock.today() instanceof Date, true)
  })
})

describe('clock injection', () => {
  it('stamps the save timestamp from the injected clock', () => {
    const clock = createFixedClock(1_700_000_000_000)
    const persisted = createPersistedState(createInitialState(), clock)

    assert.equal(persisted.timestamp, 1_700_000_000_000)
  })

  it('defaults to the system clock when none is injected', () => {
    const before = Date.now()
    const persisted = createPersistedState(createInitialState())

    assert.ok(persisted.timestamp >= before)
  })

  it('stamps banter relationship changes from the injected clock', () => {
    const clock = createFixedClock(1_700_000_000_000)
    const action = createApplyEventDeltaAction(
      {
        player: {},
        band: {
          relationshipChange: [
            { source: 'banter', memberA: 'a', memberB: 'b', delta: 1 }
          ]
        },
        social: {},
        flags: {}
      },
      clock
    )

    assert.equal(
      action.payload.band.relationshipChange[0].timestamp,
      1_700_000_000_000
    )
  })

  it('leaves an existing timestamp untouched', () => {
    const clock = createFixedClock(1_700_000_000_000)
    const action = createApplyEventDeltaAction(
      {
        player: {},
        band: {
          relationshipChange: [
            {
              source: 'banter',
              memberA: 'a',
              memberB: 'b',
              delta: 1,
              timestamp: 42
            }
          ]
        },
        social: {},
        flags: {}
      },
      clock
    )

    assert.equal(action.payload.band.relationshipChange[0].timestamp, 42)
  })
})
