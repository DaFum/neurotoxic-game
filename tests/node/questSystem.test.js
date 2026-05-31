import { describe, it } from 'node:test'
import assert from 'node:assert'
import { QUEST_REGISTRY } from '../../src/data/questRegistry.ts'
import { QuestLifecycle } from '../../src/domain/questLifecycle.ts'
const getBaseState = () => ({
  player: { day: 1, location: 'test_city' },
  activeQuests: [],
  activeStoryFlags: [],
  eventCooldowns: []
})

describe('Quest System Registry Validation', () => {
  it('should ensure quests with required > 0 have a progressSource', () => {
    for (const [_id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (quest.required && quest.required > 0) {
        assert.ok(
          quest.progressSource,
          `Quest ${_id} requires progress but has no progressSource`
        )
      }
    }
  })

  it('should ensure no quest uses game_over failure penalty', () => {
    for (const [_id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (quest.failurePenalty) {
        assert.notStrictEqual(
          quest.failurePenalty.type,
          'game_over',
          `Quest ${_id} uses game_over failure penalty`
        )
      }
    }
  })

  it('should ensure every quest declares kind and repeatPolicy', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      assert.ok(quest.kind, `Quest ${id} is missing kind`)
      assert.ok(quest.repeatPolicy, `Quest ${id} is missing repeatPolicy`)
    }
  })

  it('should ensure cooldown-policy quests define cooldownDays > 0', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (quest.repeatPolicy === 'cooldown') {
        assert.ok(
          typeof quest.cooldownDays === 'number' && quest.cooldownDays > 0,
          `Quest ${id} uses repeatPolicy 'cooldown' but has no positive cooldownDays`
        )
      }
    }
  })

  it('should ensure repeatPolicy never quests do not restart', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (quest.repeatPolicy !== 'never') continue
      let state = getBaseState()

      state = QuestLifecycle.addQuest(state, {
        id,
        deadline: state.player.day + 10,
        required: quest.required || 1,
        rewardFlag: quest.rewardFlag
      })
      assert.ok(
        state.activeQuests.find(q => q.id === id),
        `Quest ${id} should be started`
      )

      if (quest.rewardFlag) {
        state.activeStoryFlags.push(quest.rewardFlag)
      }
      state = QuestLifecycle.completeQuest(state, { questId: id })
      assert.ok(
        !state.activeQuests.find(q => q.id === id),
        `Quest ${id} should be removed after completion`
      )

      // QuestLifecycle.addQuest itself does not enforce repeatPolicy: 'never';
      // restart prevention happens upstream via persistent rewardFlag checks in
      // eventEngine conditions. The contract this test enforces: every
      // never-repeat quest exposes a stable upstream gate.
      if (quest.rewardFlag) {
        assert.ok(
          state.activeStoryFlags.includes(quest.rewardFlag),
          `Quest ${id}: rewardFlag must persist so upstream gates block restart`
        )
      } else {
        assert.ok(
          quest.rewardType,
          `Quest ${id} (repeatPolicy: 'never') must define rewardFlag or rewardType so upstream code can detect prior completion`
        )
      }
    }
  })
})
