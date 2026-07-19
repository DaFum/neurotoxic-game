import { useMemo } from 'react'
import type { GameState, GigModifiers } from '../../types'
import type { RhythmSetlistEntry } from '../../types/rhythmGame'
import type { ActiveEffectEntry } from '../../types/components'
import type { AssetModifiers } from '../../types/assets'
import type { TranslationCallback } from '../../types/callbacks'
import type { ModifierOption } from '../usePreGigLogic'
import {
  MODIFIER_COSTS,
  calculateGigModifierCost
} from '../../utils/economyEngine'
import { getGigModifiers } from '../../utils/simulationUtils'
import { getActiveAssetModifiers } from '../../utils/assetSelectors'
import { getSongId } from '../../utils/audio/audioEngine'
import { resolveBandMeetingCost } from './preGigUtils'

interface UsePreGigDerivationsProps {
  band: GameState['band']
  assets: GameState['assets']
  gigModifiers: GigModifiers
  setlist: RhythmSetlistEntry[]
  typedT: TranslationCallback
}

interface UsePreGigDerivationsReturn {
  assetModifiers: AssetModifiers
  GIG_MODIFIER_OPTIONS: ModifierOption[]
  adjustedBandMeetingCost: number
  currentModifiers: { activeEffects: ActiveEffectEntry[] }
  selectedSongIds: Set<string>
  calculatedBudget: number
}

export const usePreGigDerivations = ({
  band,
  assets,
  gigModifiers,
  setlist,
  typedT
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

  const currentModifiers = getGigModifiers(band, gigModifiers)

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

  return {
    assetModifiers,
    GIG_MODIFIER_OPTIONS,
    adjustedBandMeetingCost,
    currentModifiers,
    selectedSongIds,
    calculatedBudget
  }
}
