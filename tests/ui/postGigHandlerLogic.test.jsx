import { describe, it, expect } from 'vitest'
import { buildSoldMerchInventory } from '../../src/utils/merchUtils'
import { buildStoryFlagQuests } from '../../src/hooks/postGig/handlers/continueHandlerUtils'
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

  it('clamps results at zero', () => {
    expect(buildSoldMerchInventory({ shirts: 2 }, { shirts: 5 })).toEqual({
      shirts: 0
    })
  })

  it('leaves a canonical key without a numeric stored count untouched', () => {
    // A missing key has no stock to sell; it is not created.
    expect(buildSoldMerchInventory({}, { shirts: 1 })).toEqual({})
    expect(buildSoldMerchInventory({ shirts: 'x' }, { shirts: 2 })).toEqual({
      shirts: 'x'
    })
    expect(buildSoldMerchInventory({ shirts: true }, { shirts: 2 })).toEqual({
      shirts: true
    })
    expect(buildSoldMerchInventory({ shirts: null }, { shirts: 2 })).toEqual({
      shirts: null
    })
    expect(buildSoldMerchInventory({ shirts: ['4'] }, { shirts: 2 })).toEqual({
      shirts: ['4']
    })
    expect(
      buildSoldMerchInventory({ shirts: { n: 4 } }, { shirts: 2 })
    ).toEqual({ shirts: { n: 4 } })
  })

  it('still decrements numeric siblings next to a non-numeric canonical key', () => {
    expect(
      buildSoldMerchInventory(
        { shirts: 'x', hoodies: 5, pins: false },
        { shirts: 2, hoodies: 2, pins: 1 }
      )
    ).toEqual({ shirts: 'x', hoodies: 3, pins: false })
  })

  it('leaves a non-finite stored count untouched', () => {
    expect(buildSoldMerchInventory({ shirts: NaN }, { shirts: 2 })).toEqual({
      shirts: NaN
    })
    expect(
      buildSoldMerchInventory({ shirts: Infinity }, { shirts: 2 })
    ).toEqual({ shirts: Infinity })
  })

  it('treats nullish inventory as empty inventory', () => {
    expect(buildSoldMerchInventory(undefined, { shirts: 2 })).toEqual({})
    expect(buildSoldMerchInventory(null, { shirts: 2 })).toEqual({})
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
