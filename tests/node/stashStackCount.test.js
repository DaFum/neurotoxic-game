import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getStashStackCount } from '../../src/utils/contrabandStashUtils'

describe('getStashStackCount', () => {
  it('returns 0 for a missing stash, entry or malformed entry', () => {
    assert.equal(getStashStackCount(undefined, 'c_void_energy'), 0)
    assert.equal(getStashStackCount(null, 'c_void_energy'), 0)
    assert.equal(getStashStackCount({}, 'c_void_energy'), 0)
    assert.equal(
      getStashStackCount({ c_void_energy: null }, 'c_void_energy'),
      0
    )
    assert.equal(getStashStackCount({ c_void_energy: 3 }, 'c_void_energy'), 0)
  })

  it('counts an owned non-stackable entry (stacks null or absent) as 1', () => {
    assert.equal(
      getStashStackCount(
        { c_rusty_strings: { stacks: null } },
        'c_rusty_strings'
      ),
      1
    )
    assert.equal(
      getStashStackCount(
        { c_rusty_strings: { id: 'c_rusty_strings' } },
        'c_rusty_strings'
      ),
      1
    )
  })

  it('returns finite stacks floored at 0', () => {
    assert.equal(getStashStackCount({ a: { stacks: 4 } }, 'a'), 4)
    assert.equal(getStashStackCount({ a: { stacks: 0 } }, 'a'), 0)
    assert.equal(getStashStackCount({ a: { stacks: -2 } }, 'a'), 0)
  })

  it('returns 0 for non-finite or non-number stacks', () => {
    for (const stacks of [Number.NaN, Infinity, -Infinity, '3', true, [2]]) {
      assert.equal(
        getStashStackCount({ a: { stacks } }, 'a'),
        0,
        String(stacks)
      )
    }
  })

  it('ignores inherited keys', () => {
    const stash = Object.create({ inherited: { stacks: 5 } })
    assert.equal(getStashStackCount(stash, 'inherited'), 0)
    const entry = Object.create({ stacks: 5 })
    // An entry without an own `stacks` reads as an owned non-stackable unit.
    assert.equal(getStashStackCount({ a: entry }, 'a'), 1)
    assert.equal(getStashStackCount({}, '__proto__'), 0)
  })
})
