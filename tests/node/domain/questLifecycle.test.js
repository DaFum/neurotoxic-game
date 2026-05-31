import test from 'node:test'
import assert from 'node:assert/strict'
import { QuestLifecycle } from '../../../src/domain/questLifecycle.js'
import { QuestProgress } from '../../../src/utils/questProgress.ts'
import { QUEST_REGISTRY } from '../../../src/data/questRegistry.ts'
import { QUEST_PROVE_YOURSELF } from '../../../src/data/questsConstants.js'

test('QuestLifecycle', async t => {
  await t.test('addQuest', async t => {
    await t.test('adds a quest if it is not already active', () => {
      const state = { activeQuests: [] }
      const quest = { id: 'test1' }
      const nextState = QuestLifecycle.addQuest(state, quest)
      assert.deepEqual(nextState.activeQuests, [quest])
      assert.notEqual(nextState, state)
    })

    await t.test('does not add a quest if it is already active', () => {
      const quest = { id: 'test1' }
      const state = { activeQuests: [quest] }
      const nextState = QuestLifecycle.addQuest(state, quest)
      assert.equal(nextState, state)
    })

    await t.test('handles missing activeQuests array', () => {
      const state = {}
      const quest = { id: 'test1' }
      const nextState = QuestLifecycle.addQuest(state, quest)
      assert.deepEqual(nextState.activeQuests, [quest])
    })
  })

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
        assert.equal(nextState.band.members[0].baseStats.skill, 11)
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

  await t.test('advanceQuest', async t => {
    await t.test('returns original state if activeQuests is missing', () => {
      const state = {}
      const nextState = QuestLifecycle.advanceQuest(state, { questId: 'q1' })
      assert.equal(nextState, state)
    })

    await t.test(
      'does not advance progress if required is not a number',
      () => {
        const state = { activeQuests: [{ id: 'q1', progress: 0 }] }
        const nextState = QuestLifecycle.advanceQuest(state, {
          questId: 'q1',
          amount: 2
        })
        assert.equal(nextState.activeQuests[0].progress, 0)
      }
    )

    await t.test('advances progress', () => {
      const state = { activeQuests: [{ id: 'q1', progress: 0, required: 5 }] }
      const nextState = QuestLifecycle.advanceQuest(state, {
        questId: 'q1',
        amount: 2
      })
      assert.equal(nextState.activeQuests[0].progress, 2)
    })

    await t.test('advances progress when progress is missing', () => {
      const state = { activeQuests: [{ id: 'q1', required: 5 }] }
      const nextState = QuestLifecycle.advanceQuest(state, {
        questId: 'q1',
        amount: 2
      })
      assert.equal(nextState.activeQuests[0].progress, 2)
    })

    await t.test('advances progress with default amount 1', () => {
      const state = { activeQuests: [{ id: 'q1', progress: 0, required: 5 }] }
      const nextState = QuestLifecycle.advanceQuest(state, { questId: 'q1' })
      assert.equal(nextState.activeQuests[0].progress, 1)
    })

    await t.test('advances progress with amount null falling back to 1', () => {
      const state = { activeQuests: [{ id: 'q1', progress: 0, required: 5 }] }
      const nextState = QuestLifecycle.advanceQuest(state, {
        questId: 'q1',
        amount: null
      })
      assert.equal(nextState.activeQuests[0].progress, 1)
    })

    await t.test('does not advance if id does not match', () => {
      const state = { activeQuests: [{ id: 'q2', progress: 0, required: 5 }] }
      const nextState = QuestLifecycle.advanceQuest(state, {
        questId: 'q1',
        amount: 1
      })
      assert.equal(nextState.activeQuests[0].progress, 0)
    })

    await t.test('completes quest when progress reaches required', () => {
      const state = {
        activeQuests: [{ id: 'q1', progress: 3, required: 4, label: 'Q' }],
        toasts: []
      }
      const nextState = QuestLifecycle.advanceQuest(state, {
        questId: 'q1',
        amount: 1
      })
      assert.equal(nextState.activeQuests.length, 0) // Completed and removed
      assert.equal(nextState.toasts.length, 1)
    })
  })

  await t.test('checkDeadlines', async t => {
    await t.test('handles missing activeQuests', () => {
      const state = {}
      const nextState = QuestLifecycle.checkDeadlines(state)
      assert.equal(nextState, state)
    })

    await t.test('fails expired quests and applies penalties', () => {
      const state = {
        player: { day: 10 },
        social: { controversyLevel: 5 },
        band: { harmony: 50 },
        activeQuests: [
          {
            id: 'q1',
            label: 'Failed',
            deadline: 9,
            failurePenalty: {
              social: { controversyLevel: 10 },
              band: { harmony: -20 }
            }
          },
          {
            id: 'q2',
            deadline: 12
          }
        ],
        toasts: []
      }
      const nextState = QuestLifecycle.checkDeadlines(state)
      assert.equal(nextState.activeQuests.length, 1)
      assert.equal(nextState.activeQuests[0].id, 'q2')
      assert.equal(nextState.social.controversyLevel, 15)
      assert.equal(nextState.band.harmony, 30)
      assert.equal(nextState.toasts.length, 1)
      assert.equal(nextState.toasts[0].messageKey, 'ui:toast.quest_failed')
    })

    await t.test('fails expired quests with invalid penalties', () => {
      const state = {
        player: { day: 10 },
        social: { controversyLevel: 5 },
        band: { harmony: 50 },
        activeQuests: [
          {
            id: 'q1',
            deadline: 9,
            failurePenalty: {
              social: 'invalid', // not a record
              band: null // not a record
            }
          },
          {
            id: 'q2',
            deadline: 9,
            failurePenalty: {
              social: { controversyLevel: 'NaN' }
            }
          }
        ]
      }
      const nextState = QuestLifecycle.checkDeadlines(state)
      assert.equal(nextState.activeQuests.length, 0)
      assert.equal(nextState.social.controversyLevel, 5) // no change due to invalid number
      assert.equal(nextState.band.harmony, 50) // no change
      assert.equal(nextState.toasts.length, 2)
    })

    await t.test(
      'handles expired quests missing harmony or controversyLevel penalties explicitly',
      () => {
        const state = {
          player: { day: 10 },
          social: { controversyLevel: 5 },
          band: { harmony: 50 },
          activeQuests: [
            {
              id: 'q1',
              deadline: 9,
              failurePenalty: {
                social: { controversyLevel: null }, // explicit null should be ignored
                band: { harmony: 'NaN' } // invalid number should default to 0
              }
            }
          ]
        }
        const nextState = QuestLifecycle.checkDeadlines(state)
        assert.equal(nextState.activeQuests.length, 0)
        assert.equal(nextState.social.controversyLevel, 5)
        assert.equal(nextState.band.harmony, 50)
      }
    )

    await t.test(
      'skips falsy quests in activeQuests during checkDeadlines',
      () => {
        const state = {
          player: { day: 10 },
          activeQuests: [undefined, { id: 'q1', deadline: 12 }]
        }
        const nextState = QuestLifecycle.checkDeadlines(state)
        assert.equal(nextState, state) // no expired quests, returns original state
      }
    )

    await t.test('applies penalties when previous stats are missing', () => {
      const state = {
        player: { day: 10 },
        social: {}, // Missing controversyLevel
        band: {}, // Missing harmony
        activeQuests: [
          {
            id: 'q1',
            deadline: 9,
            failurePenalty: {
              social: { controversyLevel: 10 },
              band: { harmony: -20 }
            }
          }
        ]
      }
      const nextState = QuestLifecycle.checkDeadlines(state)
      assert.equal(nextState.activeQuests.length, 0)
      assert.equal(nextState.social.controversyLevel, 10)
      assert.equal(nextState.band.harmony, 1) // clampBandHarmony clamps to 1 minimum
    })

    await t.test('handles falsy deadline check in checkDeadlines', () => {
      const state = {
        player: { day: 10 },
        activeQuests: [{ id: 'q1', deadline: undefined }]
      }
      const nextState = QuestLifecycle.checkDeadlines(state)
      assert.equal(nextState, state)
    })

    await t.test('returns original state if no quests are expired', () => {
      const state = {
        player: { day: 5 },
        activeQuests: [{ id: 'q1', deadline: 10 }]
      }
      const nextState = QuestLifecycle.checkDeadlines(state)
      assert.equal(nextState, state)
    })
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

    await t.test('records cooldown entries keyed by quest id', () => {
      const next = QuestLifecycle.checkDeadlines(
        makeExpiredState({ cooldowns: [{ id: 'retry', days: 7 }] })
      )
      const cd = next.questCooldowns.find(c => c.questId === 'q_fail')
      assert.ok(cd)
      assert.equal(cd.expiresOnDay, 17)
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
  })
})
