import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createGigCompletedQuestEvent,
  createGoodGigQuestEvent,
  createSmallVenueGoodQuestEvent,
  createHarmonyChangedQuestEvent
} from '../../src/quests/producers/gigQuestEvents.ts'
import {
  createSocialPostQuestEvents,
  createFollowersGainedQuestEvent,
  createSocialLoyaltyChangedQuestEvent,
  createSocialControversyChangedQuestEvent,
  createSocialTrendMatchedQuestEvent
} from '../../src/quests/producers/socialQuestEvents.ts'
import {
  createBrandDealCompletedQuestEvent,
  createBrandOfferAcceptedQuestEvent,
  createBrandDealFailedQuestEvent,
  createBrandTrustChangedQuestEvent
} from '../../src/quests/producers/brandQuestEvents.ts'
import {
  createAssetAcquiredQuestEvent,
  createAssetRepairedQuestEvent,
  createAssetModuleInstalledQuestEvent,
  createAssetRiskTriggeredQuestEvent,
  createAssetConditionChangedQuestEvent
} from '../../src/quests/producers/assetQuestEvents.ts'
import {
  createMinigameCompletedQuestEvent,
  createMinigamePerfectQuestEvent,
  createMinigameFailedQuestEvent
} from '../../src/quests/producers/minigameQuestEvents.ts'
import {
  createItemCollectedQuestEvent,
  createItemCraftedQuestEvent,
  createItemDeliveredQuestEvent
} from '../../src/quests/producers/itemQuestEvents.ts'
import { createStoryFlagAddedQuestEvent } from '../../src/quests/producers/storyQuestEvents.ts'
import {
  createVenueGigCompletedQuestEvent,
  createVenueGoodGigQuestEvent,
  createVenueReputationChangedQuestEvent,
  createRegionReputationChangedQuestEvent,
  createVenueBlacklistedQuestEvent,
  createVenueUnblacklistedQuestEvent
} from '../../src/quests/producers/venueQuestEvents.ts'
import { createMoneyEarnedQuestEvent } from '../../src/quests/producers/economyQuestEvents.ts'

test('quest producers create canonical events with matchable context', async t => {
  await t.test(
    'gig producer includes venue, region, score and capacity',
    () => {
      const event = createGigCompletedQuestEvent({
        score: 88,
        capacity: 250,
        venueId: 'venue_a',
        region: 'berlin'
      })

      assert.equal(event.type, 'gig.completed')
      assert.equal(event.amount, 1)
      assert.equal(event.success, true)
      assert.deepEqual(event.context, {
        score: 88,
        capacity: 250,
        venueId: 'venue_a',
        region: 'berlin'
      })
      assert.equal(
        createGoodGigQuestEvent({
          score: 88,
          capacity: 250,
          venueId: 'venue_a',
          region: 'berlin'
        }).type,
        'gig.good'
      )
      assert.equal(
        createSmallVenueGoodQuestEvent({
          score: 88,
          capacity: 250,
          venueId: 'venue_a',
          region: 'berlin'
        }).type,
        'gig.smallVenueGood'
      )
    }
  )

  await t.test('harmony producer exposes threshold context', () => {
    const event = createHarmonyChangedQuestEvent({
      amount: 12,
      newHarmony: 64
    })

    assert.equal(event.type, 'band.harmonyChanged')
    assert.equal(event.amount, 12)
    assert.equal(event.context?.harmony, 64)
  })

  await t.test('social producer emits post and follower events', () => {
    const events = createSocialPostQuestEvents(
      { id: 'post_1', platform: 'tiktok', category: 'Performance' },
      { followers: 123 }
    )

    assert.equal(events.length, 2)
    assert.equal(events[0].type, 'social.postResolved')
    assert.equal(events[0].success, true)
    assert.deepEqual(events[0].context, {
      platform: 'tiktok',
      postId: 'post_1',
      postCategory: 'Performance'
    })
    assert.deepEqual(events[1], {
      type: 'social.followersGained',
      amount: 123,
      success: true,
      context: {
        platform: 'tiktok',
        postId: 'post_1',
        postCategory: 'Performance'
      },
      tags: ['tiktok', 'Performance']
    })
  })

  await t.test('social producer ignores inherited result fields', () => {
    const result = Object.create({ success: false, followers: 999 })
    const events = createSocialPostQuestEvents(
      { id: 'post_1', platform: 'tiktok', category: 'Performance' },
      result
    )

    assert.equal(events.length, 1)
    assert.equal(events[0].type, 'social.postResolved')
    assert.equal(events[0].success, true)
  })

  await t.test('followers producer keeps category and platform context', () => {
    const event = createFollowersGainedQuestEvent({
      amount: 50,
      platform: 'instagram',
      postCategory: 'Drama',
      postId: 'post_2'
    })

    assert.equal(event.type, 'social.followersGained')
    assert.equal(event.context?.platform, 'instagram')
    assert.equal(event.context?.postCategory, 'Drama')
  })

  await t.test(
    'social producers expose loyalty, controversy and trend context',
    () => {
      const loyalty = createSocialLoyaltyChangedQuestEvent({
        amount: -5,
        reason: 'brand_backlash'
      })
      assert.equal(loyalty.type, 'social.loyaltyChanged')
      assert.equal(loyalty.amount, -5)
      assert.equal(loyalty.context?.reason, 'brand_backlash')

      const controversy = createSocialControversyChangedQuestEvent({
        amount: 9,
        reason: 'drama_post'
      })
      assert.equal(controversy.type, 'social.controversyChanged')
      assert.equal(controversy.context?.reason, 'drama_post')

      const trend = createSocialTrendMatchedQuestEvent({
        trendId: 'WHOLESOME',
        platform: 'instagram',
        postCategory: 'Lifestyle'
      })
      assert.equal(trend.type, 'social.trendMatched')
      assert.equal(trend.context?.trendId, 'WHOLESOME')
    }
  )

  await t.test('brand producer includes deal type and alignment', () => {
    const event = createBrandDealCompletedQuestEvent({
      id: 'deal_1',
      name: 'Deal',
      description: 'Desc',
      type: 'ENDORSEMENT',
      alignment: 'INDIE',
      requirements: { followers: 0 },
      offer: { upfront: 0, duration: 1 }
    })

    assert.equal(event.type, 'brand.dealCompleted')
    assert.equal(event.context?.dealId, 'deal_1')
    assert.equal(event.context?.dealType, 'ENDORSEMENT')
    assert.equal(event.context?.brandAlignment, 'INDIE')

    assert.equal(
      createBrandOfferAcceptedQuestEvent({
        id: 'deal_1',
        type: 'ENDORSEMENT',
        alignment: 'INDIE'
      }).type,
      'brand.offerAccepted'
    )
    assert.equal(
      createBrandDealFailedQuestEvent({
        dealId: 'deal_1',
        reason: 'missed_deadline'
      }).type,
      'brand.dealFailed'
    )
    const trust = createBrandTrustChangedQuestEvent({
      brandId: 'ampcorp',
      amount: 6
    })
    assert.equal(trust.type, 'brand.trustChanged')
    assert.equal(trust.context?.brandId, 'ampcorp')
  })

  await t.test('asset producer includes asset and module context', () => {
    const acquired = createAssetAcquiredQuestEvent({
      assetId: 'asset_1',
      assetKind: 'tourbus_chassis',
      flavor: 'diy',
      tier: 2
    })
    assert.equal(acquired.type, 'asset.acquired')
    assert.equal(acquired.context?.flavor, 'diy')
    assert.equal(acquired.context?.tier, 2)

    const repaired = createAssetRepairedQuestEvent({
      assetId: 'asset_1',
      assetKind: 'tourbus_chassis',
      amount: 10
    })
    assert.equal(repaired.type, 'asset.repaired')
    assert.equal(repaired.context?.assetKind, 'tourbus_chassis')

    const installed = createAssetModuleInstalledQuestEvent({
      assetId: 'asset_1',
      assetKind: 'tourbus_chassis',
      moduleId: 'studio_rack',
      slotType: 'utility'
    })
    assert.equal(installed.type, 'asset.moduleInstalled')
    assert.equal(installed.context?.moduleId, 'studio_rack')
    assert.equal(installed.context?.slotType, 'utility')

    assert.equal(
      createAssetRiskTriggeredQuestEvent({
        assetId: 'asset_1',
        assetKind: 'tourbus_chassis',
        riskType: 'fire'
      }).type,
      'asset.riskTriggered'
    )
    const condition = createAssetConditionChangedQuestEvent({
      assetId: 'asset_1',
      assetKind: 'tourbus_chassis',
      amount: -12,
      condition: 68
    })
    assert.equal(condition.type, 'asset.conditionChanged')
    assert.equal(condition.context?.condition, 68)
  })

  await t.test('minigame producer includes score and grade', () => {
    const event = createMinigameCompletedQuestEvent({
      minigameId: 'ROADIE',
      success: true,
      score: 950,
      grade: 'A'
    })

    assert.equal(event.type, 'minigame.completed')
    assert.equal(event.context?.minigameId, 'ROADIE')
    assert.equal(event.context?.score, 950)
    assert.equal(event.context?.grade, 'A')

    assert.equal(
      createMinigamePerfectQuestEvent({ minigameId: 'ROADIE' }).type,
      'minigame.perfect'
    )
    assert.equal(
      createMinigameFailedQuestEvent({
        minigameId: 'ROADIE',
        damage: 60
      }).type,
      'minigame.failed'
    )
  })

  await t.test('item and story producers expose ids', () => {
    const item = createItemCollectedQuestEvent({ itemId: 'lucky_pick' })
    assert.equal(item.type, 'item.collected')
    assert.equal(item.context?.itemId, 'lucky_pick')

    assert.equal(
      createItemCraftedQuestEvent({
        itemId: 'demo_tape',
        recipeId: 'studio_recipe'
      }).type,
      'item.crafted'
    )
    const delivered = createItemDeliveredQuestEvent({
      itemId: 'shirts',
      amount: 12
    })
    assert.equal(delivered.type, 'item.delivered')
    assert.equal(delivered.amount, 12)

    const flag = createStoryFlagAddedQuestEvent({
      flag: 'cancel_quest_active'
    })
    assert.equal(flag.type, 'story.flagAdded')
    assert.equal(flag.context?.flag, 'cancel_quest_active')
  })

  await t.test('venue, region and economy producers expose plan events', () => {
    assert.equal(
      createVenueGigCompletedQuestEvent({
        venueId: 'venue_1',
        region: 'berlin',
        score: 77
      }).type,
      'venue.gigCompleted'
    )
    assert.equal(
      createVenueGoodGigQuestEvent({
        venueId: 'venue_1',
        region: 'berlin',
        score: 77,
        capacity: 250
      }).type,
      'venue.goodGig'
    )
    assert.equal(
      createVenueGoodGigQuestEvent({
        venueId: 'venue_1',
        region: 'berlin',
        score: 77,
        capacity: 0
      }).context?.capacity,
      0
    )
    assert.equal(
      createVenueReputationChangedQuestEvent({
        venueId: 'venue_1',
        amount: 5
      }).type,
      'venue.reputationChanged'
    )
    assert.equal(
      createRegionReputationChangedQuestEvent({
        region: 'berlin',
        amount: 5
      }).type,
      'region.reputationChanged'
    )
    assert.equal(
      createVenueBlacklistedQuestEvent({
        venueId: 'venue_1',
        reason: 'bad_show'
      }).type,
      'venue.blacklisted'
    )
    assert.equal(
      createVenueUnblacklistedQuestEvent({
        venueId: 'venue_1',
        reason: 'quest_complete'
      }).type,
      'venue.unblacklisted'
    )
    assert.equal(
      createMoneyEarnedQuestEvent({ amount: 100 }).type,
      'economy.moneyEarned'
    )
  })
})
