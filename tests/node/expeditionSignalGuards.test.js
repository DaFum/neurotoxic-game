/**
 * @fileoverview Obligation signals and event deltas are reducer-authored facts.
 *
 * A `finale` signal pays Contracts out early and banks their rewards, and an
 * event delta mints cargo or burns Heat, so neither may be accepted from a
 * caller that merely asserts it.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  handleRecordExpeditionObligationSignal,
  handleApplyExpeditionEventDelta,
  handleAddExpeditionReward
} from '../../src/context/reducers/expeditionReducer'
import {
  startedState,
  walkTo,
  walkToFinale
} from '../expeditionLifecycleFixture.js'

const withGig = (state, stats) => ({
  ...state,
  currentGig: { id: 'gig-proof' },
  lastGigStats: { accuracy: 80, ...stats },
  expedition: {
    ...state.expedition,
    lastGigResolvedAtRouteStep: state.expedition.routeStep
  }
})

describe('finale obligation signal', () => {
  it('is refused away from the Finale node', () => {
    const mid = withGig(walkTo(startedState(), 1), {})
    const next = handleRecordExpeditionObligationSignal(mid, {
      signalType: 'finale',
      sourceId: 'gig-proof',
      expectedRouteStep: mid.expedition.routeStep
    })
    assert.equal(next, mid)
  })

  it('is refused after a failed Finale gig', () => {
    const finale = withGig(walkToFinale(startedState()), { failed: true })
    const next = handleRecordExpeditionObligationSignal(finale, {
      signalType: 'finale',
      sourceId: 'gig-proof',
      expectedRouteStep: finale.expedition.routeStep
    })
    assert.equal(next, finale)
  })

  it('is accepted on the Finale node after a passed gig', () => {
    const finale = withGig(walkToFinale(startedState()), { failed: false })
    const next = handleRecordExpeditionObligationSignal(finale, {
      signalType: 'finale',
      sourceId: 'gig-proof',
      expectedRouteStep: finale.expedition.routeStep
    })
    assert.notEqual(next, finale)
  })
})

describe('expedition event delta', () => {
  it('cannot be replayed while the event is still on state', () => {
    const eventId = 'expedition_underground_invite'
    const started = {
      ...startedState({ money: 5000 }),
      activeEvent: { id: eventId }
    }
    const payload = {
      resultIds: ['spare_parts_scavenged'],
      expectedRouteStep: started.expedition.routeStep,
      sourceEventId: eventId,
      sourceOptionId: 'take_the_address'
    }
    const once = handleApplyExpeditionEventDelta(started, payload)
    assert.notEqual(once, started)

    const twice = handleApplyExpeditionEventDelta(once, payload)
    assert.equal(twice, once, 'the same resolution applied its deltas twice')
  })
})

describe('generic reward dispatch', () => {
  it('refuses crew_contact and event_rare on save-authored proof', () => {
    const run = startedState({ money: 5000 })
    const forged = {
      ...run,
      expedition: {
        ...run.expedition,
        resolvedCrewSourceIds: [
          'expedition_crew_breakthrough:follow_lead:forged'
        ],
        resolvedEventSourceIds: [
          `expedition_underground_invite:take_the_address:spare_parts_scavenged:${run.expedition.routeStep}`
        ]
      }
    }
    const contact = handleAddExpeditionReward(forged, {
      expectedRewardId: 'reward_contact_backline_deal',
      sourceType: 'crew_contact',
      sourceId: 'expedition_crew_breakthrough:follow_lead',
      expectedRouteStep: forged.expedition.routeStep
    })
    assert.equal(contact, forged)

    const rare = handleAddExpeditionReward(forged, {
      expectedRewardId: 'reward_event_spare_cables',
      sourceType: 'event_rare',
      sourceId:
        'expedition_underground_invite:take_the_address:spare_parts_scavenged',
      expectedRouteStep: forged.expedition.routeStep
    })
    assert.equal(rare, forged)
  })
})
