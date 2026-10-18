/**
 * @fileoverview The map the player travels is the effective route.
 *
 * Overlay edges (Underground invite, Rival shortcut, Legendaries) exist only on
 * the effective route; `state.gameMap` keeps the base edges. The Overworld has
 * to travel and draw the effective map, or the offered opportunity can never
 * be taken.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deriveExpeditionNemesisKeyTarget } from '../../src/domain/expedition/legendaries.ts'
import {
  getExpeditionOverlaySubtypeByNodeId,
  getExpeditionTravelMap
} from '../../src/domain/expedition/routeOverlay.ts'
import { isConnected } from '../../src/utils/mapUtils.ts'
import { fixtureMap, startedState } from '../expeditionLifecycleFixture.js'

const owningKey = () => {
  const base = startedState({ money: 5000 })
  return {
    ...base,
    career: { ...base.career, legendaryIds: ['nemesis_key'] }
  }
}

test('travel map carries an overlay edge the base map lacks', () => {
  const owned = owningKey()
  const target = deriveExpeditionNemesisKeyTarget(owned, fixtureMap())
  assert.ok(target)
  const from = owned.expedition.visitedNodeIds.at(-1)
  assert.equal(
    isConnected(owned.gameMap, from, target),
    false,
    'the base map must not already reach the Nemesis Key target'
  )

  const travelMap = getExpeditionTravelMap(owned)
  assert.equal(isConnected(travelMap, from, target), true)
  assert.strictEqual(getExpeditionTravelMap(owned), travelMap)
})

test('travel map is the plain map when no overlay applies', () => {
  const started = startedState({ money: 5000 })
  assert.strictEqual(getExpeditionTravelMap(started), started.gameMap)
})

test('overlay subtypes are exposed render-only and leave node types alone', () => {
  const owned = owningKey()
  const target = deriveExpeditionNemesisKeyTarget(owned, fixtureMap())
  const subtypes = getExpeditionOverlaySubtypeByNodeId(owned)
  assert.equal(subtypes[target], 'RIVAL_ENCOUNTER')
  assert.strictEqual(getExpeditionOverlaySubtypeByNodeId(owned), subtypes)

  // Travel must still see the base node type, never the advertised subtype.
  const travelMap = getExpeditionTravelMap(owned)
  assert.equal(travelMap.nodes[target].type, owned.gameMap.nodes[target].type)
  assert.strictEqual(travelMap.nodes, owned.gameMap.nodes)
})

test('no overlay subtypes outside a run or without an overlay', () => {
  const started = startedState({ money: 5000 })
  assert.equal(getExpeditionOverlaySubtypeByNodeId(started), null)
  assert.equal(
    getExpeditionOverlaySubtypeByNodeId({
      ...started,
      expedition: { ...started.expedition, status: 'idle' }
    }),
    null
  )
})
