import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../../src/context/initialState'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import {
  DEFAULT_VAN_CONDITION,
  applyEventDelta,
  clampCrewLoyalty,
  hasActiveSponsorship,
  readVanCondition
} from '../../src/utils/gameState'
import { generateRivalBand } from '../../src/utils/rivalEngine'
import { generateBrandOffers } from '../../src/utils/brandDealLogic'
import { calculateDailyUpdates } from '../../src/utils/dailyTickLogic'
import { derivePressureDirectorContext } from '../../src/domain/expedition/pressure'
import { applyCrewStressDelta } from '../../src/domain/expedition/crewStress'
import { applyBetweenTourDecisionOption } from '../../src/domain/expedition/betweenTour'
import { parseQuestPayload } from '../../src/domain/questPayload'
import { sanitizeExpeditionState } from '../../src/context/reducers/expeditionSanitizers'
import { calculateGigFinancials } from '../../src/utils/economy'
import { NEUTRAL_ASSET_MODIFIERS } from '../../src/utils/assets/assetSelectors'
import { deriveFinancials } from '../../src/utils/postGig/derivations'
import { getAcceptDealSocialUpdateFactory } from '../../src/utils/postGig/dealHandlers'
import { startedState } from '../expeditionLifecycleFixture.js'

describe('APPLY_EVENT_DELTA social branch', () => {
  it('caps scenePresence to 0..100', () => {
    const base = createInitialState()
    const state = { ...base, social: { ...base.social, scenePresence: 95 } }
    const up = applyEventDelta(state, { social: { scenePresence: 50 } })
    assert.equal(up.social.scenePresence, 100)
    const down = applyEventDelta(state, { social: { scenePresence: -500 } })
    assert.equal(down.social.scenePresence, 0)
    const overflow = applyEventDelta(state, {
      social: { scenePresence: Number.MAX_VALUE * 2 }
    })
    assert.equal(overflow.social.scenePresence, 95)
  })

  it('ignores a trend outside ALLOWED_TRENDS', () => {
    const state = createInitialState()
    const next = applyEventDelta(state, { social: { trend: 'NOT_A_TREND' } })
    assert.equal(next.social.trend, state.social.trend)
    const valid = applyEventDelta(state, { social: { trend: 'DRAMA' } })
    assert.equal(valid.social.trend, 'DRAMA')
  })

  it('drops unknown numeric keys but still adds to known counters', () => {
    const state = createInitialState()
    const next = applyEventDelta(state, {
      social: { followers: 10, lastDarkWebLeakDay: 3, instagram: 5 }
    })
    assert.equal(Object.hasOwn(next.social, 'followers'), false)
    assert.equal(
      next.social.lastDarkWebLeakDay,
      state.social.lastDarkWebLeakDay
    )
    assert.equal(next.social.instagram, state.social.instagram + 5)
  })
})

describe('one van-condition recovery policy', () => {
  it('matches the load sanitizer default', () => {
    assert.equal(
      DEFAULT_VAN_CONDITION,
      createInitialState().player.van.condition
    )
    assert.equal(readVanCondition(Number.NaN), DEFAULT_VAN_CONDITION)
    assert.equal(readVanCondition(undefined), DEFAULT_VAN_CONDITION)
    assert.equal(readVanCondition('40'), DEFAULT_VAN_CONDITION)
    assert.equal(readVanCondition(140), 100)
    assert.equal(readVanCondition(-3), 0)
    assert.equal(readVanCondition(42), 42)
  })

  it('UPDATE_PLAYER recovers a NaN condition the same way', () => {
    const base = createInitialState()
    const state = {
      ...base,
      player: {
        ...base.player,
        van: { ...base.player.van, condition: Number.NaN }
      }
    }
    const next = gameReducer(state, {
      type: ActionTypes.UPDATE_PLAYER,
      payload: { van: { condition: Number.NaN } }
    })
    assert.equal(next.player.van.condition, DEFAULT_VAN_CONDITION)
  })

  it('an event delta on a NaN condition starts from the default', () => {
    const base = createInitialState()
    const state = {
      ...base,
      player: {
        ...base.player,
        van: { ...base.player.van, condition: Number.NaN }
      }
    }
    const next = applyEventDelta(state, {
      player: { van: { condition: -10 } }
    })
    assert.equal(next.player.van.condition, DEFAULT_VAN_CONDITION - 10)
  })
})

describe('crew loyalty and stress clamps', () => {
  it('clampCrewLoyalty floors into 0..100', () => {
    assert.equal(clampCrewLoyalty(55.9), 55)
    assert.equal(clampCrewLoyalty(-4), 0)
    assert.equal(clampCrewLoyalty(140), 100)
    assert.equal(clampCrewLoyalty(Number.NaN), 0)
  })

  it('rest_band debrief clamps a corrupt prior loyalty', () => {
    const base = createInitialState()
    const decision = {
      type: 'crew_debrief',
      target: { kind: 'crew', id: 'mika' }
    }
    for (const [loyalty, expected] of [
      [-5, 0],
      [99.5, 100],
      [Number.NaN, 1]
    ]) {
      const state = {
        ...base,
        career: {
          ...base.career,
          crewById: {
            ...base.career.crewById,
            mika: { ...base.career.crewById.mika, loyalty }
          }
        }
      }
      const next = applyBetweenTourDecisionOption(state, decision, 'rest_band')
      assert.ok(next)
      assert.equal(next.career.crewById.mika.loyalty, expected, String(loyalty))
    }
  })

  it('applyCrewStressDelta rounds and clamps to 0..100', () => {
    assert.equal(applyCrewStressDelta(10.4, 5, 1), 15)
    assert.equal(applyCrewStressDelta(10.6, 0, 1), 11)
    assert.equal(applyCrewStressDelta(98, 10, 1), 100)
    assert.equal(applyCrewStressDelta(5, -15, 1), 0)
    assert.equal(
      applyCrewStressDelta(Number.MAX_VALUE, Number.MAX_VALUE, 2),
      100
    )
    assert.equal(
      applyCrewStressDelta(-Number.MAX_VALUE, -Number.MAX_VALUE, 1),
      0
    )
  })

  it('applyCrewStressDelta never returns NaN', () => {
    assert.equal(applyCrewStressDelta(Number.NaN, 5, 1), 5)
    assert.equal(applyCrewStressDelta(10, 5, Number.NaN), 15)
    assert.equal(applyCrewStressDelta(10, Number.NaN, 1), 10)
  })
})

describe('quest deadlineOffset strings', () => {
  it('accepts only plain decimal integer strings', () => {
    assert.equal(
      parseQuestPayload({ id: 'q1', deadlineOffset: ' 7 ' }, 10).payload.quest
        .deadline,
      17
    )
    for (const deadlineOffset of ['0x10', '1e3', 'Infinity', '7.5', '']) {
      const result = parseQuestPayload({ id: 'q1', deadlineOffset }, 10)
      assert.equal(result.ok, false, deadlineOffset)
      assert.equal(result.reason, 'invalid-deadline-offset')
    }
  })
})

describe('quest deadlineOffset numbers', () => {
  it('accepts only safe-integer numbers', () => {
    assert.equal(
      parseQuestPayload({ id: 'q1', deadlineOffset: 3 }, 10).payload.quest
        .deadline,
      13
    )
    for (const deadlineOffset of [2.5, NaN, Infinity, true, [5]]) {
      const result = parseQuestPayload({ id: 'q1', deadlineOffset }, 10)
      assert.equal(result.ok, false, String(deadlineOffset))
      assert.equal(result.reason, 'invalid-deadline-offset')
    }
  })
})

// Hostile stored numbers: each must read like the documented fallback, never
// leak through as NaN/Infinity or a coerced string/boolean/array.
const HOSTILE_NUMBERS = [NaN, Infinity, true, '5', [5], null]

describe('hasActiveSponsorship remainingGigs', () => {
  const sponsored = remainingGigs => ({
    activeDeals: [{ type: 'SPONSORSHIP', remainingGigs }]
  })

  it('keeps the finite verdicts', () => {
    assert.equal(hasActiveSponsorship(sponsored(2)), true)
    assert.equal(hasActiveSponsorship(sponsored(0)), false)
    assert.equal(hasActiveSponsorship(sponsored(-0)), false)
  })

  it('reads a non-finite count like a missing one', () => {
    const missing = hasActiveSponsorship({
      activeDeals: [{ type: 'SPONSORSHIP' }]
    })
    for (const value of HOSTILE_NUMBERS) {
      assert.equal(
        hasActiveSponsorship(sponsored(value)),
        missing,
        String(value)
      )
    }
  })
})

describe('generateRivalBand day', () => {
  it('derives power from a finite day', () => {
    assert.equal(generateRivalBand(10, () => 0.5).powerLevel, 3)
  })

  it('treats a non-finite day as day 1', () => {
    for (const day of HOSTILE_NUMBERS) {
      assert.equal(generateRivalBand(day, () => 0.5).powerLevel, 1, String(day))
    }
  })
})

describe('generateBrandOffers rival power', () => {
  const offerState = powerLevel => ({
    player: { currentNodeId: 'node_a', fame: 0 },
    social: { instagram: 50000, tiktok: 50000, youtube: 10000 },
    band: { members: [], traits: {} },
    rivalBand: { powerLevel, currentLocationId: 'node_a' }
  })
  const offerIds = powerLevel => {
    let seed = 0
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    return generateBrandOffers(offerState(powerLevel), rng).map(
      offer => offer.id
    )
  }

  it('ranks offers under a non-finite power like power 0', () => {
    const baseline = offerIds(0)
    assert.equal(baseline.length, 3)
    for (const powerLevel of HOSTILE_NUMBERS) {
      assert.deepEqual(offerIds(powerLevel), baseline, String(powerLevel))
    }
  })
})

describe('daily controversy decay', () => {
  const withControversy = controversyLevel => {
    const base = createInitialState()
    return { ...base, social: { ...base.social, controversyLevel } }
  }

  it('decays a finite level and stays in 0..100', () => {
    const { social } = calculateDailyUpdates(withControversy(50), () => 0.99)
    assert.ok(social.controversyLevel < 50 && social.controversyLevel >= 0)
  })

  it('writes a non-finite level back as 0', () => {
    for (const value of HOSTILE_NUMBERS) {
      const { social } = calculateDailyUpdates(
        withControversy(value),
        () => 0.99
      )
      assert.equal(social.controversyLevel, 0, String(value))
    }
  })
})

describe('expedition cash pressure', () => {
  const runState = (money, protectedCareerCash) => {
    const base = createInitialState()
    return {
      ...base,
      runSeed: 123,
      player: { ...base.player, money },
      expedition: {
        ...base.expedition,
        status: 'active',
        runId: 'run-1',
        protectedCareerCash
      }
    }
  }
  const cashPressure = (money, protectedCareerCash) =>
    derivePressureDirectorContext(runState(money, protectedCareerCash))
      .cashPressure

  it('keeps the finite spendable verdicts', () => {
    assert.equal(cashPressure(150, 100), 0)
    assert.equal(cashPressure(100, 100), 100)
  })

  it('reads non-finite money as nothing spendable', () => {
    for (const money of HOSTILE_NUMBERS) {
      assert.equal(cashPressure(money, 100), 100, String(money))
    }
  })

  it('fails closed on a corrupt protected slice', () => {
    for (const protectedCareerCash of [NaN, Infinity, '5', null]) {
      assert.equal(
        cashPressure(500, protectedCareerCash),
        100,
        String(protectedCareerCash)
      )
    }
  })
})

describe('expedition gig-outcome step keys', () => {
  it('drops non-canonical integer keys instead of mapping them onto step 0', () => {
    const started = startedState()
    const lastGigStats = { score: 1000, accuracy: 80, failed: false }
    const outcome = { venueId: 'venue_1', accuracy: 80 }
    const sanitize = gigOutcomeByStep =>
      sanitizeExpeditionState(
        { ...started.expedition, routeStep: 0, gigOutcomeByStep },
        started.runSeed,
        lastGigStats
      ).gigOutcomeByStep

    assert.deepEqual(
      { ...sanitize({ '': outcome, ' 0': outcome, '00': outcome }) },
      {}
    )
    assert.deepEqual({ ...sanitize({ 0: outcome }) }, { 0: outcome })
  })
})

describe('NaN social inputs to gig financials', () => {
  const gigParams = context => ({
    gigData: { capacity: 100, price: 10, pay: 100, name: 'Test Gig' },
    performanceScore: 80,
    modifiers: { promo: true },
    bandInventory: {},
    gigStats: {},
    context
  })

  it('a NaN top-level zealotry falls back to the social sub-object', () => {
    const fromSocial = calculateGigFinancials(
      gigParams({ zealotry: Number.NaN, social: { zealotry: 100 } }),
      NEUTRAL_ASSET_MODIFIERS
    )
    const direct = calculateGigFinancials(
      gigParams({ zealotry: 100 }),
      NEUTRAL_ASSET_MODIFIERS
    )
    assert.deepEqual(fromSocial, direct)
  })

  it('deriveFinancials treats corrupt social and region values as 0', () => {
    const base = createInitialState()
    const shared = {
      currentGig: {
        id: 'berlin_club',
        name: 'Club',
        capacity: 100,
        price: 10,
        pay: 100
      },
      lastGigStats: { score: 1000, accuracy: 80 },
      perfScore: 80,
      gigModifiers: base.gigModifiers,
      bandInventory: base.band.inventory,
      player: { ...base.player, location: 'venues:berlin_club.name' },
      activeStoryFlags: [],
      gigContext: null
    }
    const clean = deriveFinancials({
      ...shared,
      social: {
        ...base.social,
        controversyLevel: 0,
        loyalty: 0,
        zealotry: 0
      },
      reputationByRegion: {}
    })
    const corrupt = deriveFinancials({
      ...shared,
      social: {
        ...base.social,
        controversyLevel: Number.NaN,
        loyalty: Number.NaN,
        zealotry: Number.NaN
      },
      reputationByRegion: { berlin: Number.NaN }
    })
    assert.ok(clean)
    assert.deepEqual(corrupt, clean)
    assert.ok(Number.isFinite(corrupt.net))
  })
})

describe('deal acceptance loyalty penalty', () => {
  it('reads a NaN loyalty through finiteNumberOr', () => {
    const update = getAcceptDealSocialUpdateFactory({
      id: 'deal',
      penalty: { loyalty: 5 },
      offer: {}
    })({ ...createInitialState().social, loyalty: Number.NaN })
    assert.equal(update.loyalty, 5)
  })
})
