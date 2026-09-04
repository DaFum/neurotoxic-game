/**
 * The constrained pre-tour build surface.
 */

import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { formatCurrency } from '../../utils/numberUtils'
import { SONGS_BY_ID } from '../../data/songs'
import {
  BASE_EXPEDITION_REGION_ID,
  BASE_EXPEDITION_TOUR_TYPE_ID,
  MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS,
  NEUTRAL_EXPEDITION_ROUTE_PROFILE
} from '../../domain/expedition/defaults'
import { buildExpeditionMap } from '../../domain/expedition/map'
import { getExpeditionOwnedPerformanceGear } from '../../domain/expedition/equipment'
import {
  getExpeditionFuelTopUpCost,
  validateExpeditionBuildCommitment
} from '../../domain/expedition/loadout'
import { BuildCommitmentPanel } from './BuildCommitmentPanel'
import type { ExpeditionLoadout } from '../../types/expedition'

const MAX_SETLIST_SONGS = 4

/**
 * Toggles one id in a bounded selection.
 */
const toggleBounded = (
  selected: readonly string[],
  id: string,
  max: number
): string[] => {
  if (selected.includes(id)) return selected.filter(entry => entry !== id)
  if (selected.length >= max) return [...selected]
  return [...selected, id]
}

/**
 * Renders the constrained build the player commits before the tour starts.
 *
 * @remarks
 * Every axis draws from canonical ownership: songs from `SONGS_BY_ID`, gear from
 * the real HQ purchase state. The UI holds only the *candidate* selection; the
 * shared validator decides legality and the reducer re-validates on START, so
 * nothing here authorizes a run.
 *
 * The slot limits are the point of the screen: the player must not be able to
 * bring every solution, so the gear cap and the setlist cap are enforced
 * visibly rather than by rejecting the commit afterwards.
 */
export const TourPrepLoadout = memo(function TourPrepLoadout() {
  const { t, i18n } = useTranslation('ui')
  const { startExpedition } = useGameActions()
  const runSeed = useGameSelector(state => state.runSeed)
  const money = useGameSelector(state => state.player.money)
  const currentFuel = useGameSelector(state => state.player.van?.fuel ?? 0)
  const ownedGearItemIds = useGameSelector(getExpeditionOwnedPerformanceGear)
  const state = useGameSelector(current => current)

  const songIds = useMemo(() => [...SONGS_BY_ID.keys()], [])

  const [setlistSongIds, setSetlistSongIds] = useState<string[]>(() =>
    songIds.slice(0, 1)
  )
  const [selectedGearItemIds, setSelectedGearItemIds] = useState<string[]>([])
  const [startingFuelTarget, setStartingFuelTarget] = useState<number>(() =>
    Math.round(currentFuel)
  )
  const [protectedCareerCash, setProtectedCareerCash] = useState(0)

  const preparedMap = useMemo(
    () =>
      buildExpeditionMap(
        runSeed,
        BASE_EXPEDITION_TOUR_TYPE_ID,
        BASE_EXPEDITION_REGION_ID,
        NEUTRAL_EXPEDITION_ROUTE_PROFILE
      ),
    [runSeed]
  )

  const candidate = useMemo<ExpeditionLoadout>(
    () => ({
      tourTypeId: BASE_EXPEDITION_TOUR_TYPE_ID,
      regionId: BASE_EXPEDITION_REGION_ID,
      activeTourbusAssetId: null,
      crewIds: [],
      cargo: { spareParts: 0, supplies: 0 },
      starterPerkId: null,
      nativeContracts: [],
      insurancePolicyId: null,
      pressureModifierIds: [],
      build: {
        setlistSongIds,
        equipment: { selectedGearItemIds },
        selectedTourbusModuleIds: [],
        merch: [],
        contraband: [],
        sponsorOfferId: null,
        startingFuelTarget,
        protectedCareerCash
      }
    }),
    [
      protectedCareerCash,
      selectedGearItemIds,
      setlistSongIds,
      startingFuelTarget
    ]
  )

  const validation = useMemo(
    () => validateExpeditionBuildCommitment(state, candidate, preparedMap),
    [candidate, preparedMap, state]
  )

  const fuelCost = getExpeditionFuelTopUpCost(currentFuel, startingFuelTarget)
  const spendableAfterCommit = Math.max(
    0,
    money - fuelCost - protectedCareerCash
  )

  const handleCommit = useCallback(() => {
    if (!validation.valid) return
    startExpedition(validation.normalized)
  }, [startExpedition, validation])

  const toggleSong = useCallback((songId: string) => {
    setSetlistSongIds(current =>
      toggleBounded(current, songId, MAX_SETLIST_SONGS)
    )
  }, [])

  const toggleGear = useCallback((itemId: string) => {
    setSelectedGearItemIds(current =>
      toggleBounded(current, itemId, MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS)
    )
  }, [])

  return (
    <div
      className='flex flex-col gap-4'
      data-testid='expedition-tour-prep-loadout'
    >
      <fieldset className='border border-steel-gray p-3 flex flex-col gap-2'>
        <legend className='text-xs uppercase tracking-widest text-toxic-green px-1'>
          {t('ui:expedition.prep.setlist', {
            count: setlistSongIds.length,
            max: MAX_SETLIST_SONGS
          })}
        </legend>
        <div className='flex flex-wrap gap-2'>
          {songIds.map(songId => {
            const isSelected = setlistSongIds.includes(songId)
            return (
              <button
                key={songId}
                type='button'
                aria-pressed={isSelected}
                onClick={() => toggleSong(songId)}
                className={`min-h-11 px-3 py-2 text-xs font-mono uppercase border transition-colors ${
                  isSelected
                    ? 'border-toxic-green bg-toxic-green/20 text-star-white'
                    : 'border-steel-gray text-ash-gray hover:border-toxic-green'
                }`}
              >
                {songId}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className='border border-steel-gray p-3 flex flex-col gap-2'>
        <legend className='text-xs uppercase tracking-widest text-toxic-green px-1'>
          {t('ui:expedition.prep.equipment', {
            count: selectedGearItemIds.length,
            max: MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS
          })}
        </legend>
        {ownedGearItemIds.length === 0 ? (
          <p
            className='text-xs text-ash-gray'
            data-testid='expedition-prep-no-gear'
          >
            {t('ui:expedition.prep.noOwnedGear')}
          </p>
        ) : (
          <div className='flex flex-wrap gap-2'>
            {ownedGearItemIds.map(itemId => {
              const isSelected = selectedGearItemIds.includes(itemId)
              return (
                <button
                  key={itemId}
                  type='button'
                  aria-pressed={isSelected}
                  onClick={() => toggleGear(itemId)}
                  className={`min-h-11 px-3 py-2 text-xs font-mono uppercase border transition-colors ${
                    isSelected
                      ? 'border-toxic-green bg-toxic-green/20 text-star-white'
                      : 'border-steel-gray text-ash-gray hover:border-toxic-green'
                  }`}
                >
                  {t(`items:${itemId}.name`, { defaultValue: itemId })}
                </button>
              )
            })}
          </div>
        )}
        <p className='text-xs text-ash-gray'>
          {t('ui:expedition.prep.equipmentHint')}
        </p>
      </fieldset>

      <fieldset className='border border-steel-gray p-3 flex flex-col gap-2'>
        <legend className='text-xs uppercase tracking-widest text-toxic-green px-1'>
          {t('ui:expedition.prep.resources')}
        </legend>
        <label className='flex flex-col gap-1 text-xs font-mono uppercase text-ash-gray'>
          {t('ui:expedition.prep.fuelTarget', { value: startingFuelTarget })}
          <input
            type='range'
            min={Math.round(currentFuel)}
            max={100}
            step={1}
            value={startingFuelTarget}
            data-testid='expedition-prep-fuel-target'
            onChange={event =>
              setStartingFuelTarget(Number(event.currentTarget.value))
            }
          />
        </label>
        <label className='flex flex-col gap-1 text-xs font-mono uppercase text-ash-gray'>
          {t('ui:expedition.prep.protectedCash', {
            amount: formatCurrency(protectedCareerCash, i18n.language)
          })}
          <input
            type='range'
            min={0}
            max={Math.max(0, Math.floor(money))}
            step={10}
            value={protectedCareerCash}
            data-testid='expedition-prep-protected-cash'
            onChange={event =>
              setProtectedCareerCash(Number(event.currentTarget.value))
            }
          />
        </label>
        <p className='text-xs text-ash-gray'>
          {t('ui:expedition.prep.protectedCashHint')}
        </p>
      </fieldset>

      <BuildCommitmentPanel
        preparedMap={preparedMap}
        validation={validation}
        fuelCost={fuelCost}
        spendableAfterCommit={spendableAfterCommit}
        onCommit={handleCommit}
      />
    </div>
  )
})
