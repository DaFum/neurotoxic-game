import test from 'node:test'
import assert from 'node:assert/strict'
import {
  QuestLifecycle,
  canAcceptQuest
} from '../../../src/domain/questLifecycle.js'
import { QuestProgress } from '../../../src/utils/questProgress.ts'
import { QUEST_REGISTRY } from '../../../src/data/questRegistry.ts'
import { QUEST_PROVE_YOURSELF } from '../../../src/data/questsConstants.js'
import { BRAND_DEALS } from '../../../src/data/brandDeals.ts'
import { createBrandDealCompletedQuestEvent } from '../../../src/quests/producers/brandQuestEvents.ts'

test('QuestLifecycle', async t => {
  await t.test('completeQuest', async t => {
    await t.test('handles missing activeQuests', () => {
      const state = {}
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState, state)
    })

    await t.test('returns state if quest not found', () => {
      const state = { activeQuests: [{ id: 'q2' }] }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState, state)
    })

    await t.test(
      'handles quest array containing matching id but is null somehow (simulated via mock findIndex)',
      () => {
        const state = { activeQuests: [{ id: 'q1' }] }
        state.activeQuests.findIndex = () => 0
        // We replace the item with null so the findIndex matches 0 but quest is falsy

        state.activeQuests[0] = null
        const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
        assert.equal(nextState, state)
      }
    )

    await t.test(
      'removes quest from activeQuests and adds generic toast',
      () => {
        const state = {
          activeQuests: [{ id: 'q1', label: 'Test Quest' }],
          toasts: []
        }
        const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
        assert.equal(nextState.activeQuests.length, 0)
        assert.equal(nextState.toasts.length, 1)
        assert.equal(nextState.toasts[0].messageKey, 'ui:toast.quest_complete')
      }
    )

    await t.test(
      'uses quest id for generic completion toast without label',
      () => {
        const state = {
          activeQuests: [{ id: 'q1' }],
          toasts: []
        }
        const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
        assert.equal(nextState.toasts[0].options.name, 'q1')
      }
    )

    await t.test('applies money reward', () => {
      const state = {
        activeQuests: [{ id: 'q1', label: 'Money Quest', moneyReward: 100 }],
        player: { money: 50 },
        toasts: []
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.player.money, 150)
      assert.equal(nextState.toasts.length, 1)
      assert.equal(
        nextState.toasts[0].messageKey,
        'ui:toast.quest_complete_money'
      )
    })

    await t.test('handles negative money applied via clamping', () => {
      const state = {
        activeQuests: [{ id: 'q1', label: 'Money Quest', moneyReward: 100 }],
        player: { money: -50 } // clamped
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.player.money, 50)
    })

    await t.test('handles missing player money and toasts', () => {
      const state = {
        activeQuests: [{ id: 'q1', moneyReward: 100 }]
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.player.money, 100)
      assert.equal(nextState.toasts.length, 1)
    })

    await t.test('handles missing player object for money reward', () => {
      const state = {
        activeQuests: [{ id: 'q1', moneyReward: 100 }],
        player: undefined
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.player.money, 100)
    })

    await t.test('does not toast if money delta is 0', () => {
      const state = {
        activeQuests: [{ id: 'q1', moneyReward: 0 }],
        player: { money: 100 },
        toasts: []
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.player.money, 100)
      assert.equal(nextState.toasts.length, 1) // Only generic toast
      assert.equal(nextState.toasts[0].messageKey, 'ui:toast.quest_complete')
    })

    await t.test('does not add generic toast if there is a money toast', () => {
      const state = {
        activeQuests: [{ id: 'q1', moneyReward: 100 }],
        player: { money: 100 },
        toasts: []
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.toasts.length, 1)
      assert.equal(
        nextState.toasts[0].messageKey,
        'ui:toast.quest_complete_money'
      )
    })

    await t.test('applies item reward', () => {
      const state = {
        activeQuests: [
          {
            id: 'q1',
            label: 'Item Quest',
            rewardType: 'item',
            rewardData: { item: 'guitar' }
          }
        ],
        band: { inventory: {} },
        toasts: []
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.band.inventory['guitar'], true)
      assert.equal(nextState.toasts.length, 1)
      assert.equal(
        nextState.toasts[0].messageKey,
        'ui:toast.quest_complete_item'
      )
    })

    await t.test('applies item reward with missing band inventory', () => {
      const state = {
        activeQuests: [
          { id: 'q1', rewardType: 'item', rewardData: { item: 'guitar' } }
        ]
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.band.inventory['guitar'], true)
    })

    await t.test(
      'applies item reward with missing band and missing item key handles properly',
      () => {
        const state = {
          activeQuests: [{ id: 'q1', rewardType: 'item', rewardData: {} }]
        }
        const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
        assert.equal(nextState.band, undefined)
        assert.equal(nextState.toasts[0].messageKey, 'ui:toast.quest_complete')
      }
    )

    await t.test('applies fame reward', () => {
      const state = {
        activeQuests: [
          {
            id: 'q1',
            label: 'Fame Quest',
            rewardType: 'fame',
            rewardData: { fame: 50 }
          }
        ],
        player: { fame: 10, fameLevel: 0 },
        toasts: []
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.player.fame, 60)
      assert.ok(nextState.player.fameLevel >= 0)
      assert.equal(nextState.toasts.length, 1)
      assert.equal(
        nextState.toasts[0].messageKey,
        'ui:toast.quest_complete_fame'
      )
    })

    await t.test(
      'applies fame reward with missing player object handling',
      () => {
        const state = {
          activeQuests: [
            { id: 'q1', rewardType: 'fame', rewardData: { fame: 50 } }
          ],
          player: undefined
        }
        const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
        assert.equal(nextState.player.fame, 50)
      }
    )

    await t.test('applies fame reward with invalid fame string', () => {
      const state = {
        activeQuests: [
          { id: 'q1', rewardType: 'fame', rewardData: { fame: 'NaN' } }
        ],
        player: { fame: 10 }
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.player.fame, 10)
    })

    await t.test('does not toast if fame delta is 0', () => {
      const state = {
        activeQuests: [
          { id: 'q1', rewardType: 'fame', rewardData: { fame: 0 } }
        ],
        player: { fame: 100 },
        toasts: []
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.toasts[0].messageKey, 'ui:toast.quest_complete')
    })

    await t.test('ignores fame reward if rewardData is falsy', () => {
      const state = {
        activeQuests: [{ id: 'q1', rewardType: 'fame', rewardData: null }],
        player: { fame: 10 }
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.player.fame, 10)
    })

    await t.test('applies harmony reward', () => {
      const state = {
        activeQuests: [
          {
            id: 'q1',
            label: 'Harmony Quest',
            rewardType: 'harmony',
            rewardData: { harmony: 20 }
          }
        ],
        band: { harmony: 50 },
        toasts: []
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.band.harmony, 70)
      assert.equal(nextState.toasts.length, 1)
      assert.equal(
        nextState.toasts[0].messageKey,
        'ui:toast.quest_complete_harmony'
      )
    })

    await t.test('applies fans reward to the instagram following', () => {
      const state = {
        activeQuests: [
          { id: 'q1', rewardType: 'fans', rewardData: { fans: 150 } }
        ],
        social: { instagram: 1000 },
        toasts: []
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.social.instagram, 1150)
      assert.equal(
        nextState.toasts[0].messageKey,
        'ui:toast.quest_complete_fans'
      )
    })

    await t.test('applies loyalty reward (clamped)', () => {
      const state = {
        activeQuests: [
          { id: 'q1', rewardType: 'loyalty', rewardData: { loyalty: 15 } }
        ],
        social: { loyalty: 50 },
        toasts: []
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.social.loyalty, 65)
      assert.equal(
        nextState.toasts[0].messageKey,
        'ui:toast.quest_complete_loyalty'
      )
    })

    await t.test('applies controversy_reduction reward', () => {
      const state = {
        activeQuests: [
          {
            id: 'q1',
            rewardType: 'controversy_reduction',
            rewardData: { controversy: 20 }
          }
        ],
        social: { controversyLevel: 30 },
        toasts: []
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.social.controversyLevel, 10)
      assert.equal(
        nextState.toasts[0].messageKey,
        'ui:toast.quest_complete_controversy'
      )
    })

    await t.test('applies new rewards arrays', () => {
      const state = {
        activeQuests: [
          {
            id: 'q_new_rewards',
            label: 'New Rewards',
            rewards: [
              { type: 'money', amount: 25 },
              { type: 'fame', amount: 5 },
              { type: 'social.loyalty', amount: 7 },
              { type: 'band.harmony', amount: 4 },
              { type: 'item.add', itemId: 'zine_bundle' }
            ]
          }
        ],
        player: { money: 10, fame: 0, fameLevel: 0 },
        social: { loyalty: 50 },
        band: { harmony: 40, inventory: {} },
        toasts: []
      }

      const nextState = QuestLifecycle.completeQuest(state, {
        questId: 'q_new_rewards'
      })

      assert.equal(nextState.player.money, 35)
      assert.equal(nextState.player.fame, 5)
      assert.equal(nextState.social.loyalty, 57)
      assert.equal(nextState.band.harmony, 44)
      assert.equal(nextState.band.inventory.zine_bundle, true)
      assert.equal(nextState.toasts.length, 5)
    })

    await t.test('applies backbone reward types through appliers', () => {
      const state = {
        activeQuests: [
          {
            id: 'q_backbone_rewards',
            label: 'Backbone Rewards',
            rewards: [
              { type: 'asset.repair', assetId: 'asset_1', amount: 15 },
              { type: 'venue.reputation', scope: 'venue_1', amount: 5 },
              { type: 'region.reputation', scope: 'berlin', amount: 7 },
              { type: 'brand.trust', brandId: 'ampcorp', amount: 10 },
              {
                type: 'trait.unlock',
                memberId: 'Matze',
                traitId: 'gear_nerd'
              },
              { type: 'event.queue', eventId: 'quest_reward_followup' }
            ]
          }
        ],
        player: { money: 0, fame: 0, fameLevel: 0 },
        social: { brandReputation: { ampcorp: 2 } },
        reputationByRegion: { berlin: 3 },
        reputationByVenue: { venue_1: 1 },
        pendingEvents: [],
        assets: [
          {
            id: 'asset_1',
            kind: 'tourbus_chassis',
            condition: 80,
            slots: []
          }
        ],
        band: {
          members: [
            {
              id: 'matze',
              name: 'Matze',
              mood: 80,
              stamina: 100,
              traits: {},
              relationships: {}
            }
          ],
          inventory: {}
        },
        toasts: []
      }

      const nextState = QuestLifecycle.completeQuest(state, {
        questId: 'q_backbone_rewards'
      })

      assert.equal(nextState.assets[0].condition, 95)
      assert.equal(nextState.reputationByVenue.venue_1, 6)
      assert.equal(nextState.reputationByRegion.berlin, 10)
      assert.equal(nextState.social.brandReputation.ampcorp, 12)
      assert.ok(nextState.band.members[0].traits.gear_nerd)
      assert.deepEqual(nextState.pendingEvents, ['quest_reward_followup'])
    })

    await t.test('applies harmony reward with missing band', () => {
      const state = {
        activeQuests: [
          { id: 'q1', rewardType: 'harmony', rewardData: { harmony: 20 } }
        ]
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.band.harmony, 21)
    })

    await t.test(
      'applies harmony reward with invalid string falling back to 0',
      () => {
        const state = {
          activeQuests: [
            { id: 'q1', rewardType: 'harmony', rewardData: { harmony: 'NaN' } }
          ],
          band: { harmony: 10 }
        }
        const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
        assert.equal(nextState.band.harmony, 10)
      }
    )

    await t.test('does not toast if harmony delta is 0', () => {
      const state = {
        activeQuests: [
          { id: 'q1', rewardType: 'harmony', rewardData: { harmony: 0 } }
        ],
        band: { harmony: 50 }
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.toasts[0].messageKey, 'ui:toast.quest_complete')
    })

    await t.test(
      'applies skill point reward with missing band does nothing',
      () => {
        const state = {
          activeQuests: [{ id: 'q1', rewardType: 'skill_point' }]
        }
        const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
        assert.equal(nextState.band, undefined)
      }
    )

    await t.test(
      'applies skill point reward with randomIdx and missing baseStats',
      () => {
        const state = {
          activeQuests: [
            {
              id: 'q1',
              label: 'Skill Quest',
              rewardType: 'skill_point',
              rewardData: {}
            }
          ],
          band: { members: [{ name: 'A', skill: 5 }] },
          toasts: []
        }
        const nextState = QuestLifecycle.completeQuest(state, {
          questId: 'q1',
          randomIdx: 0
        })
        assert.equal(nextState.band.members[0].baseStats.skill, 6)
        assert.equal(nextState.toasts.length, 1)
        assert.equal(
          nextState.toasts[0].messageKey,
          'ui:toast.quest_complete_skill'
        )
      }
    )

    await t.test(
      'applies skill point reward fallback 0 for missing memberIndex and randomIdx',
      () => {
        const state = {
          activeQuests: [
            { id: 'q1', rewardType: 'skill_point', rewardData: {} }
          ],
          band: {
            members: [
              { name: 'A', skill: 5 },
              { name: 'B', skill: 5 }
            ]
          }
        }
        const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
        assert.equal(nextState.band.members[0].baseStats.skill, 6)
        assert.equal(nextState.band.members[1].baseStats?.skill, undefined)
      }
    )

    await t.test('skill point reward never pushes skill above 10', () => {
      const state = {
        activeQuests: [
          {
            id: 'q1',
            rewardType: 'skill_point',
            rewardData: { memberIndex: 0 }
          }
        ],
        band: { members: [{ name: 'A', baseStats: { skill: 10 } }] }
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.band.members[0].baseStats.skill, 10)
    })

    await t.test(
      'applies skill point reward with invalid string memberIndex falling back to randomIdx / 0',
      () => {
        const state = {
          activeQuests: [
            {
              id: 'q1',
              rewardType: 'skill_point',
              rewardData: { memberIndex: 'NaN' }
            }
          ],
          band: { members: [{ skill: 10 }] }
        }
        const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
        // Skill is capped at 10, matching event skill deltas.
        assert.equal(nextState.band.members[0].baseStats.skill, 10)
        assert.deepEqual(nextState.toasts[0].options, {
          name: 'q1',
          member: ''
        })
      }
    )

    await t.test(
      'applies skill point reward with index clamped out of bounds (high)',
      () => {
        const state = {
          activeQuests: [
            {
              id: 'q1',
              rewardType: 'skill_point',
              rewardData: { memberIndex: 10 }
            }
          ],
          band: { members: [{ skill: 1 }, { skill: 1 }] }
        }
        const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
        assert.equal(nextState.band.members[1].baseStats.skill, 2)
      }
    )

    await t.test(
      'applies skill point reward with index clamped out of bounds (low)',
      () => {
        const state = {
          activeQuests: [
            {
              id: 'q1',
              rewardType: 'skill_point',
              rewardData: { memberIndex: -5 }
            }
          ],
          band: { members: [{ skill: 1 }, { skill: 1 }] }
        }
        const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
        assert.equal(nextState.band.members[0].baseStats.skill, 2)
      }
    )

    await t.test(
      'applies skill point reward and handles non-finite existing skill',
      () => {
        const state = {
          activeQuests: [
            {
              id: 'q1',
              rewardType: 'skill_point',
              rewardData: { memberIndex: 0 }
            }
          ],
          band: { members: [{ name: 'A', skill: NaN }] }
        }
        const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
        assert.equal(nextState.band.members[0].baseStats.skill, 1)
      }
    )

    await t.test(
      'does nothing for skill point reward if originalMembers is empty',
      () => {
        const state = {
          activeQuests: [
            {
              id: 'q1',
              rewardType: 'skill_point',
              rewardData: { memberIndex: 0 }
            }
          ],
          band: { members: [] }
        }
        const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
        assert.deepEqual(nextState.band.members, [])
      }
    )

    await t.test('applies skill point reward properly', () => {
      const state = {
        activeQuests: [
          {
            id: 'q1',
            label: 'Skill Quest',
            rewardType: 'skill_point',
            rewardData: { memberIndex: 1 }
          }
        ],
        band: {
          members: [
            { name: 'A', skill: 5 },
            { name: 'B', skill: 5, baseStats: { skill: 5 } }
          ]
        },
        toasts: []
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.band.members[1].baseStats.skill, 6)
      assert.equal(nextState.toasts.length, 1)
      assert.equal(
        nextState.toasts[0].messageKey,
        'ui:toast.quest_complete_skill'
      )
    })

    await t.test('handles rewardFlag', () => {
      const state = {
        activeQuests: [{ id: 'q1', rewardFlag: 'flag_unlocked' }]
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.deepEqual(nextState.activeStoryFlags, ['flag_unlocked'])
    })

    await t.test('handles rewardFlag with missing activeStoryFlags', () => {
      const state = {
        activeQuests: [{ id: 'q1', rewardFlag: 'flag1' }],
        activeStoryFlags: undefined
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.deepEqual(nextState.activeStoryFlags, ['flag1'])
    })

    await t.test('applies completionFlags on completion', () => {
      const state = {
        activeQuests: [
          {
            id: 'q1',
            completionFlags: ['story_complete']
          }
        ],
        activeStoryFlags: ['existing_flag']
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.deepEqual(nextState.activeStoryFlags, [
        'existing_flag',
        'story_complete'
      ])
    })

    await t.test('handles hardcoded QUEST_PROVE_YOURSELF', () => {
      const state = {
        activeQuests: [{ id: QUEST_PROVE_YOURSELF }],
        venueBlacklist: ['v1', 'v2', 'v3'],
        player: { stats: { proveYourselfMode: true } }
      }
      const nextState = QuestLifecycle.completeQuest(state, {
        questId: QUEST_PROVE_YOURSELF
      })
      assert.deepEqual(nextState.venueBlacklist, ['v3'])
      assert.equal(nextState.player.stats.proveYourselfMode, false)
    })

    await t.test(
      'handles hardcoded QUEST_PROVE_YOURSELF with undefined venueBlacklist fallback',
      () => {
        const state = {
          activeQuests: [{ id: QUEST_PROVE_YOURSELF }],
          venueBlacklist: undefined,
          player: { stats: { proveYourselfMode: true } }
        }
        const nextState = QuestLifecycle.completeQuest(state, {
          questId: QUEST_PROVE_YOURSELF
        })
        assert.deepEqual(nextState.venueBlacklist, [])
      }
    )

    await t.test(
      'handles hardcoded QUEST_PROVE_YOURSELF with no venueBlacklist property at all',
      () => {
        const state = {
          activeQuests: [{ id: QUEST_PROVE_YOURSELF }],
          player: { stats: { proveYourselfMode: true } }
        }
        const nextState = QuestLifecycle.completeQuest(state, {
          questId: QUEST_PROVE_YOURSELF
        })
        assert.deepEqual(nextState.venueBlacklist, [])
      }
    )
  })

  await t.test('QuestProgress.applyEvent', async t => {
    const baseState = quest => ({
      player: { day: 1 },
      activeQuests: [quest],
      activeStoryFlags: [],
      completedQuestIds: [],
      questCooldowns: []
    })

    await t.test('advances a quest whose progressSource matches', () => {
      // pick_of_destiny -> good_gig, required 3
      const state = baseState({
        id: 'quest_pick_of_destiny',
        progress: 0,
        required: 3
      })
      const next = QuestProgress.applyEvent(state, {
        type: 'good_gig',
        score: 80,
        capacity: 100,
        venueId: 'v',
        region: 'r'
      })
      const q = next.activeQuests.find(q => q.id === 'quest_pick_of_destiny')
      assert.equal(q.progress, 1)
    })

    await t.test('does not advance a non-matching progressSource', () => {
      // prove_yourself -> small_venue_good_gig; a plain good_gig must not count
      const state = baseState({
        id: 'quest_prove_yourself',
        progress: 0,
        required: 4
      })
      const next = QuestProgress.applyEvent(state, {
        type: 'good_gig',
        score: 80,
        capacity: 100,
        venueId: 'v',
        region: 'r'
      })
      const q = next.activeQuests.find(q => q.id === 'quest_prove_yourself')
      assert.equal(q.progress ?? 0, 0)
    })

    await t.test('auto-completes when progress reaches required', () => {
      let state = baseState({
        id: 'quest_pick_of_destiny',
        progress: 2,
        required: 3
      })
      state = QuestProgress.applyEvent(state, {
        type: 'good_gig',
        score: 80,
        capacity: 100,
        venueId: 'v',
        region: 'r'
      })
      assert.equal(
        state.activeQuests.find(q => q.id === 'quest_pick_of_destiny'),
        undefined
      )
      assert.ok(state.completedQuestIds.includes('quest_pick_of_destiny'))
    })

    await t.test('ignores non-finite amounts', () => {
      const state = baseState({
        id: 'quest_viral_dance',
        progress: 0,
        required: 500
      })
      const next = QuestProgress.applyEvent(state, {
        type: 'followers_gained',
        amount: Number.NaN
      })
      const q = next.activeQuests.find(q => q.id === 'quest_viral_dance')
      assert.equal(q.progress ?? 0, 0)
    })

    await t.test(
      'harmony_recovered with newHarmony sets threshold progress without completing below target',
      () => {
        // quest_harmony_project required 75 in the registry
        const state = baseState({
          id: 'quest_harmony_project',
          progress: 0,
          required: 75
        })
        const next = QuestProgress.applyEvent(state, {
          type: 'harmony_recovered',
          amount: 5,
          newHarmony: 60
        })
        const q = next.activeQuests.find(q => q.id === 'quest_harmony_project')
        assert.ok(q, 'quest should still be active below threshold')
        assert.equal(q.progress, 60)
      }
    )

    await t.test(
      'harmony_recovered completes the quest when newHarmony reaches the threshold',
      () => {
        const state = baseState({
          id: 'quest_harmony_project',
          progress: 60,
          required: 75
        })
        const next = QuestProgress.applyEvent(state, {
          type: 'harmony_recovered',
          amount: 0,
          newHarmony: 80
        })
        assert.equal(
          next.activeQuests.find(q => q.id === 'quest_harmony_project'),
          undefined
        )
        assert.ok(next.completedQuestIds.includes('quest_harmony_project'))
      }
    )

    await t.test('setQuestProgress never lowers existing progress', () => {
      const state = baseState({
        id: 'quest_harmony_project',
        progress: 70,
        required: 75
      })
      const next = QuestProgress.applyEvent(state, {
        type: 'harmony_recovered',
        amount: 0,
        newHarmony: 40
      })
      const q = next.activeQuests.find(q => q.id === 'quest_harmony_project')
      assert.equal(q.progress, 70)
    })

    await t.test('does not advance perVenue quests from another venue', () => {
      const state = baseState({
        id: 'quest_venue_residency',
        scopeKey: 'venue_A',
        progress: 0,
        required: 3,
        repeatPolicy: 'perVenue'
      })
      const next = QuestProgress.applyEvent(state, {
        type: 'good_gig',
        score: 80,
        capacity: 100,
        venueId: 'venue_B',
        region: 'r'
      })
      const q = next.activeQuests.find(q => q.id === 'quest_venue_residency')
      assert.equal(q.progress ?? 0, 0)
    })

    await t.test('advances perVenue quests in their stamped venue', () => {
      const state = baseState({
        id: 'quest_venue_residency',
        scopeKey: 'venue_A',
        progress: 0,
        required: 3,
        repeatPolicy: 'perVenue'
      })
      const next = QuestProgress.applyEvent(state, {
        type: 'good_gig',
        score: 80,
        capacity: 100,
        venueId: 'venue_A',
        region: 'r'
      })
      const q = next.activeQuests.find(q => q.id === 'quest_venue_residency')
      assert.equal(q.progress, 1)
    })

    await t.test('does not trust inherited venueId for perVenue scope', () => {
      const state = baseState({
        id: 'quest_venue_residency',
        scopeKey: 'venue_A',
        progress: 0,
        required: 3,
        repeatPolicy: 'perVenue'
      })
      const event = Object.assign(Object.create({ venueId: 'venue_A' }), {
        type: 'good_gig',
        score: 80,
        capacity: 100,
        region: 'r'
      })
      const next = QuestProgress.applyEvent(state, event)
      const q = next.activeQuests.find(q => q.id === 'quest_venue_residency')
      assert.equal(q.progress ?? 0, 0)
    })

    await t.test('does not advance scoped quests without a scope key', () => {
      const state = baseState({
        id: 'quest_venue_residency',
        progress: 0,
        required: 3,
        repeatPolicy: 'perVenue'
      })
      const next = QuestProgress.applyEvent(state, {
        type: 'good_gig',
        score: 80,
        capacity: 100,
        venueId: 'venue_A',
        region: 'r'
      })
      const q = next.activeQuests.find(q => q.id === 'quest_venue_residency')
      assert.equal(q.progress ?? 0, 0)
    })

    await t.test(
      'does not advance perRegion quests from another region',
      () => {
        const state = baseState({
          id: 'quest_local_legend',
          scopeKey: 'magdeburg',
          progress: 0,
          required: 500,
          repeatPolicy: 'perRegion'
        })
        const next = QuestProgress.applyEvent(state, {
          type: 'fame_gained',
          amount: 100,
          region: 'berlin'
        })
        const q = next.activeQuests.find(q => q.id === 'quest_local_legend')
        assert.equal(q.progress ?? 0, 0)
      }
    )

    await t.test('advances perRegion quests when region matches', () => {
      const state = baseState({
        id: 'quest_local_legend',
        scopeKey: 'magdeburg',
        progress: 0,
        required: 500,
        repeatPolicy: 'perRegion'
      })
      const next = QuestProgress.applyEvent(state, {
        type: 'fame_gained',
        amount: 100,
        region: 'magdeburg'
      })
      const q = next.activeQuests.find(q => q.id === 'quest_local_legend')
      assert.equal(q.progress, 100)
    })

    await t.test('does not trust inherited region for perRegion scope', () => {
      const state = baseState({
        id: 'quest_local_legend',
        scopeKey: 'magdeburg',
        progress: 0,
        required: 500,
        repeatPolicy: 'perRegion'
      })
      const event = Object.assign(Object.create({ region: 'magdeburg' }), {
        type: 'fame_gained',
        amount: 100
      })
      const next = QuestProgress.applyEvent(state, event)
      const q = next.activeQuests.find(q => q.id === 'quest_local_legend')
      assert.equal(q.progress ?? 0, 0)
    })

    await t.test('viral_dance does not advance on instagram followers', () => {
      const state = baseState({
        id: 'quest_viral_dance',
        progress: 0,
        required: 500
      })
      const next = QuestProgress.applyEvent(state, {
        type: 'followers_gained',
        amount: 100,
        platform: 'instagram'
      })
      const q = next.activeQuests.find(q => q.id === 'quest_viral_dance')
      assert.equal(q.progress ?? 0, 0)
    })

    await t.test('viral_dance advances on tiktok followers', () => {
      const state = baseState({
        id: 'quest_viral_dance',
        progress: 0,
        required: 500
      })
      const next = QuestProgress.applyEvent(state, {
        type: 'followers_gained',
        amount: 100,
        platform: 'tiktok'
      })
      const q = next.activeQuests.find(q => q.id === 'quest_viral_dance')
      assert.equal(q.progress, 100)
    })

    await t.test('community_outreach ignores drama posts', () => {
      const state = baseState({
        id: 'quest_community_outreach',
        progress: 0,
        required: 4
      })
      const next = QuestProgress.applyEvent(state, {
        type: 'social_post',
        postType: 'post',
        followersGain: 0,
        category: 'Drama'
      })
      const q = next.activeQuests.find(q => q.id === 'quest_community_outreach')
      assert.equal(q.progress ?? 0, 0)
    })

    await t.test(
      'does not match progress rules through polluted context prototype',
      () => {
        const state = baseState({
          id: 'quest_community_outreach',
          progress: 0,
          required: 4
        })
        const next = QuestProgress.applyEvent(state, {
          type: 'social.postResolved',
          amount: 1,
          success: true,
          context: JSON.parse('{"__proto__":{"postCategory":"Lifestyle"}}')
        })
        const q = next.activeQuests.find(
          q => q.id === 'quest_community_outreach'
        )
        assert.equal(q.progress ?? 0, 0)
      }
    )

    await t.test('community_outreach advances on lifestyle posts', () => {
      const state = baseState({
        id: 'quest_community_outreach',
        progress: 0,
        required: 4
      })
      const next = QuestProgress.applyEvent(state, {
        type: 'social_post',
        postType: 'post',
        followersGain: 0,
        category: 'Lifestyle',
        success: true
      })
      const q = next.activeQuests.find(q => q.id === 'quest_community_outreach')
      assert.equal(q.progress, 1)
    })

    await t.test('success-matched rules ignore events without success', () => {
      const state = baseState({
        id: 'quest_community_outreach',
        progress: 0,
        required: 4
      })
      const next = QuestProgress.applyEvent(state, {
        type: 'social_post',
        postType: 'post',
        followersGain: 0,
        category: 'Lifestyle'
      })
      const q = next.activeQuests.find(q => q.id === 'quest_community_outreach')
      assert.equal(q.progress ?? 0, 0)
    })

    await t.test('premium_endorsement ignores non-endorsement deals', () => {
      const state = baseState({
        id: 'quest_premium_endorsement',
        progress: 0,
        required: 3
      })
      const next = QuestProgress.applyEvent(state, {
        type: 'brand_deal_completed',
        dealId: 'deal1',
        dealType: 'SPONSORSHIP'
      })
      const q = next.activeQuests.find(
        q => q.id === 'quest_premium_endorsement'
      )
      assert.equal(q.progress ?? 0, 0)
    })

    await t.test(
      'brand quests progress from real brand deal producer events',
      () => {
        const sponsorship = BRAND_DEALS.find(
          deal => deal.type === 'SPONSORSHIP'
        )
        const endorsement = BRAND_DEALS.find(
          deal => deal.type === 'ENDORSEMENT'
        )
        assert.ok(sponsorship)
        assert.ok(endorsement)

        const sponsorState = baseState({
          id: 'quest_sponsor_demand',
          progress: 0,
          required: 2
        })
        const sponsorNext = QuestProgress.applyEvent(
          sponsorState,
          createBrandDealCompletedQuestEvent(sponsorship)
        )
        assert.equal(
          sponsorNext.activeQuests.find(q => q.id === 'quest_sponsor_demand')
            ?.progress,
          1
        )

        const endorsementState = baseState({
          id: 'quest_premium_endorsement',
          progress: 0,
          required: 3
        })
        const endorsementNext = QuestProgress.applyEvent(
          endorsementState,
          createBrandDealCompletedQuestEvent(endorsement)
        )
        assert.equal(
          endorsementNext.activeQuests.find(
            q => q.id === 'quest_premium_endorsement'
          )?.progress,
          1
        )
      }
    )

    await t.test(
      'supports inline progressRules with multiple event paths',
      () => {
        let state = baseState({
          id: 'q_multi_path',
          progress: 0,
          required: 3,
          progressRules: [
            {
              event: 'social.postResolved',
              amount: 'fixed',
              fixedAmount: 1,
              match: { postCategory: 'Community', success: true }
            },
            {
              event: 'brand.dealCompleted',
              amount: 'fixed',
              fixedAmount: 2,
              match: { dealType: 'SPONSORSHIP' }
            }
          ]
        })

        state = QuestProgress.applyEvent(state, {
          type: 'social.postResolved',
          amount: 1,
          success: true,
          context: { postCategory: 'Drama' }
        })
        assert.equal(
          state.activeQuests.find(q => q.id === 'q_multi_path')?.progress ?? 0,
          0
        )

        state = QuestProgress.applyEvent(state, {
          type: 'social.postResolved',
          amount: 1,
          success: true,
          context: { postCategory: 'Community' }
        })
        assert.equal(
          state.activeQuests.find(q => q.id === 'q_multi_path')?.progress,
          1
        )

        state = QuestProgress.applyEvent(state, {
          type: 'brand.dealCompleted',
          amount: 1,
          success: true,
          context: { dealType: 'SPONSORSHIP' }
        })
        assert.equal(
          state.activeQuests.find(q => q.id === 'q_multi_path'),
          undefined
        )
        assert.ok(state.completedQuestIds.includes('q_multi_path'))
      }
    )

    await t.test('supports threshold progressRules from event context', () => {
      const state = baseState({
        id: 'q_threshold',
        progress: 10,
        required: 50,
        progressRules: [
          {
            event: 'band.harmonyChanged',
            amount: 'threshold',
            thresholdField: 'band.harmony'
          }
        ]
      })

      const next = QuestProgress.applyEvent(state, {
        type: 'band.harmonyChanged',
        amount: 15,
        success: true,
        context: { harmony: 45 }
      })
      assert.equal(
        next.activeQuests.find(q => q.id === 'q_threshold')?.progress,
        45
      )
    })
  })

  await t.test('repeat policy enforcement', async t => {
    await t.test('never quests are blocked once completed', () => {
      let state = {
        player: { day: 1 },
        activeQuests: [],
        activeStoryFlags: [],
        completedQuestIds: [],
        questCooldowns: []
      }
      // pick_of_destiny is repeatPolicy 'never'
      state = QuestLifecycle.addQuest(state, { id: 'quest_pick_of_destiny' })
      assert.equal(state.activeQuests.length, 1)
      state = QuestLifecycle.completeQuest(state, {
        questId: 'quest_pick_of_destiny'
      })
      assert.ok(state.completedQuestIds.includes('quest_pick_of_destiny'))
      // Re-add must be refused
      state = QuestLifecycle.addQuest(state, { id: 'quest_pick_of_destiny' })
      assert.equal(
        state.activeQuests.find(q => q.id === 'quest_pick_of_destiny'),
        undefined
      )
    })

    await t.test(
      'never quests are blocked while completion flag is active',
      () => {
        const state = {
          player: { day: 1 },
          activeQuests: [],
          // ego_crisis_resolved is ego_management's rewardFlag
          activeStoryFlags: ['ego_crisis_resolved'],
          completedQuestIds: [],
          questCooldowns: []
        }
        const next = QuestLifecycle.addQuest(state, {
          id: 'quest_ego_management'
        })
        assert.equal(next, state)
      }
    )

    await t.test('cooldown quests are blocked during the window', () => {
      const state = {
        player: { day: 5 },
        activeQuests: [],
        activeStoryFlags: [],
        completedQuestIds: [],
        questCooldowns: [{ questId: 'quest_viral_dance', expiresOnDay: 10 }]
      }
      const next = QuestLifecycle.addQuest(state, { id: 'quest_viral_dance' })
      assert.equal(next, state)
    })

    await t.test('cooldown expiry allows re-add', () => {
      const state = {
        player: { day: 11 },
        activeQuests: [],
        activeStoryFlags: [],
        completedQuestIds: [],
        questCooldowns: [{ questId: 'quest_viral_dance', expiresOnDay: 10 }]
      }
      const next = QuestLifecycle.addQuest(state, { id: 'quest_viral_dance' })
      assert.ok(next.activeQuests.find(q => q.id === 'quest_viral_dance'))
    })

    await t.test(
      'perVenue quests cannot fall back to a non-gig current node',
      () => {
        const state = {
          player: { day: 1, currentNodeId: 'city_a' },
          activeQuests: [],
          activeStoryFlags: [],
          completedQuestIds: [],
          completedQuestScopes: [],
          questCooldowns: [],
          gameMap: {
            nodes: {
              city_a: { id: 'city_a', type: 'CITY' }
            }
          }
        }

        assert.deepEqual(canAcceptQuest(state, 'quest_venue_residency'), {
          ok: false,
          reason: 'scope'
        })
        assert.equal(
          QuestLifecycle.addQuest(state, { id: 'quest_venue_residency' }),
          state
        )
      }
    )

    await t.test('perVenue quests can fall back to a gig current node', () => {
      const state = {
        player: { day: 1, currentNodeId: 'venue_a' },
        activeQuests: [],
        activeStoryFlags: [],
        completedQuestIds: [],
        completedQuestScopes: [],
        questCooldowns: [],
        gameMap: {
          nodes: {
            venue_a: { id: 'venue_a', type: 'GIG' }
          }
        }
      }

      assert.deepEqual(canAcceptQuest(state, 'quest_venue_residency'), {
        ok: true,
        scopeKey: 'venue_a'
      })
    })

    await t.test('completing a cooldown quest opens a re-add window', () => {
      let state = {
        player: { day: 3 },
        activeQuests: [{ id: 'quest_viral_dance', progress: 1, required: 1 }],
        activeStoryFlags: [],
        completedQuestIds: [],
        questCooldowns: []
      }
      state = QuestLifecycle.completeQuest(state, {
        questId: 'quest_viral_dance'
      })
      const cd = state.questCooldowns.find(
        c => c.questId === 'quest_viral_dance'
      )
      assert.ok(cd, 'expected a quest cooldown entry')
      // cooldownDays is 7 in the registry
      assert.equal(cd.expiresOnDay, 10)
    })

    await t.test('allows different quest kinds to use separate slots', () => {
      const state = {
        player: { day: 1 },
        activeQuests: [{ id: 'quest_prove_yourself' }],
        activeStoryFlags: [],
        completedQuestIds: [],
        questCooldowns: []
      }

      const next = QuestLifecycle.addQuest(state, {
        id: 'quest_pick_of_destiny'
      })
      assert.ok(next.activeQuests.find(q => q.id === 'quest_prove_yourself'))
      assert.ok(next.activeQuests.find(q => q.id === 'quest_pick_of_destiny'))
    })

    await t.test('blocks quests when their kind slot is full', () => {
      const state = {
        player: { day: 1 },
        activeQuests: [
          { id: 'quest_pick_of_destiny' },
          { id: 'quest_harmony_project' },
          { id: 'quest_studio_demo' }
        ],
        activeStoryFlags: [],
        completedQuestIds: [],
        questCooldowns: []
      }

      const next = QuestLifecycle.addQuest(state, { id: 'quest_merch_rush' })
      assert.equal(next, state)
    })
  })

  await t.test('failure penalty handling', async t => {
    const makeExpiredState = penalty => ({
      player: { day: 10 },
      social: { loyalty: 50, controversyLevel: 0 },
      band: { harmony: 50 },
      activeStoryFlags: ['side_active'],
      questCooldowns: [],
      activeQuests: [
        {
          id: 'q_fail',
          deadline: 5,
          clearFlagsOnFail: ['side_active'],
          failurePenalty: penalty
        }
      ]
    })

    await t.test('applies social.loyalty penalty', () => {
      const next = QuestLifecycle.checkDeadlines(
        makeExpiredState({ social: { loyalty: -15 } })
      )
      assert.equal(next.social.loyalty, 35)
    })

    await t.test('pushes failure flags and clears clearFlagsOnFail', () => {
      const next = QuestLifecycle.checkDeadlines(
        makeExpiredState({ flags: ['side_failed'] })
      )
      assert.ok(next.activeStoryFlags.includes('side_failed'))
      assert.ok(!next.activeStoryFlags.includes('side_active'))
    })

    await t.test('applies declarative failureFlags on failure', () => {
      const next = QuestLifecycle.checkDeadlines({
        player: { day: 10 },
        social: { loyalty: 50, controversyLevel: 0 },
        band: { harmony: 50 },
        activeStoryFlags: [],
        questCooldowns: [],
        activeQuests: [
          {
            id: 'q_fail_flags',
            deadline: 5,
            failureFlags: ['story_failed']
          }
        ]
      })
      assert.ok(next.activeStoryFlags.includes('story_failed'))
    })

    await t.test('failure cooldowns block the failed quest by quest id', () => {
      const next = QuestLifecycle.checkDeadlines({
        player: { day: 10 },
        social: { loyalty: 50, controversyLevel: 0 },
        band: { harmony: 50 },
        activeStoryFlags: [],
        questCooldowns: [],
        activeQuests: [
          {
            id: 'quest_viral_dance',
            deadline: 5,
            failurePenalty: {
              cooldowns: [{ id: 'quest_viral_dance_retry', days: 7 }]
            }
          }
        ]
      })
      const cd = next.questCooldowns.find(
        c => c.questId === 'quest_viral_dance'
      )
      assert.ok(cd)
      assert.equal(cd.expiresOnDay, 17)
      assert.equal(
        QuestLifecycle.addQuest(next, { id: 'quest_viral_dance' }),
        next
      )
    })

    await t.test(
      'ego_management failure applies structured penalty without game over',
      () => {
        const state = {
          player: { day: 10 },
          social: { loyalty: 50, controversyLevel: 0 },
          band: { harmony: 50 },
          activeStoryFlags: [],
          questCooldowns: [],
          activeQuests: [
            {
              id: 'quest_ego_management',
              deadline: 5,
              failurePenalty: QUEST_REGISTRY.quest_ego_management.failurePenalty
            }
          ]
        }
        const next = QuestLifecycle.checkDeadlines(state)
        assert.equal(next.gameOver, undefined)
        assert.equal(next.band.harmony, 25)
        assert.equal(next.social.loyalty, 35)
        assert.equal(next.social.controversyLevel, 10)
        assert.ok(next.activeStoryFlags.includes('ego_crisis_failed'))
      }
    )

    await t.test('applies new failurePenalties arrays', () => {
      const next = QuestLifecycle.checkDeadlines({
        player: { day: 10 },
        social: { loyalty: 50, controversyLevel: 0 },
        band: { harmony: 50 },
        activeStoryFlags: [],
        questCooldowns: [],
        activeQuests: [
          {
            id: 'q_new_penalties',
            deadline: 5,
            failurePenalties: [
              { type: 'social.loyalty', amount: -10 },
              { type: 'social.controversy', amount: 8 },
              { type: 'band.harmony', amount: -5 },
              { type: 'flag.add', flag: 'q_new_penalties_failed' },
              { type: 'quest.cooldown', days: 3 }
            ]
          }
        ]
      })

      assert.equal(next.social.loyalty, 40)
      assert.equal(next.social.controversyLevel, 8)
      assert.equal(next.band.harmony, 45)
      assert.ok(next.activeStoryFlags.includes('q_new_penalties_failed'))
      assert.deepEqual(next.questCooldowns, [
        { questId: 'q_new_penalties', expiresOnDay: 13 }
      ])
    })

    await t.test(
      'applies backbone failure penalty types through appliers',
      () => {
        const next = QuestLifecycle.checkDeadlines({
          player: { day: 10 },
          social: { brandReputation: { ampcorp: 20 } },
          band: { harmony: 50 },
          reputationByRegion: { berlin: 10 },
          reputationByVenue: { venue_1: 5 },
          pendingEvents: [],
          activeStoryFlags: [],
          questCooldowns: [],
          assets: [
            {
              id: 'asset_1',
              kind: 'tourbus_chassis',
              condition: 80,
              slots: []
            }
          ],
          activeQuests: [
            {
              id: 'q_backbone_penalties',
              deadline: 5,
              failurePenalties: [
                { type: 'asset.damage', assetId: 'asset_1', amount: 25 },
                { type: 'venue.reputation', scope: 'venue_1', amount: -8 },
                { type: 'region.reputation', scope: 'berlin', amount: -6 },
                { type: 'brand.trust', brandId: 'ampcorp', amount: -7 },
                { type: 'event.queue', eventId: 'quest_failure_followup' }
              ]
            }
          ]
        })

        assert.equal(next.assets[0].condition, 55)
        assert.equal(next.reputationByVenue.venue_1, -3)
        assert.equal(next.reputationByRegion.berlin, 4)
        assert.equal(next.social.brandReputation.ampcorp, 13)
        assert.deepEqual(next.pendingEvents, ['quest_failure_followup'])
      }
    )
  })
})
