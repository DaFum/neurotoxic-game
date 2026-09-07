/**
 * Tour Archive discovery: what may be recorded, and what proves it.
 *
 * @remarks
 * Two gates, and an entry needs both. The `(category, id)` pair has to name a
 * canonical registry entry, and the `sourceId` has to be a fact the reducer can
 * still see in the state it was dispatched against - the crew on the committed
 * loadout, the module in the installed slot, the event in the resolved-proof
 * list. Without the second gate the Archive would accept any real id at any
 * time, which is a free entry wearing a registry's name.
 *
 * The Archive holds no authority. Nothing here is read to decide what a Career
 * may book, buy or finish.
 */

import type { GameState } from '../../types'
import type { CareerState, ExpeditionArchiveCategory } from '../../types/career'
import {
  EXPEDITION_ARCHIVE_CATEGORIES,
  getExpeditionArchiveChassisId,
  isCanonicalExpeditionArchiveEntry
} from '../../data/expedition/archive'

/** An Archive with every category present and empty. */
export const createEmptyExpeditionArchive =
  (): CareerState['archiveByCategory'] => {
    const archive = Object.create(null) as CareerState['archiveByCategory']
    for (const category of EXPEDITION_ARCHIVE_CATEGORIES) archive[category] = []
    return archive
  }

/** The committed tourbus asset of the active run, when there is one. */
const activeTourbusAsset = (
  state: GameState
): GameState['assets'][number] | null => {
  const assetId = state.expedition?.loadout?.activeTourbusAssetId
  if (typeof assetId !== 'string') return null
  return (
    (Array.isArray(state.assets) ? state.assets : []).find(
      asset => asset.id === assetId && asset.kind === 'tourbus_chassis'
    ) ?? null
  )
}

/**
 * Whether one discovery may be recorded against the current state.
 *
 * @param state - Current game state.
 * @param category - Archive category.
 * @param id - The entry being claimed.
 * @param sourceId - The proof the caller offers for having met it.
 * @returns True when both the registry and the source proof hold.
 *
 * @remarks
 * Every branch checks something the *run* is observing right now rather than
 * something the save asserts. `runId` is the proof for the facts a committed
 * loadout already carries - the run is the observation - while the module,
 * chassis, Finale and special-event branches name the narrower evidence their
 * category actually produces.
 */
export const canRecordExpeditionArchiveDiscovery = (
  state: GameState,
  category: ExpeditionArchiveCategory,
  id: string,
  sourceId: string
): boolean => {
  if (typeof sourceId !== 'string' || sourceId.length === 0) return false
  if (
    category !== 'rival' &&
    !isCanonicalExpeditionArchiveEntry(category, id)
  ) {
    return false
  }
  const expedition = state.expedition
  const loadout = expedition?.loadout ?? null
  const runId = expedition?.runId ?? null

  switch (category) {
    case 'crew':
      return (
        runId !== null &&
        sourceId === runId &&
        (loadout?.crewIds ?? []).includes(id)
      )
    case 'region':
      return runId !== null && sourceId === runId && loadout?.regionId === id
    case 'contraband':
      return (
        runId !== null &&
        sourceId === runId &&
        (expedition?.cargo?.contraband ?? []).some(
          entry => entry.stashKey === id
        )
      )
    case 'module': {
      // The asset is the proof: a module the Career owns on some other bus is
      // not one this run met.
      const asset = activeTourbusAsset(state)
      return (
        asset !== null &&
        sourceId === asset.id &&
        (asset.slots ?? []).some(slot => slot.installedModuleId === id)
      )
    }
    case 'chassis': {
      const asset = activeTourbusAsset(state)
      return (
        asset !== null &&
        sourceId === asset.id &&
        getExpeditionArchiveChassisId(
          asset.kind,
          String(asset.chassisFlavor),
          Number(asset.chassisTier)
        ) === id
      )
    }
    case 'rival':
      // No static registry: the canonical set is the Career's own Rival
      // history, and the Rival has to be the one currently on the road.
      return (
        runId !== null &&
        sourceId === runId &&
        state.rivalBand?.id === id &&
        Object.hasOwn(state.career?.rivalsById ?? {}, id)
      )
    case 'sponsor':
      // An offer is not a meeting: only a deal the run actually signed counts.
      return (
        runId !== null &&
        sourceId === runId &&
        (state.social?.activeDeals ?? []).some(
          (deal: { id?: unknown }) => deal.id === id
        )
      )
    case 'finale':
      // The Finale has to have produced a result, which is what separates
      // standing on the node from having played it.
      return (
        expedition?.finaleType === id &&
        expedition?.outcome?.finaleResultId === sourceId
      )
    case 'special_event':
      // The run's own resolved-event proof list, keyed `<event>:<option>:<result>:<step>`.
      return (expedition?.resolvedEventSourceIds ?? []).some(
        proof => proof === sourceId && proof.startsWith(`${id}:`)
      )
    default:
      return false
  }
}

/** One provable Archive claim. */
export interface ExpeditionArchiveClaim {
  category: ExpeditionArchiveCategory
  id: string
  sourceId: string
}

/**
 * Everything the current state can prove the run has met.
 *
 * @param state - Current game state.
 * @returns The claims that would pass {@link canRecordExpeditionArchiveDiscovery}.
 *
 * @remarks
 * The Archive is discovery, so it is swept from what the run is observing
 * rather than reported by whatever code happened to touch a registry. Each
 * claim still goes through the same validation on the way in - this only
 * decides *what to offer*, never what is accepted.
 *
 * Called at the two moments a run's observations are complete enough to be
 * worth recording: the commit that fixes the build, and the completion that
 * has the Finale result and the run's resolved events.
 */
export const sweepExpeditionArchiveObservations = (
  state: GameState
): ExpeditionArchiveClaim[] => {
  const claims: ExpeditionArchiveClaim[] = []
  const expedition = state.expedition
  const runId = expedition?.runId
  if (typeof runId !== 'string') return claims
  const loadout = expedition?.loadout ?? null

  for (const crewId of loadout?.crewIds ?? []) {
    claims.push({ category: 'crew', id: crewId, sourceId: runId })
  }
  if (typeof loadout?.regionId === 'string') {
    claims.push({ category: 'region', id: loadout.regionId, sourceId: runId })
  }
  for (const entry of expedition?.cargo?.contraband ?? []) {
    claims.push({
      category: 'contraband',
      id: entry.stashKey,
      sourceId: runId
    })
  }
  const asset = activeTourbusAsset(state)
  if (asset) {
    claims.push({
      category: 'chassis',
      id: getExpeditionArchiveChassisId(
        asset.kind,
        String(asset.chassisFlavor),
        Number(asset.chassisTier)
      ),
      sourceId: asset.id
    })
    for (const slot of asset.slots ?? []) {
      if (typeof slot.installedModuleId === 'string') {
        claims.push({
          category: 'module',
          id: slot.installedModuleId,
          sourceId: asset.id
        })
      }
    }
  }
  if (typeof state.rivalBand?.id === 'string') {
    claims.push({ category: 'rival', id: state.rivalBand.id, sourceId: runId })
  }
  for (const deal of state.social?.activeDeals ?? []) {
    if (typeof deal.id === 'string') {
      claims.push({ category: 'sponsor', id: deal.id, sourceId: runId })
    }
  }
  const finaleResultId = expedition?.outcome?.finaleResultId
  if (typeof expedition?.finaleType === 'string' && finaleResultId) {
    claims.push({
      category: 'finale',
      id: expedition.finaleType,
      sourceId: finaleResultId
    })
  }
  for (const proof of expedition?.resolvedEventSourceIds ?? []) {
    const eventId = proof.split(':')[0]
    if (eventId !== undefined && eventId.length > 0) {
      claims.push({ category: 'special_event', id: eventId, sourceId: proof })
    }
  }
  return claims
}
