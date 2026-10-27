import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolveActiveExpeditionCargo } from '../../src/domain/expedition/cargo'

const build = {
  contraband: [{ stashKey: 'c_void_energy', instanceId: null, stacks: 2 }],
  merch: [{ inventoryKey: 'shirts', quantity: 3 }]
}

describe('resolveActiveExpeditionCargo', () => {
  it('returns null outside an active run', () => {
    assert.equal(
      resolveActiveExpeditionCargo({
        expedition: { status: 'idle', loadout: { build } }
      }),
      null
    )
  })

  it('prefers the stored cargo', () => {
    const cargo = { contraband: [], merch: [] }
    assert.strictEqual(
      resolveActiveExpeditionCargo({
        expedition: { status: 'active', cargo, loadout: { build } }
      }),
      cargo
    )
  })

  it('derives cargo from the committed loadout when none was stored', () => {
    const cargo = resolveActiveExpeditionCargo({
      expedition: { status: 'active', loadout: { build } }
    })
    assert.deepEqual(cargo.contraband, build.contraband)
    assert.deepEqual(cargo.merch, build.merch)
  })

  it('returns null for an active run with neither cargo nor loadout', () => {
    assert.equal(
      resolveActiveExpeditionCargo({ expedition: { status: 'active' } }),
      null
    )
  })
})
