import { describe, it, expect } from 'vitest'
import {
  buildSoldMerchInventory,
  buildStoryFlagQuests
} from '../../src/hooks/postGig/handlers/continueHandlerUtils'
import { buildAcceptDealQuestEvents } from '../../src/hooks/postGig/handlers/useDealHandlers'
import {
  QUEST_APOLOGY_TOUR,
  QUEST_EGO_MANAGEMENT
} from '../../src/data/questsConstants'
import { getQuestDefinition } from '../../src/data/questRegistry'

describe('buildSoldMerchInventory', () => {
  it('decrements sold quantities and preserves untouched keys', () => {
    expect(
      buildSoldMerchInventory({ shirts: 10, pins: 3 }, { shirts: 4 })
    ).toEqual({ shirts: 6, pins: 3 })
  })

  it('clamps results at zero and treats missing/non-number counts as zero', () => {
    expect(buildSoldMerchInventory({ shirts: 2 }, { shirts: 5 })).toEqual({
      shirts: 0
    })
    expect(buildSoldMerchInventory({}, { shirts: 1 })).toEqual({ shirts: 0 })
    expect(buildSoldMerchInventory({ shirts: 'x' }, { shirts: 2 })).toEqual({
      shirts: 0
    })
  })

  it('normalizes non-finite stored inventory counts to zero before subtraction', () => {
    expect(buildSoldMerchInventory({ shirts: NaN }, { shirts: 2 })).toEqual({
      shirts: 0
    })
    expect(
      buildSoldMerchInventory({ shirts: Infinity }, { shirts: 2 })
    ).toEqual({ shirts: 0 })
  })

  it('treats nullish inventory as empty inventory', () => {
    expect(buildSoldMerchInventory(undefined, { shirts: 2 })).toEqual({
      shirts: 0
    })
    expect(buildSoldMerchInventory(null, { shirts: 2 })).toEqual({ shirts: 0 })
  })

  it('sanitizes negative/NaN/Infinity sold amounts so inventory is never increased or corrupted', () => {
    expect(buildSoldMerchInventory({ shirts: 5 }, { shirts: -3 })).toEqual({
      shirts: 5
    })
    expect(buildSoldMerchInventory({ shirts: 5 }, { shirts: NaN })).toEqual({
      shirts: 5
    })
    expect(
      buildSoldMerchInventory({ shirts: 5 }, { shirts: Infinity })
    ).toEqual({ shirts: 5 })
  })

  it('returns a new object (does not mutate the input)', () => {
    const inventory = { shirts: 5 }
    const next = buildSoldMerchInventory(inventory, { shirts: 1 })
    expect(next).not.toBe(inventory)
    expect(inventory.shirts).toBe(5)
  })
})

describe('buildStoryFlagQuests', () => {
  it('returns nothing without story flags', () => {
    expect(
      buildStoryFlagQuests({
        activeStoryFlags: undefined,
        day: 5,
        bandHarmony: 80,
        postPenaltyHarmony: undefined
      })
    ).toEqual([])
  })

  it('seeds the apology-tour quest at zero progress for the cancel flag', () => {
    const quests = buildStoryFlagQuests({
      activeStoryFlags: ['cancel_quest_active'],
      day: 5,
      bandHarmony: 80,
      postPenaltyHarmony: undefined
    })
    expect(quests).toHaveLength(1)
    expect(quests[0].id).toBe(QUEST_APOLOGY_TOUR)
    expect(quests[0].progress).toBe(0)
    expect(Number.isFinite(quests[0].deadline)).toBe(true)
  })

  it('seeds the ego-management quest with post-penalty harmony when threshold-sourced', () => {
    const quests = buildStoryFlagQuests({
      activeStoryFlags: ['cancel_quest_active', 'breakup_quest_active'],
      day: 5,
      bandHarmony: 70,
      postPenaltyHarmony: 42
    })
    expect(quests).toHaveLength(2)
    const ego = quests.find(q => q.id === QUEST_EGO_MANAGEMENT)
    expect(ego).toBeTruthy()
    const egoDef = getQuestDefinition(QUEST_EGO_MANAGEMENT)
    const expectedProgress =
      egoDef.progressSource === 'harmony_recovered' ? 42 : 0
    expect(ego.progress).toBe(expectedProgress)
  })
})

describe('buildAcceptDealQuestEvents', () => {
  const baseDeal = { id: 'd1', type: 'sponsorship', name: 'BrandX' }

  it('emits offer-accepted + deal-completed for an unaligned, no-money deal', () => {
    expect(
      buildAcceptDealQuestEvents({
        deal: baseDeal,
        brandReputation: {},
        appliedMoneyDelta: 0
      })
    ).toHaveLength(2)
  })

  it('adds a trust event using the clamped +5 mirror', () => {
    const aligned = { ...baseDeal, alignment: 'corp' }
    // rep 0 -> trustDelta 5 -> +1 event
    expect(
      buildAcceptDealQuestEvents({
        deal: aligned,
        brandReputation: { corp: 0 },
        appliedMoneyDelta: 0
      })
    ).toHaveLength(3)
    // rep 100 -> trustDelta 0 -> no trust event
    expect(
      buildAcceptDealQuestEvents({
        deal: aligned,
        brandReputation: { corp: 100 },
        appliedMoneyDelta: 0
      })
    ).toHaveLength(2)
    // non-finite rep coerces to 0 -> trustDelta 5 -> trust event (no NaN)
    const events = buildAcceptDealQuestEvents({
      deal: aligned,
      brandReputation: { corp: NaN },
      appliedMoneyDelta: 0
    })
    expect(events).toHaveLength(3)
    const trustEvent = events.find(e => e.type === 'brand.trustChanged')
    expect(Number.isFinite(trustEvent.amount)).toBe(true)
  })

  it('adds a money-earned event only for positive money deltas', () => {
    expect(
      buildAcceptDealQuestEvents({
        deal: baseDeal,
        brandReputation: {},
        appliedMoneyDelta: 50
      })
    ).toHaveLength(3)
    const aligned = { ...baseDeal, alignment: 'corp' }
    // aligned (rep 0 -> +trust) + positive money -> 4 events
    expect(
      buildAcceptDealQuestEvents({
        deal: aligned,
        brandReputation: { corp: 0 },
        appliedMoneyDelta: 50
      })
    ).toHaveLength(4)
  })
})
