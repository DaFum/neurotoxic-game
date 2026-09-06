/**
 * @fileoverview Hidden defects fire at the real lifecycle boundaries.
 *
 * A low-quality field or improvised repair plants a defect with trigger
 * metadata — `post_travel`, `pre_gig` or `post_gig`. Without a production
 * caller at each of those boundaries the metadata is decoration: the defect
 * stays hidden forever and never applies its damage, which would make the
 * repair tradeoff free. These suites drive the canonical travel, gig-start and
 * post-gig reducers and prove the defect resolves there.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { DEFECT_SEVERITY_DAMAGE } from '../../src/domain/expedition/defects'
import { getExpeditionTechnicalCondition } from '../../src/domain/expedition/condition'
import {
  fixtureMap,
  startedState,
  walkTo
} from '../expeditionLifecycleFixture.js'

const map = fixtureMap()

const firstHop = () => {
  const to = map.connections.find(edge => edge.from === map.startNodeId)?.to
  assert.ok(to, 'the fixture route has no first hop')
  return to
}

/**
 * A started run carrying one hidden defect set to fire at `trigger`.
 */
const withHiddenDefect = (state, trigger, triggerRouteStep) => ({
  ...state,
  expedition: {
    ...state.expedition,
    technicalCondition: {
      pa: 100,
      instruments: 100,
      stageGear: 100,
      defects: [
        {
          id: `defect_pa_field_repair_step_0`,
          group: 'pa',
          severity: 2,
          status: 'hidden',
          source: 'field_repair',
          createdAtRouteStep: 0,
          triggerAt: trigger,
          triggerRouteStep
        }
      ]
    }
  }
})

const onlyDefect = state => getExpeditionTechnicalCondition(state).defects[0]

const DAMAGE = DEFECT_SEVERITY_DAMAGE[2]

describe('post_travel', () => {
  const travelTo = (state, nodeId) => {
    const traveling = gameReducer(state, {
      type: ActionTypes.START_TRAVEL_MINIGAME,
      payload: { targetNodeId: nodeId }
    })
    return gameReducer(traveling, {
      type: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
      payload: { damageTaken: 0, itemsCollected: [] }
    })
  }

  it('triggers on arrival, after the route advance', () => {
    const state = withHiddenDefect(
      startedState({ money: 5000, fuel: 100 }),
      'post_travel',
      1
    )
    const arrived = travelTo(state, firstHop())
    assert.equal(arrived.expedition.routeStep, 1)
    assert.equal(onlyDefect(arrived).status, 'triggered')
    assert.equal(getExpeditionTechnicalCondition(arrived).pa, 100 - DAMAGE)
  })

  it('leaves a defect whose route step is still ahead alone', () => {
    const state = withHiddenDefect(
      startedState({ money: 5000, fuel: 100 }),
      'post_travel',
      4
    )
    const arrived = travelTo(state, firstHop())
    assert.equal(onlyDefect(arrived).status, 'hidden')
    assert.equal(getExpeditionTechnicalCondition(arrived).pa, 100)
  })

  it('ignores a defect set to fire at another boundary', () => {
    const state = withHiddenDefect(
      startedState({ money: 5000, fuel: 100 }),
      'post_gig',
      1
    )
    const arrived = travelTo(state, firstHop())
    assert.equal(onlyDefect(arrived).status, 'hidden')
  })
})

describe('pre_gig', () => {
  const startGig = state =>
    gameReducer(state, {
      type: ActionTypes.START_GIG,
      payload: { id: 'venue_fixture', name: 'Fixture Hall' }
    })

  it('triggers as the PreGig screen opens', () => {
    const state = withHiddenDefect(
      walkTo(startedState({ money: 5000, fuel: 100 }), 1),
      'pre_gig',
      1
    )
    const preGig = startGig(state)
    assert.equal(onlyDefect(preGig).status, 'triggered')
    assert.equal(getExpeditionTechnicalCondition(preGig).pa, 100 - DAMAGE)
    // The gig itself still starts normally.
    assert.equal(preGig.currentGig?.id, 'venue_fixture')
  })

  it('leaves the run untouched outside an active Expedition', () => {
    const run = withHiddenDefect(
      walkTo(startedState({ money: 5000, fuel: 100 }), 1),
      'pre_gig',
      1
    )
    const idle = {
      ...run,
      expedition: { ...run.expedition, status: 'idle' }
    }
    const preGig = startGig(idle)
    assert.equal(
      preGig.expedition.technicalCondition.defects[0].status,
      'hidden'
    )
  })
})

describe('post_gig', () => {
  const finishGig = state =>
    gameReducer(state, {
      type: ActionTypes.SET_LAST_GIG_STATS,
      payload: { score: 7100, accuracy: 80, misses: 2, failed: false }
    })

  it('triggers after the gig has settled its own wear', () => {
    const state = withHiddenDefect(
      walkTo(startedState({ money: 5000, fuel: 100 }), 1),
      'post_gig',
      1
    )
    const before = getExpeditionTechnicalCondition(state).pa
    const done = finishGig(state)
    assert.equal(onlyDefect(done).status, 'triggered')
    // The gig's own wear lands first, so the drop is strictly larger than the
    // defect's damage alone.
    assert.ok(getExpeditionTechnicalCondition(done).pa < before - DAMAGE)
  })

  it('ignores a pre_gig defect at the post-gig boundary', () => {
    const state = withHiddenDefect(
      walkTo(startedState({ money: 5000, fuel: 100 }), 1),
      'pre_gig',
      1
    )
    assert.equal(onlyDefect(finishGig(state)).status, 'hidden')
  })
})
