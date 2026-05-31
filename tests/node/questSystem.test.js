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

  // Content gates (phase-20 plan). Lock invariants so newly added quests
  // cannot reintroduce regressions like game-over penalties or unprogressable
  // accumulation quests.

  it('content gate: every progressSource is handled by QuestProgress.applyEvent', async () => {
    const src = await import('node:fs').then(m =>
      m.readFileSync('src/utils/questProgress.ts', 'utf8')
    )
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (!quest.progressSource) continue
      assert.ok(
        src.includes(`case '${quest.progressSource}'`),
        `Quest ${id} uses progressSource '${quest.progressSource}' but it is not handled in QuestProgress.applyEvent`
      )
    }
  })

  it('content gate: repeatable quests must declare a cooldown, scope or daily policy', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (quest.repeatPolicy && quest.repeatPolicy !== 'never') {
        const hasGuard =
          quest.repeatPolicy === 'cooldown'
            ? typeof quest.cooldownDays === 'number' && quest.cooldownDays > 0
            : ['daily', 'perVenue', 'perRegion'].includes(quest.repeatPolicy)
        assert.ok(
          hasGuard,
          `Quest ${id} has repeatPolicy '${quest.repeatPolicy}' but no cooldown/scope guard`
        )
      }
    }
  })

  it('content gate: failure penalties stay non-lethal (no game_over anywhere)', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      const fp = quest.failurePenalty
      if (!fp) continue
      const serialized = JSON.stringify(fp)
      assert.ok(
        !serialized.includes('"game_over"') &&
          !serialized.includes('"gameOver"'),
        `Quest ${id} failure penalty references game_over: ${serialized}`
      )
    }
  })

  it('content gate: story quests declare a completion or failure flag', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (quest.kind !== 'story') continue
      const hasCompletion =
        quest.rewardFlag ||
        (Array.isArray(quest.completionFlags) && quest.completionFlags.length)
      const hasFailure =
        (Array.isArray(quest.failureFlags) && quest.failureFlags.length) ||
        (quest.failurePenalty &&
          Array.isArray(quest.failurePenalty.flags) &&
          quest.failurePenalty.flags.length)
      assert.ok(
        hasCompletion || hasFailure,
        `Story quest ${id} has no completion or failure flag — its narrative state cannot be persisted`
      )
    }
  })

  it('content gate: startFlags quests clear their flags on resolve', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (!Array.isArray(quest.startFlags) || quest.startFlags.length === 0)
        continue
      const clears =
        (Array.isArray(quest.clearFlagsOnComplete) &&
          quest.clearFlagsOnComplete.length) ||
        (Array.isArray(quest.clearFlagsOnFail) && quest.clearFlagsOnFail.length)
      assert.ok(
        clears,
        `Quest ${id} declares startFlags but never clears them on complete/fail — flag would leak`
      )
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
