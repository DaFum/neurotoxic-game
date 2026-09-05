import { generateRivalBand } from '../../utils/rivalEngine'
import { mulberry32 } from '../../utils/seededRng'
import { hashString } from '../../utils/stringUtils'
import type { GameState, RivalBandState } from '../../types'
import type { CareerRivalRecord } from '../../types/career'
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
  if (!routeProfile.rivalAllowed) return null
  const existing = Object.values(state.career.rivalsById)
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
      lastSeenRunId: state.expedition.runId
    }
  }
  return { rivalBand, record, isNew: true }
}
