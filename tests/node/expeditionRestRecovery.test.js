import assert from 'node:assert/strict'
import test from 'node:test'
import { startedState } from '../expeditionLifecycleFixture.js'
import { gameReducer } from '../../src/context/gameReducer.ts'
import { recordExpeditionCrewStressSource } from '../../src/context/expeditionActionCreators.ts'
import { getActiveExpeditionMap } from '../../src/domain/expedition/map.ts'
import {
  CREW_STRESS_SOURCE_DELTAS,
  EXPEDITION_SUPPLY_REST_STRESS_BONUS
} from '../../src/domain/expedition/crewStress.ts'
import { getExpeditionCargoView } from '../../src/domain/expedition/cargo.ts'
import { sanitizeExpeditionState } from '../../src/context/reducers/expeditionSanitizers.ts'
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

// A rest stop reached along a real route, so the visit survives the load
// sanitizer's path validation as well as the reducer's canonical-source check.
const restVisitWithSupplies = supplies => {
  const started = startedState({}, { cargo: { spareParts: 0, supplies } })
  const map = getActiveExpeditionMap(started)
  const startNodeId = started.expedition.visitedNodeIds.at(-1)
  const previous = new Map([[startNodeId, null]])
  const queue = [startNodeId]
  while (queue.length > 0) {
    const nodeId = queue.shift()
    for (const { from, to } of map.connections) {
      if (from !== nodeId || previous.has(to)) continue
      previous.set(to, nodeId)
      queue.push(to)
    }
  }
  const restNodeId = [...previous.keys()].find(
    id => map.meta[id]?.nodeClass === 'REST_STOP'
  )
  assert.ok(restNodeId, 'fixture map must reach a rest stop')
  const path = []
  for (let id = restNodeId; id; id = previous.get(id)) path.unshift(id)
  const routeStep = path.length - 1
  return {
    sourceId: `rest:${restNodeId}:${routeStep}`,
    state: {
      ...started,
      expedition: {
        ...started.expedition,
        visitedNodeIds: path,
        routeStep,
        crew: {
          ...(started.expedition.crew ?? { injuryByCrewId: {} }),
          stressByCrewId: { mika: 60, tom: 60 }
        }
      }
    }
  }
}

const rest = (state, crewId, sourceId) =>
  gameReducer(
    state,
    recordExpeditionCrewStressSource(state, crewId, 'rest', sourceId)
  )

test('a rest with a packed supply spends one and deepens the recovery', () => {
  const { state, sourceId } = restVisitWithSupplies(3)
  const after = rest(state, 'mika', sourceId)

  assert.equal(
    after.expedition.crew.stressByCrewId.mika,
    60 + CREW_STRESS_SOURCE_DELTAS.rest - EXPEDITION_SUPPLY_REST_STRESS_BONUS
  )
  assert.equal(after.expedition.cargo.supplies, 2)
  assert.equal(getExpeditionCargoView(after).supplies, 2)
})

test('every crew member resting at one visit shares a single supply', () => {
  const { state, sourceId } = restVisitWithSupplies(3)
  const after = rest(rest(state, 'mika', sourceId), 'tom', sourceId)

  const deepened =
    60 + CREW_STRESS_SOURCE_DELTAS.rest - EXPEDITION_SUPPLY_REST_STRESS_BONUS
  assert.equal(after.expedition.crew.stressByCrewId.mika, deepened)
  assert.equal(after.expedition.crew.stressByCrewId.tom, deepened)
  assert.equal(after.expedition.cargo.supplies, 2)
})

test('replaying a rest source spends no further supply', () => {
  const { state, sourceId } = restVisitWithSupplies(3)
  const once = rest(state, 'mika', sourceId)
  const replayed = rest(once, 'mika', sourceId)

  assert.equal(replayed, once)
  assert.equal(replayed.expedition.cargo.supplies, 2)
})

test('a rest without supplies recovers exactly as before', () => {
  const { state, sourceId } = restVisitWithSupplies(0)
  const after = rest(rest(state, 'mika', sourceId), 'tom', sourceId)

  assert.equal(
    after.expedition.crew.stressByCrewId.mika,
    60 + CREW_STRESS_SOURCE_DELTAS.rest
  )
  assert.equal(
    after.expedition.crew.stressByCrewId.tom,
    60 + CREW_STRESS_SOURCE_DELTAS.rest
  )
  assert.equal(after.expedition.cargo.supplies, 0)
  assert.ok(
    !after.expedition.resolvedCrewSourceIds.includes(`${sourceId}:supply`)
  )
})

test('the spent-supply marker survives load, so the visit is not charged twice', () => {
  const { state, sourceId } = restVisitWithSupplies(3)
  const spent = rest(state, 'mika', sourceId)
  const reloaded = {
    ...spent,
    expedition: sanitizeExpeditionState(
      JSON.parse(JSON.stringify(spent.expedition)),
      spent.runSeed,
      spent.lastGigStats
    )
  }
  assert.ok(
    reloaded.expedition.resolvedCrewSourceIds.includes(`${sourceId}:supply`)
  )
  assert.equal(reloaded.expedition.routeStep, spent.expedition.routeStep)

  const after = rest(reloaded, 'tom', sourceId)

  assert.equal(
    after.expedition.crew.stressByCrewId.tom,
    60 + CREW_STRESS_SOURCE_DELTAS.rest - EXPEDITION_SUPPLY_REST_STRESS_BONUS
  )
  assert.equal(after.expedition.cargo.supplies, 2)
})
