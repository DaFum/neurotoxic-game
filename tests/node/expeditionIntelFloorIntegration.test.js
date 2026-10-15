import assert from 'node:assert/strict'
import test from 'node:test'
import { startedState } from '../expeditionLifecycleFixture.js'
import {
  getExpeditionIntelCapability,
  getExpeditionNodeIntelLevel
} from '../../src/domain/expedition/nodeIntel.ts'
import { getActiveExpeditionMap } from '../../src/domain/expedition/map.ts'

const withDrafts = (state, runDraftTraitIds) => ({
  ...state,
  expedition: { ...state.expedition, runDraftTraitIds }
})

test('Backchannel raises unscouted nodes to the composed intel floor', () => {
  const base = startedState()
  const map = getActiveExpeditionMap(base)
  const nodeId = map.nodeOrder.find(
    id => !Object.hasOwn(base.expedition.intelByNodeId, id)
  )
  assert.ok(nodeId, 'fixture must have an unscouted node')

  assert.equal(getExpeditionIntelCapability(base).passiveLevelFloor, 0)
  assert.equal(getExpeditionNodeIntelLevel(base, nodeId), 0)

  const drafted = withDrafts(base, ['backchannel'])
  assert.equal(getExpeditionIntelCapability(drafted).passiveLevelFloor, 1)
  assert.equal(getExpeditionNodeIntelLevel(drafted, nodeId), 1)
})
