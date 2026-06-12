// Phase-4 Task 5: registry shape validation per the original plan.
// Keep these registry-only contracts here so future quest additions have a
// single owner for static shape checks.
import { test } from 'vitest'
import assert from 'node:assert/strict'
import {
  QUEST_REGISTRY,
  getQuestDefinition
} from '../../src/data/questRegistry'
import * as questsConstants from '../../src/data/questsConstants'

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

test('quest lookups only return own registry definitions', () => {
  assert.equal(getQuestDefinition('__proto__'), undefined)
  assert.equal(getQuestDefinition('constructor'), undefined)
  assert.equal(getQuestDefinition('toString'), undefined)
})

test('every quest id in registry has a corresponding exported constant', () => {
  const exportedValues = Object.values(questsConstants)
  for (const id of Object.keys(QUEST_REGISTRY)) {
    assert.ok(
      exportedValues.includes(id),
      `Quest ID "${id}" from QUEST_REGISTRY is missing an exported constant in src/data/questsConstants.ts`
    )
  }
})
