import { generateRivalBand } from '../../utils/rivalEngine'
import { getExpeditionRoutePressureProfile } from './routeProfile'
import { mulberry32 } from '../../utils/seededRng'
import { hashString } from '../../utils/stringUtils'
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
  const existing = (
    canContinueFeud ? Object.values(state.career.rivalsById) : []
  )
    .filter(
      record =>
        !record.snapshot.preferredRegionId ||
        record.snapshot.preferredRegionId === preparedMap.regionId
    )
    .sort(
      (a, b) =>
        b.history.nemesisLevel - a.history.nemesisLevel ||
        b.history.encounterCount - a.history.encounterCount ||
        a.snapshot.id.localeCompare(b.snapshot.id)
    )[0]
  if (existing)
    return {
      rivalBand: rehydrateRivalBand(existing),
      record: existing,
      isNew: false
    }
  const rivalBand = generateRivalBand(
    state.player.day,
    mulberry32(hashString(`${state.runSeed}:expedition-rival`))
  )
  const behavior =
    (['aggressive', 'showboat', 'saboteur', 'dealbreaker'] as const)[
      Math.abs(hashString(rivalBand.id)) % 4
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
