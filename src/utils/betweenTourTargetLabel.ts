import type { BandMember } from '../types/band'
import type { BetweenTourTarget, CareerRivalRecord } from '../types/career'
import { BRAND_DEALS_BY_ID } from '../data/brandDeals'
import { EXPEDITION_CREW_BY_ID } from '../data/expedition/crew'
import { getExpeditionRegion } from '../data/expedition/regions'
import { getTranslatedBrandDealDisplay } from './brandDealI18n'

type Translator = (key: string, options?: Record<string, unknown>) => string

/** State a Between-Tour target label may need to name its actor. */
interface BetweenTourTargetLabelContext {
  members: readonly BandMember[] | null | undefined
  rivalsById: Readonly<Record<string, CareerRivalRecord>> | null | undefined
}

/**
 * Resolves the player-facing name of a Between-Tour decision target.
 *
 * @param target - The stored decision target.
 * @param t - i18n translator.
 * @param context - Band members and Career rivals used to name live actors.
 * @returns A display label; never the raw target id.
 *
 * @remarks
 * Each target kind names its actor from its own registry: Crew through
 * `displayNameKey`, Sponsors through the brand-deal catalog, Archive leads
 * through the Region label, and band members and Rivals through their stored
 * names. The van needs no label: its copy does not interpolate a target.
 * Anything that no longer resolves falls back to
 * `ui:expedition.betweenTour.unknownTarget` instead of leaking the id.
 */
export const getBetweenTourTargetLabel = (
  target: BetweenTourTarget,
  t: Translator,
  context: BetweenTourTargetLabelContext
): string => {
  const unknown = (): string =>
    t('ui:expedition.betweenTour.unknownTarget', { defaultValue: 'Unknown' })
  switch (target.kind) {
    case 'crew': {
      const crew = Object.hasOwn(EXPEDITION_CREW_BY_ID, target.id)
        ? EXPEDITION_CREW_BY_ID[target.id]
        : undefined
      return crew ? t(crew.displayNameKey) : unknown()
    }
    case 'band': {
      const member = context.members?.find(m => m.id === target.id)
      const name = typeof member?.name === 'string' ? member.name.trim() : ''
      return name || unknown()
    }
    case 'rival': {
      const rivals = context.rivalsById
      const record =
        rivals && Object.hasOwn(rivals, target.id)
          ? rivals[target.id]
          : undefined
      const name =
        typeof record?.snapshot?.name === 'string'
          ? record.snapshot.name.trim()
          : ''
      return name || unknown()
    }
    case 'sponsor':
      return BRAND_DEALS_BY_ID.has(target.id)
        ? (getTranslatedBrandDealDisplay({ id: target.id }, t)?.name ??
            unknown())
        : unknown()
    case 'archive': {
      const region = getExpeditionRegion(target.id)
      return region ? t(region.labelKey) : unknown()
    }
    case 'vehicle':
      // `vehicle_repair` copy names the van itself and takes no `{{target}}`.
      return ''
  }
}
