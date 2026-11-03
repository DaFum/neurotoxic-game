import { test, mock } from 'node:test'
import assert from 'node:assert/strict'

let tripCost = 100
mock.module(new URL('../../src/utils/economy/index.ts', import.meta.url).href, {
  namedExports: {
    calculateTravelExpenses: () => ({ fuelLiters: 10, totalCost: tripCost }),
    calculateRefuelCost: () => 0,
    calculateGuaranteedDailyCost: () => 80,
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
  day: 20,
  fameLevel: 0,
  money: 0,
  van: { fuel: 100 }
}
const band = (harmony, stamina) => ({
  harmony,
  members: stamina.map(value => ({ stamina: value, staminaMax: 100 }))
})
const verdict = (b, recovery, context = {}) =>
  checkSoftlock(map, player, b, { ...context, consumableRecovery: recovery })

test('carried blood pact enables a donation without resting', () => {
  const b = band(10, [100])
  assert.equal(verdict(b), true)
  assert.equal(verdict(b, { harmony: 15 }), false)
})
test('targeted stamina is shared across the weakest members', () => {
  assert.equal(verdict(band(16, [0]), { targetedStamina: 50 }), false)
  assert.equal(verdict(band(16, [0, 0]), { targetedStamina: 50 }), true)
  assert.equal(verdict(band(16, [0, 100]), { targetedStamina: 50 }), false)
})
test('inventory recovery adds to every member once', () => {
  assert.equal(verdict(band(16, [30, 30]), { memberStamina: 5 }), true)
  assert.equal(verdict(band(16, [30, 30]), { memberStamina: 10 }), false)
})
test('consumable recovery can finance more than eight donations', () => {
  tripCost = 5000
  try {
    assert.equal(
      verdict(band(10, [0]), { harmony: 500, targetedStamina: 1000 }),
      false
    )
  } finally {
    tripCost = 100
  }
})
test('non-finite harmony follows tick fallback after recovery or rest', () => {
  assert.equal(verdict(band(NaN, [100]), { harmony: 15 }), false)
  assert.equal(
    verdict(band(NaN, [0]), undefined, { restRecovery: { social: {} } }),
    false
  )
})

const grid = () => {
  const states = []
  for (const harmony of [10, 15, 16, 40, 41, 47, 51, 55, 56, 100])
    for (const stamina of [0, 30, 36, 37, 40, 70, 100])
      for (const count of [1, 2])
        for (const rest of [false, true])
          for (const regen of [0, 0.5, 30])
            states.push({
              b: band(harmony, Array(count).fill(stamina)),
              context: {
                dailyObligations: 5,
                assetModifiers: { staminaRegenBonusPerDay: regen },
                ...(rest ? { restRecovery: { social: {} } } : {})
              }
            })
  return states
}
test('differential baseline and recovery monotonicity', () => {
  const states = grid()
  const encoded = states
    .map(({ b, context }) => Number(verdict(b, undefined, context)))
    .join('')
  if (process.env.CAPTURE_RECOVERY_BASELINE) {
    console.log('RECOVERY_BASELINE=' + encoded)
    return
  }
  assert.equal(encoded, BASELINE)
  for (const { b, context } of states) {
    const old = verdict(b, undefined, context)
    assert.equal(
      verdict(b, { harmony: 0, memberStamina: 0, targetedStamina: 0 }, context),
      old
    )
    assert.ok(
      old ||
        !verdict(
          b,
          { harmony: 15, targetedStamina: 50, memberStamina: 10 },
          context
        )
    )
  }
})
const BASELINE =
  '111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000111000111000111000111000111000111111111111111111111111111111111111111111111111111000111000000000000000000000000000111111111111111111111111111111111111111111111111111000111000000000000000000000000000111111111111111111111111111111111111111111111111111000111000000000000000000000000000111111111111111111111111111111111111111111111111111000111000000000000000000000000000111111111111111111111111111111111111111111111111111000111000000000000000000000000000111111111111111111111111111111111111111111111111111000111000000000000000000000000000111111111111111111111111111111111111111111111111111000111000000000000000000000000000'

test('fractional asset regen ceiling provides the last stamina point', () => {
  const p = { ...player, money: 502 }
  const b = band(50, [36])
  const context = { dailyObligations: 501, restRecovery: { social: {} } }
  // Only one rest survives bankruptcy: 502-501=1. Marrow+blood need 90
  // stamina after the reserve: 36+50+13+ceil(0.5)-10=90.
  assert.equal(checkSoftlock(map, p, b, context), true)
  assert.equal(
    checkSoftlock(map, p, b, {
      ...context,
      assetModifiers: { staminaRegenBonusPerDay: 0.5 }
    }),
    false
  )
})
test('Soundproofing contributes its one optimistic harmony point', () => {
  // 47+3+1+5=56 strictly exceeds marrow+blood's 55 harmony.
  assert.equal(
    checkSoftlock(map, { ...player, money: 502 }, band(47, [37]), {
      dailyObligations: 501,
      restRecovery: { social: {} }
    }),
    false
  )
})
test('Mobile Studio contributes its five optimistic harmony points', () => {
  // 51+3+1+5=60; omitting the +5 leaves exactly 55 and cannot donate both.
  assert.equal(
    checkSoftlock(map, { ...player, money: 502 }, band(51, [37]), {
      dailyObligations: 501,
      restRecovery: { social: {} }
    }),
    false
  )
})

test('recovery helper counts canonical carried stock and inventory ownership', async () => {
  const { getConsumableRecovery } =
    await import('../../src/utils/travelSoftlockUtils.ts')
  assert.deepEqual(
    getConsumableRecovery(
      {
        c_blood_pact: { stacks: 2, value: 999 },
        c_void_energy: {},
        c_weekender_coffee: { stacks: 2 },
        c_bone_dust: {},
        c_void_ash: {},
        c_hyper_adrenaline_ampoule: {}
      },
      { canned_food: 2.9, energy_drink: true }
    ),
    { harmony: 30, targetedStamina: 110, memberStamina: 20 }
  )
  const stash = Object.assign(Object.create({ c_void_energy: {} }), {
    c_blood_pact: { applied: true },
    c_bone_dust: { stacks: Infinity },
    c_weekender_coffee: { stacks: -2 },
    constructor: { stacks: 999 }
  })
  assert.deepEqual(
    getConsumableRecovery(stash, Object.create({ energy_drink: true })),
    { harmony: 0, targetedStamina: 0, memberStamina: 0 }
  )
})
