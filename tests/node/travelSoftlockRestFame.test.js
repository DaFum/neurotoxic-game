import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
mock.module(new URL('../../src/utils/economy/index.ts', import.meta.url).href, {
  namedExports: {
    calculateTravelExpenses: (_n, _c, player) => ({
      fuelLiters: 10,
      totalCost: 100 + player.fameLevel * 10
    }),
    calculateRefuelCost: () => 0,
    calculateGuaranteedDailyCost: player => 80 + (player.fameLevel ?? 0) * 10,
    EXPENSE_CONSTANTS: { transport: { maxFuel: 100 } }
  }
})
const { checkSoftlock } = await import('../../src/utils/mapUtils.ts')
const map = {
  nodes: { A: { type: 'REST' }, B: { type: 'GIG' } },
  connections: [{ from: 'A', to: 'B' }]
}
const player = {
  currentNodeId: 'A',
  day: 30,
  fame: 200,
  fameLevel: 1,
  money: 205,
  van: { fuel: 100 }
}
const pending = { fameDrops: [{ restDay: 1, amount: 10 }], successes: [] }
const verdict = (effects, overrides = {}) =>
  checkSoftlock(
    map,
    { ...player, ...overrides.player },
    overrides.band ?? { harmony: 1, members: [] },
    {
      dailyObligations: overrides.obligations ?? 90,
      restRecovery: { social: {}, pendingFameEffects: effects }
    }
  )

test('a pending fame loss reprices living, travel and arrival obligations downward', () => {
  // Initial requirement 110+90=200; cash 195 cannot travel. A drop to level 0
  // leaves 115 after living 80, below 180, so a cost-only fixture uses income.
  const overrides = { player: { money: 101 }, obligations: -1 }
  assert.equal(verdict(undefined, overrides), true)
  assert.equal(verdict(pending, overrides), false)
})
test('successful campaign sale proceeds count after settlement', () => {
  const effects = {
    fameDrops: [],
    successes: [
      { restDay: 1, fame: 0, dailyIncome: 0, passiveFame: 0, saleProceeds: 200 }
    ]
  }
  assert.equal(verdict(undefined, { player: { money: 100 } }), true)
  assert.equal(verdict(effects, { player: { money: 100 } }), false)
})
test('campaign asset income starts after settlement and can rescue a later rest', () => {
  const effects = {
    fameDrops: [],
    successes: [
      { restDay: 1, fame: 0, dailyIncome: 150, passiveFame: 0, saleProceeds: 0 }
    ]
  }
  assert.equal(verdict(effects, { player: { money: 100 } }), false)
})
test('campaign fame raises rest donation payout', () => {
  const effects = {
    fameDrops: [],
    successes: [
      { restDay: 1, fame: 1, dailyIncome: 0, passiveFame: 0, saleProceeds: 0 }
    ]
  }
  const overrides = {
    player: { fame: 199, fameLevel: 0, money: 540 },
    obligations: 520,
    band: { harmony: 45, members: [{ stamina: 25, staminaMax: 100 }] }
  }
  assert.equal(verdict(undefined, overrides), true)
  assert.equal(verdict(effects, overrides), false)
})
test('empty, late and malformed effects do not change the verdict', () => {
  for (const effects of [
    { fameDrops: [], successes: [] },
    { fameDrops: [{ restDay: 8, amount: 200 }], successes: [] },
    { fameDrops: [{ restDay: NaN, amount: Infinity }], successes: [null] }
  ]) {
    assert.equal(
      verdict(effects, { player: { money: 100 } }),
      verdict(undefined, { player: { money: 100 } })
    )
  }
})

test('overflowing optimistic fame does not erase donation payout gains', () => {
  const overrides = {
    player: { fame: Number.MAX_VALUE, fameLevel: 0, money: 540 },
    obligations: 520,
    band: { harmony: 45, members: [{ stamina: 25, staminaMax: 100 }] }
  }
  assert.equal(verdict(undefined, overrides), false)
  assert.equal(
    verdict(
      {
        fameDrops: [],
        successes: [
          {
            restDay: 1,
            fame: Number.MAX_VALUE,
            dailyIncome: 0,
            passiveFame: 0,
            saleProceeds: 0
          }
        ]
      },
      overrides
    ),
    false
  )
})
