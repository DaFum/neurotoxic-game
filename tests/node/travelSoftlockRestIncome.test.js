import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../../src/context/initialState.ts'
import { gameReducer } from '../../src/context/gameReducer.ts'
import {
  advanceDay,
  createUpdateBandAction
} from '../../src/context/actionCreators.ts'
import {
  getActiveAssetModifiers,
  getTotalDailyObligations
} from '../../src/utils/assets/assetSelectors.ts'
import { calculateTravelExpenses } from '../../src/utils/economy/index.ts'
import {
  calculateTravelCashRequired,
  checkSoftlock
} from '../../src/utils/mapUtils.ts'

// Issue #3499, finding 3: a day of rest earned EUR 114 and made travel
// affordable, while the stranded check had already declared the band stranded.
test('resting one day earns EUR 114 and makes the trip the stranded check refused affordable', () => {
  const initial = createInitialState()
  const gameMap = {
    nodes: { A: { id: 'A', x: 10, y: 10 }, B: { id: 'B', x: 20, y: 10 } },
    connections: [{ from: 'A', to: 'B' }]
  }
  // Rented rehearsal space: pays 200 a day against the band's living costs.
  const asset = {
    id: 'a_rent',
    kind: 'bandhaus_chassis',
    chassisFlavor: 'legit',
    chassisTier: 3,
    condition: 100,
    baseDailyRevenue: 200,
    baseUpkeep: 0,
    baseRiskEventChance: 0,
    acquiredOnDay: 1,
    acquisitionMode: 'cash',
    slots: []
  }
  // Drained band: harmony 10 and empty stamina rule out every donation, so
  // resting is the only cash source.
  const band = {
    ...initial.band,
    harmony: 10,
    members: initial.band.members.map(m => ({ ...m, stamina: 0 }))
  }
  const van = { ...initial.player.van, fuel: 100 }
  const { totalCost } = calculateTravelExpenses(
    gameMap.nodes.B,
    gameMap.nodes.A,
    { money: 0, fameLevel: 0, van },
    band
  )
  const state = {
    ...initial,
    // Survival milestones would pay a bonus on the tick and blur the figure.
    completedMilestones: [
      'survive_1_week',
      'survive_2_weeks',
      'survive_1_month'
    ],
    player: {
      ...initial.player,
      day: 30,
      fameLevel: 0,
      currentNodeId: 'A',
      // One euro short of the trip.
      money: totalCost - 1,
      van
    },
    band,
    assets: [asset],
    liabilities: {}
  }
  // The context `useSoftlockEffect` builds for ordinary (Career) play.
  const contextFor = s => ({
    dailyObligations: getTotalDailyObligations(s),
    assetModifiers: getActiveAssetModifiers(s.assets)
  })
  const context = contextFor(state)
  assert.equal(context.dailyObligations, -114)

  assert.equal(
    checkSoftlock(gameMap, state.player, state.band, {
      ...context,
      restRecovery: { social: state.social }
    }),
    false,
    'a day of rest income is an escape'
  )
  // Without the rest scenario the same band is declared stranded.
  assert.equal(checkSoftlock(gameMap, state.player, state.band, context), true)

  // Rest in the van exactly as `handleRestInVan` does: +50 stamina, -10
  // mood, then the typed day tick through the real reducer.
  const rested = gameReducer(
    state,
    createUpdateBandAction({
      members: state.band.members.map(m => ({
        ...m,
        stamina: Math.min(m.staminaMax ?? 100, m.stamina + 50),
        mood: Math.max(0, m.mood - 10)
      }))
    })
  )
  const next = gameReducer(rested, advanceDay(rested))

  assert.equal(next.player.money - state.player.money, 114)
  assert.ok(
    next.player.money >=
      calculateTravelCashRequired(
        calculateTravelExpenses(
          gameMap.nodes.B,
          gameMap.nodes.A,
          next.player,
          next.band
        ).totalCost,
        getTotalDailyObligations(next)
      ),
    'travel is affordable after the rest'
  )
  assert.equal(
    checkSoftlock(gameMap, next.player, next.band, contextFor(next)),
    false
  )
})
