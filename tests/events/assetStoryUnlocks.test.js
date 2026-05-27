import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { ALL_RAW_EVENTS } from '../../src/data/events/index'
import { MODULE_REGISTRY } from '../../src/utils/assetModuleRegistry.ts'

const collectEffectFlags = effect => {
  if (!effect || typeof effect !== 'object') return []
  if (effect.type === 'flag' && typeof effect.flag === 'string') {
    return [effect.flag]
  }
  if (effect.type === 'composite' && Array.isArray(effect.effects)) {
    return effect.effects.flatMap(collectEffectFlags)
  }
  return []
}

const eventAddsFlag = (event, flag) => {
  return (event.options ?? []).some(option =>
    collectEffectFlags(option.effect).includes(flag)
  )
}

describe('asset story unlock reachability', () => {
  test('every asset story-flag unlock has at least one event producer', () => {
    const producedFlags = new Set()
    for (const event of ALL_RAW_EVENTS) {
      for (const option of event.options ?? []) {
        for (const flag of collectEffectFlags(option.effect)) {
          producedFlags.add(flag)
        }
      }
    }

    for (const module of Object.values(MODULE_REGISTRY)) {
      for (const flag of module.unlock.requiredStoryFlags ?? []) {
        assert.equal(
          producedFlags.has(flag),
          true,
          `${module.id} requires story flag "${flag}" with no event producer`
        )
      }
    }
  })

  test('asset story unlock events stop reappearing after their flag is set', () => {
    const expectedEventByFlag = {
      found_record_collection: 'asset_story_found_record_collection',
      underground_show: 'asset_story_underground_show',
      old_basement_secret: 'asset_story_old_basement_secret',
      saved_local_venue: 'asset_story_saved_local_venue',
      tape_culture_revival: 'asset_story_tape_culture_revival'
    }

    for (const [flag, eventId] of Object.entries(expectedEventByFlag)) {
      const event = ALL_RAW_EVENTS.find(candidate => candidate.id === eventId)
      assert.ok(event, `missing asset story event ${eventId}`)
      assert.equal(eventAddsFlag(event, flag), true)
      assert.equal(event.condition({ activeStoryFlags: [] }), true)
      assert.equal(event.condition({ activeStoryFlags: [flag] }), false)
    }
  })
})
