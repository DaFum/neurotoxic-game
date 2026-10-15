import assert from 'node:assert/strict'
import test from 'node:test'
import { startedState, walkTo } from '../expeditionLifecycleFixture.js'
import { sanitizeExpeditionState } from '../../src/context/reducers/expeditionSanitizers.ts'
import { deriveExpeditionDraftCandidates } from '../../src/domain/expedition/runDrafts.ts'

const reloadExpedition = state =>
  sanitizeExpeditionState(
    JSON.parse(JSON.stringify(state.expedition)),
    state.runSeed,
    state.lastGigStats
  )

const withOffer = (state, offer) => ({
  ...state,
  expedition: { ...state.expedition, pendingRunDraftOffer: offer }
})

const canonicalOffer = (state, overrides = {}) => {
  const sourceType = overrides.sourceType ?? 'supply'
  const sourceKey = overrides.sourceKey ?? 'node_supply'
  const offeredAtRouteStep =
    overrides.offeredAtRouteStep ?? state.expedition.routeStep
  return {
    sourceType,
    sourceKey,
    offeredAtRouteStep,
    candidateTraitIds: deriveExpeditionDraftCandidates(
      state.runSeed,
      `${sourceType}:${sourceKey}:${offeredAtRouteStep}`,
      state.expedition.runDraftTraitIds
    ),
    ...overrides
  }
}

test('an unresolved Run Draft offer survives a save and load', () => {
  const walked = walkTo(startedState(), 2)
  const offer = canonicalOffer(walked)
  assert.equal(offer.candidateTraitIds.length, 3)

  const reloaded = reloadExpedition(withOffer(walked, offer))
  assert.deepEqual(reloaded.pendingRunDraftOffer, offer)
})

test('a forged, stale or spent Run Draft offer is dropped on load', () => {
  const walked = walkTo(startedState(), 2)
  const step = walked.expedition.routeStep
  const cases = {
    'forged candidates': canonicalOffer(walked, {
      candidateTraitIds: ['backchannel', 'cold_trail', 'reckless_encore']
    }),
    'offered at another route step': canonicalOffer(walked, {
      offeredAtRouteStep: step + 1
    }),
    'unknown source type': canonicalOffer(walked, { sourceType: 'lottery' }),
    'empty source key': canonicalOffer(walked, { sourceKey: '' }),
    'not an object': 'offer'
  }
  for (const [label, offer] of Object.entries(cases)) {
    assert.equal(
      reloadExpedition(withOffer(walked, offer)).pendingRunDraftOffer,
      null,
      label
    )
  }

  const offer = canonicalOffer(walked)
  const spent = {
    ...withOffer(walked, offer),
    expedition: {
      ...withOffer(walked, offer).expedition,
      consumedRunDraftSourceKeys: [
        `${offer.sourceType}:${offer.sourceKey}:${offer.offeredAtRouteStep}`
      ]
    }
  }
  assert.equal(reloadExpedition(spent).pendingRunDraftOffer, null, 'spent')

  const full = {
    ...withOffer(walked, offer),
    expedition: {
      ...withOffer(walked, offer).expedition,
      runDraftTraitIds: ['road_warrior', 'field_engineer']
    }
  }
  assert.equal(reloadExpedition(full).pendingRunDraftOffer, null, 'full draft')
})
