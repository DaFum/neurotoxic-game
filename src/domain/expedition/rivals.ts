import { generateRivalBand } from '../../utils/rivalEngine'
import { getExpeditionRoutePressureProfile } from './routeProfile'
import { mulberry32 } from '../../utils/seededRng'
import { hash31 } from '../../utils/stringUtils'
import type { GameState, RivalBandState } from '../../types'
import type { CareerRivalRecord } from '../../types/career'
import { isExpeditionCapabilityUnlocked } from '../../data/expedition/unlockSets'
import type {
  ExpeditionMap,
  ExpeditionRouteProfile
} from '../../types/expedition'

export interface ExpeditionRivalSelection {
  rivalBand: RivalBandState
  record: CareerRivalRecord
  isNew: boolean
}
export const rehydrateRivalBand = (
  record: CareerRivalRecord
): RivalBandState => ({
  id: record.snapshot.id,
  name: record.snapshot.name,
  alignment: 'NEUTRAL',
  powerLevel: Math.max(1, record.history.nemesisLevel + 1),
  currentLocationId: null,
  style: record.snapshot.style,
  signatureBehavior: record.snapshot.signatureBehavior
})
export const selectExpeditionRivalForRun = (
  state: GameState,
  preparedMap: ExpeditionMap,
  routeProfile: ExpeditionRouteProfile
): ExpeditionRivalSelection | null => {
  // The route decides. Rival encounters are a weighted category now, so a run
  // gets a Rival because its route actually offers one - which is how the
  // Region/Tour Rival weight reaches this consumer at all.
  const routeOffersRival = preparedMap.nodeOrder.some(
    nodeId => preparedMap.meta[nodeId]?.specialSubtype === 'RIVAL_ENCOUNTER'
  )
  // A Tour that hunts the Rival guarantees the encounter, and so does a feud
  // the Career has driven to the top tier. `routeProfile` carries the
  // committed Region and Tour; the live profile is read only for the Nemesis
  // case, because at START the loadout is not committed yet and reading the
  // Tour off it resolved the baseline with `forcedRival` always false.
  const route = getExpeditionRoutePressureProfile(state)
  if (!routeOffersRival && !routeProfile.forcedRival && !route.forcedRival) {
    return null
  }
  // Continuing a feud is what `rival_network` sells. Without it every run draws
  // a fresh Rival, so the Nemesis ladder - and every rule change hanging off
  // it - is only reachable once the Career has bought the continuation.
  const canContinueFeud = isExpeditionCapabilityUnlocked(
    state.career?.unlockedSetIds,
    'rival_quest_continuation'
  )
  // ⚡ BOLT OPTIMIZATION: Replaced Object.values(), .filter(), and .sort() with a single-pass for...in loop.
  // Why: Avoids allocating intermediate arrays for Object.values() and .filter(), as well as O(N log N) sort overhead and closure allocations when selecting the top rival record.
  // Impact: O(N) single-pass lookup with zero intermediate array/closure allocations.
  let existing: CareerRivalRecord | undefined = undefined
  if (canContinueFeud && state.career?.rivalsById) {
    const rivalsById = state.career.rivalsById
    const regionId = preparedMap.regionId
    for (const id in rivalsById) {
      if (!Object.hasOwn(rivalsById, id)) continue
      const record = rivalsById[id]
      if (!record) continue
      const prefRegion = record.snapshot?.preferredRegionId
      if (prefRegion && prefRegion !== regionId) continue

      if (!existing) {
        existing = record
      } else {
        const nemDiff =
          record.history.nemesisLevel - existing.history.nemesisLevel
        if (nemDiff > 0) {
          existing = record
        } else if (nemDiff === 0) {
          const encDiff =
            record.history.encounterCount - existing.history.encounterCount
          if (encDiff > 0) {
            existing = record
          } else if (encDiff === 0) {
            if (record.snapshot.id.localeCompare(existing.snapshot.id) < 0) {
              existing = record
            }
          }
        }
      }
    }
  }
  if (existing)
    return {
      rivalBand: rehydrateRivalBand(existing),
      record: existing,
      isNew: false
    }
  const rivalBand = generateRivalBand(
    state.player.day,
    mulberry32(hash31(`${state.runSeed}:expedition-rival`))
  )
  const behavior =
    (['aggressive', 'showboat', 'saboteur', 'dealbreaker'] as const)[
      Math.abs(hash31(rivalBand.id)) % 4
    ] ?? 'aggressive'
  const record: CareerRivalRecord = {
    snapshot: {
      id: rivalBand.id,
      name: rivalBand.name,
      style: String(rivalBand.alignment),
      preferredRegionId: preparedMap.regionId,
      signatureBehavior: behavior,
      seed: state.runSeed
    },
    history: {
      relationship: 'competitive',
      nemesisLevel: 0,
      encounterCount: 0,
      lastOutcome: null,
      lastSeenRunId: state.expedition.runId,
      lastNemesisAdvanceRunId: null
    }
  }
  return { rivalBand, record, isNew: true }
}
