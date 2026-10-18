import assert from 'node:assert/strict'
import test from 'node:test'

import { gameReducer } from '../../src/context/gameReducer.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import { handleResolveExpeditionSocialResult } from '../../src/context/reducers/expeditionReducer.ts'
import { migrateLegacyQuestSchema } from '../../src/domain/questLegacyMigration.ts'
import { getRegionKeyForLocation } from '../../src/utils/mapUtils.ts'
import { preparedState, fixtureLoadout } from '../expeditionLifecycleFixture.js'

const resolveWithQuest = scopeKey => {
  const prepared = preparedState()
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: prepared.expedition.prep.prepId,
      expectedRunSeed: prepared.runSeed,
      loadout: fixtureLoadout()
    }
  })
  const state = {
    ...started,
    lastGigStats: { score: 1000, accuracy: 80, failed: false },
    social: { ...started.social, pendingSocialOptionId: 'perf_moshpit_chaos' },
    expedition: {
      ...started.expedition,
      pendingSocialSettlement: { routeStep: 0, gigId: null }
    },
    activeQuests: [
      migrateLegacyQuestSchema({
        id: 'quest_local_legend',
        scopeKey,
        progress: 0,
        required: 100000,
        repeatPolicy: 'perRegion'
      })
    ],
    completedQuestIds: [],
    questCooldowns: []
  }
  const next = handleResolveExpeditionSocialResult(state, {
    resultId: 'push',
    postOptionId: 'perf_moshpit_chaos',
    expectedRouteStep: 0
  })
  return { state, next }
}

const progress = s =>
  s.activeQuests.find(q => q.id === 'quest_local_legend')?.progress ?? 0

test('expedition social fame feeds the regional fame quest of the current region', () => {
  const region = getRegionKeyForLocation(preparedState().player.location)
  assert.ok(region, 'fixture location resolves to a region')

  const { state, next } = resolveWithQuest(region)
  const fameGain = next.player.fame - state.player.fame
  assert.ok(fameGain > 0, 'fixture social result must grant fame')
  assert.equal(progress(next), fameGain)

  const other = resolveWithQuest('some_other_region')
  assert.equal(progress(other.next), 0)
})
