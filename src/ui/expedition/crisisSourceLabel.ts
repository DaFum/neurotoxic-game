import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'
import { EXPEDITION_CONDITION_GROUPS } from '../../domain/expedition/condition'
import type { GameState } from '../../types'
import type {
  ExpeditionFailureReason,
  ActiveObligationState
} from '../../types/expedition'
import type { TranslationCallback } from '../../types/callbacks'
import { translateLocation } from '../../utils/locationI18n'

/**
 * Run state the crisis source ids are resolved against.
 */
export interface CrisisSourceContext {
  gameMap: GameState['gameMap']
  members: ReadonlyArray<{ id: string; name?: string } | null | undefined>
  obligations: readonly ActiveObligationState[]
}

const hasKey = (record: object | null | undefined, key: string): boolean =>
  record != null && Object.hasOwn(record, key)

/**
 * Resolves a pending failure's `sourceId` to a translated, player-facing label.
 *
 * @param t - Translation callback.
 * @param reason - Failure family; it decides which id family `sourceId` is.
 * @param sourceId - Raw id from the pending failure.
 * @param context - Map, band and obligation slices used to look names up.
 * @returns A translated label; an explicit unknown-source label when the id
 * cannot be resolved, never the raw id.
 *
 * @remarks
 * The id family depends on the reason: bankruptcy uses fixed resource ids,
 * fuel strandings a map node (or the route), technical shutdowns a condition
 * group, crew collapses a band member or Crew id, authority crises an
 * `authority:<runId>:<step>` proof, and contract breaches an obligation id.
 */
export const getCrisisSourceLabel = (
  t: TranslationCallback,
  reason: ExpeditionFailureReason,
  sourceId: string,
  context: CrisisSourceContext
): string => {
  const unknown = () => t('ui:expedition.crisis.source.unknown')
  const route = () => t('ui:expedition.crisis.source.expedition_route')

  switch (reason) {
    case 'bankruptcy':
      return sourceId === 'expedition_cash' ||
        sourceId === 'expedition_unpaid_obligation'
        ? t(`ui:expedition.crisis.source.${sourceId}`)
        : unknown()
    case 'fuel_stranded': {
      const node = hasKey(context.gameMap?.nodes, sourceId)
        ? context.gameMap?.nodes[sourceId]
        : undefined
      const venueName = node?.venue?.name
      return typeof venueName === 'string' && venueName.length > 0
        ? translateLocation(t, venueName, '')
        : route()
    }
    case 'technical_shutdown':
      return (EXPEDITION_CONDITION_GROUPS as readonly string[]).includes(
        sourceId
      )
        ? t(`ui:expedition.condition.group.${sourceId}`)
        : unknown()
    case 'crew_collapse': {
      const member = context.members.find(
        candidate => candidate?.id === sourceId
      )
      if (member && typeof member.name === 'string' && member.name.length > 0) {
        return member.name
      }
      return hasKey(EXPEDITION_CREW_BY_ID, sourceId)
        ? t(EXPEDITION_CREW_BY_ID[sourceId]?.displayNameKey ?? '')
        : unknown()
    }
    case 'authority_crisis':
      return sourceId.startsWith('authority:')
        ? t('ui:expedition.crisis.source.authority')
        : unknown()
    case 'critical_contract_breach': {
      const contractId = context.obligations.find(
        obligation => obligation.id === sourceId
      )?.sourceId
      return typeof contractId === 'string'
        ? t(`ui:expedition.contract.${contractId}`, {
            defaultValue: t('ui:expedition.crisis.source.unknown')
          })
        : unknown()
    }
    default:
      return unknown()
  }
}
