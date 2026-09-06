/**
 * The constrained pre-tour build surface.
 */

import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MAX_EXPEDITION_PRESSURE_MODIFIERS } from '../../data/expedition/pressureModifiers'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { formatCurrency } from '../../utils/numberUtils'
import { SONGS_BY_ID } from '../../data/songs'
import {
  FREE_EXPEDITION_REGION_ID,
  BASE_EXPEDITION_TOUR_TYPE_ID,
  MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS
} from '../../domain/expedition/defaults'
import { buildPreparedExpeditionSponsorOffers } from '../../domain/expedition/sponsors'
import { buildExpeditionMap } from '../../domain/expedition/map'
import { getExpeditionRegion } from '../../data/expedition/regions'
import { getExpeditionTourType } from '../../data/expedition/tourTypes'
import { getExpeditionOwnedPerformanceGear } from '../../domain/expedition/equipment'
import {
  getAvailableExpeditionRegionIds,
  getAvailablePressureModifierIds,
  getAvailableStarterPerkIds,
  getAvailableExpeditionTourTypeIds,
  getAvailableNativeContractTemplateIds,
  getExpeditionFuelTopUpCost,
  validateExpeditionBuildCommitment
} from '../../domain/expedition/loadout'
import {
  areExpeditionContractsCompatible,
  getExpeditionContractTargetNodeId
} from '../../domain/expedition/contracts'
import { MAX_NATIVE_EXPEDITION_CONTRACTS } from '../../data/expedition/contracts'
import { BRAND_DEALS } from '../../data/brandDeals'
import { getTranslatedBrandDealDisplay } from '../../utils/brandDealI18n'
import { BuildCommitmentPanel } from './BuildCommitmentPanel'
import { ExpeditionCrewPicker } from './ExpeditionCrewPicker'
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
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>([])
  const [startingFuelTarget, setStartingFuelTarget] = useState<number>(() =>
    Math.round(currentFuel)
  )
  const [protectedCareerCash, setProtectedCareerCash] = useState(0)
  const [sponsorOfferId, setSponsorOfferId] = useState<string | null>(null)
  const [starterPerkId, setStarterPerkId] = useState<string | null>(null)
  const [pressureModifierIds, setPressureModifierIds] = useState<string[]>([])
  const [contractTemplateIds, setContractTemplateIds] = useState<string[]>([])

  const [tourTypeId, setTourTypeId] = useState<string>(
    BASE_EXPEDITION_TOUR_TYPE_ID
  )
  const [regionId, setRegionId] = useState<string>(FREE_EXPEDITION_REGION_ID)

  // Both selections are derived from the prepared route: the staged Sponsor
  // offers and the available Contract templates are rebuilt whenever the Tour
  // or Region changes, and a previously picked id can drop out of the new set.
  // The button would then vanish from the screen while the id stayed in the
  // candidate, so the commit would carry an offer this route never staged or a
  // Contract whose target node belongs to a different map.
  const selectRoute = useCallback((apply: () => void) => {
    apply()
    setSponsorOfferId(null)
    setContractTemplateIds([])
  }, [])

  // The perk restages the Sponsor pool for the same reason: `press_pass`
  // promotes one more genuine match, so the offer order changes and a picked
  // id can fall outside the count the route stages.
  const selectStarterPerk = useCallback((perkId: string | null) => {
    setStarterPerkId(perkId)
    setSponsorOfferId(null)
  }, [])

  const availableTourTypeIds = useMemo(
    () => getAvailableExpeditionTourTypeIds(state),
    [state]
  )
  const availablePerkIds = useMemo(
    () => getAvailableStarterPerkIds(state),
    [state]
  )
  const availablePressureIds = useMemo(
    () => getAvailablePressureModifierIds(state),
    [state]
  )
  const availableRegionIds = useMemo(
    () => getAvailableExpeditionRegionIds(state),
    [state]
  )

  // The route is rebuilt whenever either axis changes, because the Tour and the
  // Region are what the route is made of: previewing one pair and committing
  // another is exactly what the START parity check exists to refuse.
  const preparedMap = useMemo(
    () => buildExpeditionMap(runSeed, tourTypeId, regionId),
    [regionId, runSeed, tourTypeId]
  )

  // Derived from the selected Region and Tour, not read from persisted state:
  // PREPARE happens on scene entry before either is chosen, so a stored set
  // would always describe the baseline route rather than the one being built.
  const sponsorOffers = useMemo(
    () =>
      buildPreparedExpeditionSponsorOffers(
        state,
        preparedMap.regionId,
        preparedMap.tourTypeId,
        starterPerkId
      ),
    [preparedMap, starterPerkId, state]
  )
  const availableSponsorOfferIds = useMemo(
    () => sponsorOffers.map(offer => offer.offerId),
    [sponsorOffers]
  )
  const availableContractTemplateIds = useMemo(
    () => getAvailableNativeContractTemplateIds(state, preparedMap),
    [preparedMap, state]
  )

  // The route target is derived, never picked: the reducer materializes the
  // same node, so a committed route Contract cannot point somewhere else.
  const nativeContracts = useMemo(
    () =>
      contractTemplateIds.map(templateId => ({
        templateId,
        targetNodeId: getExpeditionContractTargetNodeId(templateId, preparedMap)
      })),
    [contractTemplateIds, preparedMap]
  )

  const candidate = useMemo<ExpeditionLoadout>(
    () => ({
      tourTypeId,
      regionId,
      activeTourbusAssetId: null,
      crewIds: selectedCrewIds,
      cargo: { spareParts: 0, supplies: 0 },
      starterPerkId,
      nativeContracts,
      insurancePolicyId: null,
      pressureModifierIds,
      build: {
        setlistSongIds,
        equipment: { selectedGearItemIds },
        selectedTourbusModuleIds: [],
        merch: [],
        contraband: [],
        sponsorOfferId,
        startingFuelTarget,
        protectedCareerCash
      }
    }),
    [
      nativeContracts,
      protectedCareerCash,
      regionId,
      selectedGearItemIds,
      selectedCrewIds,
      starterPerkId,
      pressureModifierIds,
      setlistSongIds,
      sponsorOfferId,
      startingFuelTarget,
      tourTypeId
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

  // Incompatible pairs are refused here rather than at commit time: the screen
  // is about seeing the trade-off, not about being told afterwards.
  const toggleContract = useCallback((templateId: string) => {
    setContractTemplateIds(current => {
      if (current.includes(templateId))
        return current.filter(entry => entry !== templateId)
      if (current.length >= MAX_NATIVE_EXPEDITION_CONTRACTS) return current
      const next = [...current, templateId]
      return areExpeditionContractsCompatible(next) ? next : current
    })
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
                {SONGS_BY_ID.get(songId)?.name ?? songId}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className='border border-steel-gray p-3 flex flex-col gap-2'>
        <legend className='text-xs uppercase tracking-widest text-toxic-green px-1'>
          {t('ui:expedition.prep.route')}
        </legend>
        <p className='text-xs text-ash-gray'>
          {t('ui:expedition.prep.routeHint')}
        </p>
        <div className='flex flex-wrap gap-2'>
          {availableTourTypeIds.map((id: string) => {
            const isSelected = tourTypeId === id
            return (
              <button
                key={id}
                type='button'
                aria-pressed={isSelected}
                onClick={() => selectRoute(() => setTourTypeId(id))}
                data-testid={`expedition-prep-tour-${id}`}
                className={`min-h-11 px-3 py-2 text-xs font-mono uppercase border transition-colors ${
                  isSelected
                    ? 'border-toxic-green bg-toxic-green/20 text-star-white'
                    : 'border-steel-gray text-ash-gray hover:border-toxic-green'
                }`}
              >
                {t(getExpeditionTourType(id)?.labelKey ?? id)}
              </button>
            )
          })}
        </div>
        <div className='flex flex-wrap gap-2'>
          {availableRegionIds.map((id: string) => {
            const isSelected = regionId === id
            return (
              <button
                key={id}
                type='button'
                aria-pressed={isSelected}
                onClick={() => selectRoute(() => setRegionId(id))}
                data-testid={`expedition-prep-region-${id}`}
                className={`min-h-11 px-3 py-2 text-xs font-mono uppercase border transition-colors ${
                  isSelected
                    ? 'border-toxic-green bg-toxic-green/20 text-star-white'
                    : 'border-steel-gray text-ash-gray hover:border-toxic-green'
                }`}
              >
                {t(getExpeditionRegion(id)?.labelKey ?? id)}
              </button>
            )
          })}
        </div>
      </fieldset>

      <ExpeditionCrewPicker
        selectedCrewIds={selectedCrewIds}
        onChange={setSelectedCrewIds}
      />

      <fieldset className='border border-steel-gray p-3 flex flex-col gap-2'>
        <legend className='text-xs uppercase tracking-widest text-toxic-green px-1'>
          {t('ui:expedition.prep.starterPerk')}
        </legend>
        <p className='text-xs text-ash-gray'>
          {t('ui:expedition.prep.starterPerkHint')}
        </p>
        <div className='flex flex-wrap gap-2'>
          <button
            type='button'
            aria-pressed={starterPerkId === null}
            onClick={() => selectStarterPerk(null)}
            data-testid='expedition-prep-perk-none'
            className={`min-h-11 px-3 py-2 text-xs font-mono uppercase border transition-colors ${
              starterPerkId === null
                ? 'border-toxic-green bg-toxic-green/20 text-star-white'
                : 'border-steel-gray text-ash-gray hover:border-toxic-green'
            }`}
          >
            {t('ui:expedition.prep.starterPerkNone')}
          </button>
          {availablePerkIds.map(perkId => (
            <button
              key={perkId}
              type='button'
              aria-pressed={starterPerkId === perkId}
              onClick={() => selectStarterPerk(perkId)}
              data-testid={`expedition-prep-perk-${perkId}`}
              className={`min-h-11 px-3 py-2 text-left text-xs font-mono uppercase border transition-colors ${
                starterPerkId === perkId
                  ? 'border-toxic-green bg-toxic-green/20 text-star-white'
                  : 'border-steel-gray text-ash-gray hover:border-toxic-green'
              }`}
            >
              <strong>{t(`ui:expedition.perk.${perkId}`)}</strong>
              <span className='block normal-case text-ash-gray'>
                {t(`ui:expedition.perk.${perkId}Effect`)}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className='border border-steel-gray p-3 flex flex-col gap-2'>
        <legend className='text-xs uppercase tracking-widest text-toxic-green px-1'>
          {t('ui:expedition.prep.tourPressure')}
        </legend>
        <p className='text-xs text-ash-gray'>
          {availablePressureIds.length === 0
            ? t('ui:expedition.prep.tourPressureLocked')
            : t('ui:expedition.prep.tourPressureHint')}
        </p>
        <div className='flex flex-wrap gap-2'>
          {availablePressureIds.map(modifierId => {
            const selected = pressureModifierIds.includes(modifierId)
            return (
              <button
                key={modifierId}
                type='button'
                aria-pressed={selected}
                disabled={
                  !selected &&
                  pressureModifierIds.length >=
                    MAX_EXPEDITION_PRESSURE_MODIFIERS
                }
                onClick={() =>
                  setPressureModifierIds(current =>
                    toggleBounded(
                      current,
                      modifierId,
                      MAX_EXPEDITION_PRESSURE_MODIFIERS
                    )
                  )
                }
                data-testid={`expedition-prep-pressure-${modifierId}`}
                className={`min-h-11 px-3 py-2 text-left text-xs font-mono uppercase border transition-colors disabled:opacity-40 ${
                  selected
                    ? 'border-toxic-green bg-toxic-green/20 text-star-white'
                    : 'border-steel-gray text-ash-gray hover:border-toxic-green'
                }`}
              >
                <strong>{t(`ui:expedition.pressure.${modifierId}`)}</strong>
                <span className='block normal-case text-ash-gray'>
                  {t(`ui:expedition.pressure.${modifierId}Effect`)}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className='border border-steel-gray p-3 flex flex-col gap-2'>
        <legend className='text-xs uppercase tracking-widest text-toxic-green px-1'>
          {t('ui:expedition.prep.sponsor')}
        </legend>
        <p className='text-xs text-ash-gray'>
          {t('ui:expedition.prep.sponsorHint')}
        </p>
        <div className='flex flex-wrap gap-2'>
          <button
            type='button'
            aria-pressed={sponsorOfferId === null}
            onClick={() => setSponsorOfferId(null)}
            data-testid='expedition-prep-sponsor-none'
            className={`min-h-11 px-3 py-2 text-xs font-mono uppercase border transition-colors ${
              sponsorOfferId === null
                ? 'border-toxic-green bg-toxic-green/20 text-star-white'
                : 'border-steel-gray text-ash-gray hover:border-toxic-green'
            }`}
          >
            {t('ui:expedition.prep.sponsorNone')}
          </button>
          {sponsorOffers
            .filter(offer => availableSponsorOfferIds.includes(offer.offerId))
            .map(offer => {
              const deal = BRAND_DEALS.find(entry => entry.id === offer.dealId)
              const isSelected = sponsorOfferId === offer.offerId
              return (
                <button
                  key={offer.offerId}
                  type='button'
                  aria-pressed={isSelected}
                  onClick={() => setSponsorOfferId(offer.offerId)}
                  data-testid={`expedition-prep-sponsor-${offer.offerId}`}
                  className={`min-h-11 px-3 py-2 text-xs font-mono uppercase border transition-colors ${
                    isSelected
                      ? 'border-toxic-green bg-toxic-green/20 text-star-white'
                      : 'border-steel-gray text-ash-gray hover:border-toxic-green'
                  }`}
                >
                  {(deal
                    ? getTranslatedBrandDealDisplay(deal, t)?.name
                    : null) ?? offer.dealId}
                </button>
              )
            })}
        </div>
      </fieldset>

      <fieldset className='border border-steel-gray p-3 flex flex-col gap-2'>
        <legend className='text-xs uppercase tracking-widest text-toxic-green px-1'>
          {t('ui:expedition.prep.contracts', {
            count: contractTemplateIds.length,
            max: MAX_NATIVE_EXPEDITION_CONTRACTS
          })}
        </legend>
        <p className='text-xs text-ash-gray'>
          {t('ui:expedition.prep.contractsHint')}
        </p>
        <div className='flex flex-wrap gap-2'>
          {availableContractTemplateIds.map(templateId => {
            const isSelected = contractTemplateIds.includes(templateId)
            // A pair the registry refuses is shown as unavailable rather than
            // accepted and rejected at commit time.
            const isBlocked =
              !isSelected &&
              (contractTemplateIds.length >= MAX_NATIVE_EXPEDITION_CONTRACTS ||
                !areExpeditionContractsCompatible([
                  ...contractTemplateIds,
                  templateId
                ]))
            return (
              <button
                key={templateId}
                type='button'
                aria-pressed={isSelected}
                disabled={isBlocked}
                onClick={() => toggleContract(templateId)}
                data-testid={`expedition-prep-contract-${templateId}`}
                className={`min-h-11 px-3 py-2 text-xs font-mono uppercase border transition-colors ${
                  isSelected
                    ? 'border-toxic-green bg-toxic-green/20 text-star-white'
                    : isBlocked
                      ? 'border-steel-gray text-steel-gray cursor-not-allowed'
                      : 'border-steel-gray text-ash-gray hover:border-toxic-green'
                }`}
              >
                {t(`ui:expedition.contract.${templateId}`, {
                  defaultValue: templateId
                })}
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
