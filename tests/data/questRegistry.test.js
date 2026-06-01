// Phase-4 Task 5: registry shape validation per the original plan.
// The same invariants run in tests/node/questSystem.test.js with extended
// content gates; this file keeps the plan's exact location/name as an
// explicit registry-only contract for future quest additions.
import test from 'node:test'
import assert from 'node:assert/strict'
import { QUEST_REGISTRY } from '../../src/data/questRegistry.ts'

test('questRegistry shape contract', async t => {
  await t.test('every quest with required > 0 has a progressSource', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (typeof quest.required === 'number' && quest.required > 0) {
        assert.ok(
          quest.progressSource,
          `Quest ${id} has required > 0 but no progressSource — it can never progress`
        )
      }
    }
  })

  await t.test('no quest declares failurePenalty.type === "game_over"', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (!quest.failurePenalty) continue
      assert.notStrictEqual(
        quest.failurePenalty.type,
        'game_over',
        `Quest ${id} declares a game_over failure penalty — failures must stay non-lethal`
      )
    }
  })

  await t.test('every quest declares kind and repeatPolicy', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      assert.ok(quest.kind, `Quest ${id} is missing kind`)
      assert.ok(quest.repeatPolicy, `Quest ${id} is missing repeatPolicy`)
    }
  })

  await t.test('repeatPolicy "cooldown" quests define cooldownDays > 0', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (quest.repeatPolicy !== 'cooldown') continue
      assert.ok(
        typeof quest.cooldownDays === 'number' && quest.cooldownDays > 0,
        `Quest ${id} uses repeatPolicy 'cooldown' but cooldownDays is missing or non-positive`
      )
    }
  })
})
