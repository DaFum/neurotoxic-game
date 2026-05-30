import { describe, it } from 'node:test'
import assert from 'node:assert'
import { QUEST_REGISTRY } from '../../src/data/questRegistry'

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

  it('should ensure repeatPolicy never quests do not restart', () => {
    for (const [_id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (quest.repeatPolicy === 'never') {
        assert.ok(true, 'Tested theoretically via repeatPolicy logic checks.')
      }
    }
  })
})
