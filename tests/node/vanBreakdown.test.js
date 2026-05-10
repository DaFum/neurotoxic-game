import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calculateDailyUpdates } from '../../src/utils/simulationUtils'

const BASE_VAN = {
  fuel: 100,
  condition: 100,
  upgrades: [],
  breakdownChance: 0.05
}

const BASE_STATE = {
  player: { day: 1, money: 1000, van: { ...BASE_VAN } },
  band: { members: [], harmony: 50 },
  social: {}
}

const makeState = (condition, upgrades = []) => ({
  ...BASE_STATE,
  player: { ...BASE_STATE.player, van: { ...BASE_VAN, condition, upgrades } }
})

describe('Van Breakdown', () => {
  // condition decays by 2 each day; expected chance is post-decay
  const breakdownCases = [
    {
      label: 'base chance with perfect condition',
      condition: 100,
      upgrades: [],
      expectedChance: 0.05 // base 0.05 * multiplier 1.0
    },
    {
      label: 'increased chance when condition below 60',
      condition: 59, // decays to 57 < 60
      upgrades: [],
      expectedChance: 0.08 // 0.05 * 1.6
    },
    {
      label: 'significantly increased chance when condition below 30',
      condition: 29, // decays to 27 < 30
      upgrades: [],
      expectedChance: 0.15 // 0.05 * 3.0
    },
    {
      label: 'upgrades reduce base breakdown chance',
      condition: 100,
      upgrades: ['van_suspension'], // -0.01 reduction
      expectedChance: 0.04 // (0.05 - 0.01) * 1.0
    }
  ]

  breakdownCases.forEach(({ label, condition, upgrades, expectedChance }) => {
    it(label, () => {
      const { player } = calculateDailyUpdates(makeState(condition, upgrades))
      assert.equal(player.van.breakdownChance, expectedChance)
    })
  })

  it('NO COMPOUNDING - breakdown chance is stable over multiple days with similar condition', () => {
    let currentState = {
      ...BASE_STATE,
      player: {
        ...BASE_STATE.player,
        van: { condition: 50, upgrades: [], breakdownChance: 0.05 }
      }
    }

    // Run 3 days; condition 50→48→46→44 all stay in 1.6× band
    for (let day = 1; day <= 3; day++) {
      const update = calculateDailyUpdates(currentState)
      assert.equal(update.player.van.condition, 50 - day * 2)
      assert.equal(
        update.player.van.breakdownChance,
        0.08,
        `Day ${day} chance should remain 0.08 (no compounding)`
      )
      currentState = {
        ...currentState,
        player: update.player,
        band: update.band,
        social: update.social
      }
    }
  })
})
