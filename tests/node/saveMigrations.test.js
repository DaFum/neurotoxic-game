import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  CURRENT_SAVE_VERSION,
  SAVE_MIGRATIONS,
  runSaveMigrations
} from '../../src/context/reducers/migrations'
import { migrateV1ToV2 } from '../../src/context/reducers/migrations/v1_to_v2'

describe('save migration chain', () => {
  it('is ordered ascending and ends at CURRENT_SAVE_VERSION', () => {
    const targets = SAVE_MIGRATIONS.map(step => step.to)
    assert.deepEqual(
      targets,
      [...targets].sort((a, b) => a - b)
    )
    assert.equal(targets.at(-1), CURRENT_SAVE_VERSION)
  })

  it('leaves the chain gap-free', () => {
    SAVE_MIGRATIONS.forEach((step, index) => {
      const previous = index === 0 ? step.to - 1 : SAVE_MIGRATIONS[index - 1].to
      assert.equal(step.to, previous + 1)
    })
  })

  const trackingChain = applied => [
    {
      to: 2,
      migrate: state => {
        applied.push(2)
        return { ...state, two: true }
      }
    },
    {
      to: 3,
      migrate: state => {
        applied.push(3)
        return { ...state, three: true }
      }
    }
  ]

  it('applies every step above the stored version, in order', () => {
    const applied = []
    const result = runSaveMigrations({}, 1, trackingChain(applied))

    assert.deepEqual(applied, [2, 3])
    assert.deepEqual(result, { two: true, three: true })
  })

  it('skips steps at or below the stored version', () => {
    const applied = []
    const result = runSaveMigrations({}, 2, trackingChain(applied))

    assert.deepEqual(applied, [3])
    assert.deepEqual(result, { three: true })
  })

  it('applies nothing when the payload is already current', () => {
    const applied = []
    const payload = { player: { money: 100 } }

    assert.equal(runSaveMigrations(payload, 3, trackingChain(applied)), payload)
    assert.deepEqual(applied, [])
  })

  it('propagates a throwing step so callers can quarantine the save', () => {
    const chain = [
      {
        to: 2,
        migrate: () => {
          throw new Error('boom')
        }
      }
    ]

    assert.throws(() => runSaveMigrations({}, 1, chain), /boom/)
  })

  it('leaves a current save untouched through the real chain', () => {
    const payload = { version: 2, player: { money: 100 } }
    assert.equal(runSaveMigrations(payload, CURRENT_SAVE_VERSION), payload)
  })

  it('runs the real chain for a version 1 payload', () => {
    const payload = { version: 1, player: { money: 100 } }
    assert.deepEqual(runSaveMigrations(payload, 1), payload)
  })
})

describe('migrateV1ToV2', () => {
  it('returns the payload unchanged (no structural change in v2)', () => {
    const payload = { version: 1, player: { money: 100 }, assets: [] }
    assert.equal(migrateV1ToV2(payload), payload)
  })

  it('tolerates non-object payloads', () => {
    assert.equal(migrateV1ToV2(null), null)
    assert.equal(migrateV1ToV2(undefined), undefined)
    assert.equal(migrateV1ToV2('corrupt'), 'corrupt')
  })
})
