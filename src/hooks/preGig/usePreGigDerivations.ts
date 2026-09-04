import { useMemo } from 'react'
import type { GameState, GigModifiers } from '../../types'
import type { RhythmSetlistEntry } from '../../types/rhythmGame'
import type { ActiveEffectEntry } from '../../types/components'
import type { AssetModifiers } from '../../types/assets'
import type { TranslationCallback } from '../../types/callbacks'
import type { ModifierOption } from '../usePreGigLogic'
import type { ExpeditionTechnicalCondition } from '../../types/expedition'
import { MODIFIER_COSTS, calculateGigModifierCost } from '../../utils/economy'
import { getGigModifiers } from '../../utils/simulationUtils'
import { getActiveAssetModifiers } from '../../utils/assetSelectors'
import { getSongId } from '../../utils/audio/audioEngine'
import { resolveBandMeetingCost } from './preGigUtils'
import {
  getExpeditionConditionActiveEffects,
  getExpeditionConditionPerformanceProfile
} from '../../domain/expedition/condition'

/**
 * Configuration properties for the pre-gig derivations hook.
 */
interface UsePreGigDerivationsProps {
  band: GameState['band']
  assets: GameState['assets']
  gigModifiers: GigModifiers
  setlist: RhythmSetlistEntry[]
  typedT: TranslationCallback
  technicalCondition?: ExpeditionTechnicalCondition | null
  /** `canStartExpeditionPreGig` for the current state. */
  canStartShow: boolean
}

/**
 * The resulting derived state and computed values for the pre-gig setup.
 */
interface UsePreGigDerivationsReturn {
  assetModifiers: AssetModifiers
  GIG_MODIFIER_OPTIONS: ModifierOption[]
  adjustedBandMeetingCost: number
  currentModifiers: { activeEffects: ActiveEffectEntry[] }
  selectedSongIds: Set<string>
  calculatedBudget: number
  isStartBlocked: boolean
}

/**
 * Computes the derived state, modifier costs, and budget constraints required during the pre-gig preparation phase.
 *
 * @remarks
 * This hook acts as a central aggregation layer, recalculating the total cost of all selected gig modifiers,
 * factoring in asset-based adjustments (e.g., training cost multipliers), and assembling the final set of options.
 *
 * @param props - The configuration parameters and current context required for calculations.
 * @returns An object containing the computed budget, modified costs, and formatted options ready for the UI.
 */
export const usePreGigDerivations = ({
  band,
  assets,
  gigModifiers,
  setlist,
  typedT,
  technicalCondition,
  canStartShow
}: UsePreGigDerivationsProps): UsePreGigDerivationsReturn => {
  const assetModifiers = useMemo(
    () => getActiveAssetModifiers(assets ?? []),
    [assets]
  )

  const GIG_MODIFIER_OPTIONS = useMemo<ModifierOption[]>(
    () => [
      {
        key: 'soundcheck',
        label: typedT('ui:pregig.modifiers.soundcheck.label'),
        cost: calculateGigModifierCost('soundcheck', assetModifiers),
        desc: typedT('ui:pregig.modifiers.soundcheck.desc')
      },
      {
        key: 'promo',
        label: typedT('ui:pregig.modifiers.promo.label'),
        cost: calculateGigModifierCost('promo', assetModifiers),
        desc: typedT('ui:pregig.modifiers.promo.desc')
      },
      {
        key: 'merch',
        label: typedT('ui:pregig.modifiers.merch.label'),
        cost: calculateGigModifierCost('merch', assetModifiers),
        desc: typedT('ui:pregig.modifiers.merch.desc')
      },
      {
        key: 'catering',
        label: typedT('ui:pregig.modifiers.catering.label'),
        cost: calculateGigModifierCost('catering', assetModifiers),
        desc: typedT('ui:pregig.modifiers.catering.desc')
      },
      {
        key: 'guestlist',
        label: typedT('ui:pregig.modifiers.guestlist.label'),
        cost: calculateGigModifierCost('guestlist', assetModifiers),
        desc: typedT('ui:pregig.modifiers.guestlist.desc')
      }
    ],
    [assetModifiers, typedT]
  )

  const adjustedBandMeetingCost = useMemo(
    () => resolveBandMeetingCost(assetModifiers.trainingCostMultiplier),
    [assetModifiers.trainingCostMultiplier]
  )

  const currentModifiers = useMemo(() => {
    if (!technicalCondition) return getGigModifiers(band, gigModifiers)

    // The same profile the gig itself will run on, passed to the same producer
    // — so the penalties listed here are the ones the rhythm owners apply,
    // not a parallel description of them.
    const profile = getExpeditionConditionPerformanceProfile(technicalCondition)
    const base = getGigModifiers(band, gigModifiers, profile)
    return {
      ...base,
      activeEffects: [
        ...base.activeEffects,
        ...getExpeditionConditionActiveEffects(profile)
      ]
    }
  }, [band, gigModifiers, technicalCondition])

  const selectedSongIds = useMemo(() => {
    const ids = new Set<string>()
    for (let i = 0; i < setlist.length; i++) {
      const item = setlist[i]
      if (!item) continue
      const id = getSongId(item)
      if (id) ids.add(id)
    }
    return ids
  }, [setlist])

  const calculatedBudget = useMemo(() => {
    let acc = 0
    for (const key in gigModifiers) {
      if (Object.hasOwn(gigModifiers, key) && gigModifiers[key]) {
        acc += calculateGigModifierCost(
          key as keyof typeof MODIFIER_COSTS,
          assetModifiers
        )
      }
    }
    return acc
  }, [assetModifiers, gigModifiers])

  // The gate itself belongs to `canStartExpeditionPreGig`; this hook only
  // reports it. Deriving `disabledGroups` again here would be a second copy of
  // the rule, free to drift from the one the run actually enforces.
  const isStartBlocked = !canStartShow

  return {
    assetModifiers,
    GIG_MODIFIER_OPTIONS,
    adjustedBandMeetingCost,
    currentModifiers,
    selectedSongIds,
    calculatedBudget,
    isStartBlocked
  }
}
