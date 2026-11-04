import assert from 'node:assert/strict'
import test from 'node:test'
import { startedState, walkTo } from '../expeditionLifecycleFixture.js'
import {
  deriveExpeditionPendingFailure,
  getExpeditionMobilityFailureSignal
} from '../../src/domain/expedition/failure'
import { getExpeditionCheapestOnwardLegFuel } from '../../src/domain/expedition/travel'
import { getExpeditionTravelMap } from '../../src/domain/expedition/routeOverlay'
import { calculateTravelExpenses } from '../../src/utils/economy'
import {
  getActiveAssetModifiers,
  getTotalDailyObligations
} from '../../src/utils/assets/assetSelectors'
import { getAssetSaleQuote } from '../../src/utils/assets/assetSelectors/assetSaleQuote'
import { handleSellChassis } from '../../src/context/reducers/assets/assetReducer'
import {
  sanitizeAssets,
  sanitizeLiabilities
} from '../../src/context/reducers/assets/assetSanitizers'

const asset = (id, slots = []) => ({
  id,
  kind: 'tourbus_chassis',
  chassisFlavor: 'legit',
  chassisTier: 1,
  condition: 100,
  baseDailyRevenue: 0,
  baseUpkeep: 0,
  baseRiskEventChance: 0,
  acquiredOnDay: 1,
  acquisitionMode: 'cash',
  slots
})

const mobilityState = () => {
  const state = walkTo(startedState({ money: 5000, fuel: 100 }), 1)
  state.player.lastGigNodeId = state.player.currentNodeId
  state.band.harmony = 1
  state.band.members = state.band.members.map(member => ({
    ...member,
    stamina: 0
  }))
  state.assets = []
  state.liabilities = {}
  return state
}

test('expedition mobility uses the same solar fuel savings as settlement', () => {
  const state = mobilityState()
  state.assets = [
    asset('solar', [
      { id: 'roof', slotType: 'tb_roof', installedModuleId: 'tb_solar_panel' }
    ])
  ]
  assert.ok(getActiveAssetModifiers(state.assets).fuelMultiplier < 1)
  state.expedition.loadout.activeTourbusAssetId = 'solar'
  const required = getExpeditionCheapestOnwardLegFuel(state)
  assert.ok(required > 0)
  state.player.van.fuel = required + 0.001
  state.player.money = 200
  state.expedition.protectedCareerCash = 0
  // Enough cash for the leg but not a full refuel, so fuel savings decide.
  assert.equal(getExpeditionMobilityFailureSignal(state), null)
})

test('reserve fees use total cash while affordability uses only expedition cash', () => {
  const state = mobilityState()
  state.player.money = 100_000
  const map = getExpeditionTravelMap(state)
  const costs = map.connections
    .filter(edge => edge.from === state.player.currentNodeId)
    .map(
      edge =>
        calculateTravelExpenses(
          map.nodes[edge.to],
          map.nodes[edge.from],
          state.player,
          state.band
        ).totalCost
    )
  assert.ok(costs.length > 0)
  const spendable =
    Math.min(...costs) + Math.max(0, getTotalDailyObligations(state)) - 1
  state.expedition.protectedCareerCash = state.player.money - spendable
  assert.equal(
    getExpeditionMobilityFailureSignal(state)?.reason,
    'fuel_stranded'
  )
})

test('a legal chassis sale can prevent an expedition crisis', () => {
  const state = mobilityState()
  state.assets = [asset('spare')]
  state.player.money = 1
  const sold = handleSellChassis(state, { assetId: 'spare' })
  assert.ok(sold.player.money > state.player.money)
  assert.equal(getExpeditionMobilityFailureSignal(sold), null)
  assert.equal(getExpeditionMobilityFailureSignal(state), null)
  assert.equal(deriveExpeditionPendingFailure(state), null)
})

test('the committed chassis cannot count as a sale escape', () => {
  const state = mobilityState()
  state.assets = [asset('committed')]
  state.player.money = 0
  state.expedition.loadout.activeTourbusAssetId = 'committed'
  assert.equal(handleSellChassis(state, { assetId: 'committed' }), state)
  assert.equal(
    getExpeditionMobilityFailureSignal(state)?.reason,
    'fuel_stranded'
  )
})

test('a zero-proceeds chassis sale outside the ten largest yields can prevent a crisis', () => {
  const state = mobilityState()
  const costly = { ...asset('costly'), baseUpkeep: 1_000_000 }
  const gross = getAssetSaleQuote(costly, {}, state.player.day).gross
  assert.ok(gross > 0)
  state.assets = [
    ...Array.from({ length: 10 }, (_, i) => asset(`spare_${i}`)),
    costly
  ]
  state.liabilities = {
    loan: {
      id: 'loan',
      assetId: costly.id,
      principalRemaining: gross,
      dailyPayment: 0
    }
  }
  state.expedition.protectedCareerCash = 0
  state.player.money = 500
  const sold = handleSellChassis(state, { assetId: costly.id })
  assert.equal(sold.player.money, state.player.money)
  assert.equal(getExpeditionMobilityFailureSignal(sold), null)
  assert.equal(getExpeditionMobilityFailureSignal(state), null)
})

test('two zero-proceeds sales can prevent a crisis when one falls outside the cap', () => {
  const state = mobilityState()
  const costly = ['costly_a', 'costly_b'].map(id => ({
    ...asset(id),
    baseUpkeep: 1_000_000
  }))
  state.assets = [
    ...Array.from({ length: 9 }, (_, i) => asset(`spare_${i}`)),
    ...costly
  ]
  state.liabilities = Object.fromEntries(
    costly.map(chassis => [
      chassis.id,
      {
        id: chassis.id,
        assetId: chassis.id,
        principalRemaining: getAssetSaleQuote(chassis, {}, state.player.day)
          .gross,
        dailyPayment: 0
      }
    ])
  )
  state.expedition.protectedCareerCash = 0
  state.player.money = 500
  const soldOnce = handleSellChassis(state, { assetId: costly[0].id })
  assert.ok(getTotalDailyObligations(soldOnce) > soldOnce.player.money)
  const soldBoth = handleSellChassis(soldOnce, { assetId: costly[1].id })
  assert.equal(getExpeditionMobilityFailureSignal(soldBoth), null)
  assert.equal(getExpeditionMobilityFailureSignal(state), null)
})

test('two lower-ranked zero-proceeds sales together can prevent a crisis', () => {
  const state = mobilityState()
  const costly = ['costly_a', 'costly_b'].map(id => asset(id))
  state.assets = sanitizeAssets([
    ...Array.from({ length: 10 }, (_, i) => asset(`spare_${i}`)),
    ...costly
  ])
  assert.equal(state.assets.length, 12)
  state.liabilities = sanitizeLiabilities(
    Object.fromEntries(
      costly.map(chassis => [
        chassis.id,
        {
          id: chassis.id,
          source: 'loan',
          assetId: chassis.id,
          principalRemaining: getAssetSaleQuote(chassis, {}, state.player.day)
            .gross,
          dailyPayment: 1_000_000,
          interestRate: 0,
          termDaysRemaining: 10,
          defaultCounter: 0
        }
      ])
    ),
    state.assets
  )
  assert.equal(Object.keys(state.liabilities).length, 2)
  state.expedition.protectedCareerCash = 0
  state.player.money = 500
  const soldOnce = handleSellChassis(state, { assetId: costly[0].id })
  assert.ok(getTotalDailyObligations(soldOnce) > soldOnce.player.money)
  const soldBoth = handleSellChassis(soldOnce, { assetId: costly[1].id })
  assert.equal(getExpeditionMobilityFailureSignal(soldBoth), null)
  assert.equal(getExpeditionMobilityFailureSignal(state), null)
})

test('a lower-ranked sale combined with two top-ten sales can prevent a crisis', () => {
  const state = mobilityState()
  const costly = ['costly_a', 'costly_b', 'costly_c'].map(id => asset(id))
  state.assets = sanitizeAssets([
    ...Array.from({ length: 8 }, (_, i) => asset(`spare_${i}`)),
    ...costly
  ])
  assert.equal(state.assets.length, 11)
  state.liabilities = sanitizeLiabilities(
    Object.fromEntries(
      costly.map(chassis => [
        chassis.id,
        {
          id: chassis.id,
          source: 'loan',
          assetId: chassis.id,
          principalRemaining: getAssetSaleQuote(chassis, {}, state.player.day)
            .gross,
          dailyPayment: 1_000_000,
          interestRate: 0,
          termDaysRemaining: 10,
          defaultCounter: 0
        }
      ])
    ),
    state.assets
  )
  assert.equal(Object.keys(state.liabilities).length, 3)
  state.expedition.protectedCareerCash = 0
  state.player.money = 500
  const sold = costly.reduce(
    (current, chassis) => handleSellChassis(current, { assetId: chassis.id }),
    state
  )
  assert.equal(getExpeditionMobilityFailureSignal(sold), null)
  assert.equal(getExpeditionMobilityFailureSignal(state), null)
})

test('selling only two of three lower-ranked assets can prevent a crisis', () => {
  const state = mobilityState()
  const studio = id => ({
    ...asset(id),
    kind: 'studio_chassis',
    chassisTier: 3
  })
  state.expedition.loadout.activeTourbusAssetId = 'committed'
  state.assets = sanitizeAssets([
    ...Array.from({ length: 10 }, (_, i) => studio(`top_${i}`)),
    asset('costly_a'),
    asset('costly_b'),
    studio('income'),
    asset('committed')
  ])
  state.liabilities = sanitizeLiabilities(
    Object.fromEntries(
      state.assets.map((chassis, index) => {
        const gross = getAssetSaleQuote(chassis, {}, state.player.day).gross
        assert.ok(gross > 1)
        return [
          chassis.id,
          {
            id: chassis.id,
            source: 'loan',
            assetId: chassis.id,
            principalRemaining:
              chassis.id === 'committed' ? 1 : gross - (index < 10 ? 1 : 0),
            dailyPayment:
              chassis.id === 'committed' || chassis.id.startsWith('costly_')
                ? 1000
                : 1,
            interestRate: 0,
            termDaysRemaining: 10,
            defaultCounter: 0
          }
        ]
      })
    ),
    state.assets
  )
  assert.equal(state.assets.length, 14)
  assert.equal(Object.keys(state.liabilities).length, 14)
  state.expedition.protectedCareerCash = 0
  state.player.money = 721
  const first = handleSellChassis(state, { assetId: 'costly_a' })
  const partial = handleSellChassis(first, { assetId: 'costly_b' })
  const allExtra = handleSellChassis(partial, { assetId: 'income' })
  assert.equal(getExpeditionMobilityFailureSignal(partial), null)
  assert.equal(
    getExpeditionMobilityFailureSignal(allExtra)?.reason,
    'fuel_stranded'
  )
  assert.equal(getExpeditionMobilityFailureSignal(state), null)
})

test('many zero-value assets still yield a crisis when even all proceeds cannot fund travel', () => {
  const state = mobilityState()
  state.assets = Array.from({ length: 12 }, (_, i) => ({
    ...asset(`worthless_${i}`),
    condition: 0
  }))
  state.expedition.protectedCareerCash = 0
  state.player.money = 0
  assert.equal(
    getExpeditionMobilityFailureSignal(state)?.reason,
    'fuel_stranded'
  )
})

test('realized blocked travel still raises a crisis with many sale candidates', () => {
  const state = mobilityState()
  state.assets = Array.from({ length: 16 }, (_, i) => asset(`spare_${i}`))
  state.player.money = 0
  state.expedition.blockedTravelAtRouteStep = state.expedition.routeStep
  assert.equal(
    getExpeditionMobilityFailureSignal(state)?.reason,
    'fuel_stranded'
  )
})

test('an incomplete sale search cannot strand a recoverable fifteen-candidate run', () => {
  const state = mobilityState()
  const studio = id => ({
    ...asset(id),
    kind: 'studio_chassis',
    chassisTier: 3
  })
  state.expedition.loadout.activeTourbusAssetId = 'committed'
  state.assets = sanitizeAssets([
    ...Array.from({ length: 10 }, (_, i) => studio(`top_${i}`)),
    asset('costly_a'),
    asset('costly_b'),
    studio('income'),
    studio('income2'),
    studio('income3'),
    asset('committed')
  ])
  state.liabilities = sanitizeLiabilities(
    Object.fromEntries(
      state.assets.map((chassis, index) => {
        const gross = getAssetSaleQuote(chassis, {}, state.player.day).gross
        assert.ok(gross > 1)
        return [
          chassis.id,
          {
            id: chassis.id,
            source: 'loan',
            assetId: chassis.id,
            principalRemaining:
              chassis.id === 'committed' ? 1 : gross - (index < 10 ? 1 : 0),
            dailyPayment:
              chassis.id === 'committed' || chassis.id.startsWith('costly_')
                ? 1000
                : 1,
            interestRate: 0,
            termDaysRemaining: 10,
            defaultCounter: 0
          }
        ]
      })
    ),
    state.assets
  )
  assert.equal(state.assets.length, 16)
  assert.equal(Object.keys(state.liabilities).length, 16)
  state.expedition.protectedCareerCash = 0
  state.player.money = 721
  const first = handleSellChassis(state, { assetId: 'costly_a' })
  const partial = handleSellChassis(first, { assetId: 'costly_b' })
  const allExtra = ['income', 'income2', 'income3'].reduce(
    (s, assetId) => handleSellChassis(s, { assetId }),
    partial
  )
  assert.equal(getExpeditionMobilityFailureSignal(partial), null)
  assert.equal(
    getExpeditionMobilityFailureSignal(allExtra)?.reason,
    'fuel_stranded'
  )
  assert.equal(getExpeditionMobilityFailureSignal(state), null)
})
