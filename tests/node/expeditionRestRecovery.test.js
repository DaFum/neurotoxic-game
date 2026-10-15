import assert from 'node:assert/strict'
import test from 'node:test'
import { startedState } from '../expeditionLifecycleFixture.js'
import { gameReducer } from '../../src/context/gameReducer.ts'
import { recordExpeditionCrewStressSource } from '../../src/context/expeditionActionCreators.ts'
import { getActiveExpeditionMap } from '../../src/domain/expedition/map.ts'
import { CREW_STRESS_SOURCE_DELTAS } from '../../src/domain/expedition/crewStress.ts'
import { getExpeditionModuleProfile } from '../../src/domain/expedition/modules.ts'

const restingAt = moduleIds => {
  const base = startedState()
  // The commitment itself is covered by the loadout suites; only the
  // committed module list matters to rest resolution.
  const started = {
    ...base,
    expedition: {
      ...base.expedition,
      loadout: {
        ...base.expedition.loadout,
        build: {
          ...base.expedition.loadout.build,
          selectedTourbusModuleIds: moduleIds
        }
      }
    }
  }
  const map = getActiveExpeditionMap(started)
  const restNodeId = Object.keys(map.meta).find(
    id => map.meta[id]?.nodeClass === 'REST_STOP'
  )
  assert.ok(restNodeId, 'fixture map must contain a rest stop')
  const state = {
    ...started,
    expedition: {
      ...started.expedition,
      visitedNodeIds: [...started.expedition.visitedNodeIds, restNodeId],
      crew: {
        ...(started.expedition.crew ?? { injuryByCrewId: {} }),
        stressByCrewId: { mika: 60 }
      }
    }
  }
  const action = recordExpeditionCrewStressSource(
    state,
    'mika',
    'rest',
    `rest:${restNodeId}:${state.expedition.routeStep}`
  )
  return gameReducer(state, action).expedition.crew.stressByCrewId.mika
}

test('committed sleeping bunks add their rest Stress recovery bonus', () => {
  const bonus =
    getExpeditionModuleProfile('tb_sleeping_bunks').restStressRecoveryBonus
  assert.ok(bonus > 0)

  const plain = restingAt([])
  const withBunks = restingAt(['tb_sleeping_bunks'])

  assert.equal(plain, 60 + CREW_STRESS_SOURCE_DELTAS.rest)
  assert.equal(withBunks, plain - bonus)
})
