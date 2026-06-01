import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createGigCompletedQuestEvent,
  createGoodGigQuestEvent,
  createSmallVenueGoodGigQuestEvent,
  createHarmonyChangedQuestEvent
} from '../../src/quests/producers/gigQuestEvents.ts'
import {
  createSocialPostQuestEvents,
  createFollowersGainedQuestEvent
} from '../../src/quests/producers/socialQuestEvents.ts'
import { createBrandDealCompletedQuestEvent } from '../../src/quests/producers/brandQuestEvents.ts'
import {
  createAssetRepairedQuestEvent,
  createAssetModuleInstalledQuestEvent
} from '../../src/quests/producers/assetQuestEvents.ts'
import { createMinigameCompletedQuestEvent } from '../../src/quests/producers/minigameQuestEvents.ts'
import { createItemCollectedQuestEvent } from '../../src/quests/producers/itemQuestEvents.ts'
import { createStoryFlagAddedQuestEvent } from '../../src/quests/producers/storyQuestEvents.ts'

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
        createSmallVenueGoodGigQuestEvent({
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

  await t.test('brand producer includes deal type and alignment', () => {
    const event = createBrandDealCompletedQuestEvent({
      id: 'deal_1',
      name: 'Deal',
      description: 'Desc',
      type: 'Endorsement',
      alignment: 'INDIE',
      requirements: { followers: 0 },
      offer: { upfront: 0, duration: 1 }
    })

    assert.equal(event.type, 'brand.dealCompleted')
    assert.equal(event.context?.dealId, 'deal_1')
    assert.equal(event.context?.dealType, 'Endorsement')
    assert.equal(event.context?.brandAlignment, 'INDIE')
  })

  await t.test('asset producer includes asset and module context', () => {
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
  })

  await t.test('item and story producers expose ids', () => {
    const item = createItemCollectedQuestEvent({ itemId: 'lucky_pick' })
    assert.equal(item.type, 'item.collected')
    assert.equal(item.context?.itemId, 'lucky_pick')

    const flag = createStoryFlagAddedQuestEvent({
      flag: 'cancel_quest_active'
    })
    assert.equal(flag.type, 'story.flagAdded')
    assert.equal(flag.context?.flag, 'cancel_quest_active')
  })
})
