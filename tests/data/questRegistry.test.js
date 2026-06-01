// Phase-4 Task 5: registry shape validation per the original plan.
// The same invariants run in tests/node/questSystem.test.js with extended
// content gates; this file keeps the plan's exact location/name as an
// explicit registry-only contract for future quest additions.
import { test } from 'vitest'
import assert from 'node:assert/strict'
import { QUEST_REGISTRY } from '../../src/data/questRegistry'

test('every quest with required > 0 has a progressSource', () => {
  for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
    if (typeof quest.required === 'number' && quest.required > 0) {
      assert.ok(
        quest.progressSource,
        `Quest ${id} has required > 0 but no progressSource — it can never progress`
      )
    }
  }
})

test('every quest with required > 0 has progressRules', () => {
  for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
    if (typeof quest.required === 'number' && quest.required > 0) {
      assert.ok(
        Array.isArray(quest.progressRules) && quest.progressRules.length > 0,
        `Quest ${id} has required > 0 but no progressRules — it can never progress through the declarative matcher`
      )
    }
  }
})

test('no quest declares failurePenalty.type === "game_over"', () => {
  for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
    if (!quest.failurePenalty) continue
    assert.notStrictEqual(
      quest.failurePenalty.type,
      'game_over',
      `Quest ${id} declares a game_over failure penalty — failures must stay non-lethal`
    )
  }
})

test('every quest declares kind and repeatPolicy', () => {
  for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
    assert.ok(quest.kind, `Quest ${id} is missing kind`)
    assert.ok(quest.repeatPolicy, `Quest ${id} is missing repeatPolicy`)
  }
})

test('repeatPolicy "cooldown" quests define cooldownDays > 0', () => {
  for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
    if (quest.repeatPolicy !== 'cooldown') continue
    assert.ok(
      typeof quest.cooldownDays === 'number' && quest.cooldownDays > 0,
      `Quest ${id} uses repeatPolicy 'cooldown' but cooldownDays is missing or non-positive`
    )
  }
})
