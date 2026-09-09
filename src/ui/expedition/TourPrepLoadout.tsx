/**
 * The constrained pre-tour build surface.
 */

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MAX_EXPEDITION_PRESSURE_MODIFIERS } from '../../data/expedition/pressureModifiers'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { formatCurrency } from '../../utils/numberUtils'
import { finiteNumberOr } from '../../utils/finiteNumber'
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
import {
  calculateExpeditionCargoCapacity,
  calculateExpeditionCargoUsage
} from '../../domain/expedition/cargo'
import {
  getAvailableInsurancePolicyIds,
  getExpeditionInsurancePremium,
  EXPEDITION_INSURANCE_POLICIES
} from '../../domain/expedition/insurance'
import { getExpeditionChassisProfile } from '../../domain/expedition/chassis'
import { MERCH_PROFILES } from '../../data/merch'
import { isExpeditionCapabilityUnlocked } from '../../data/expedition/unlockSets'
import { CONTRABAND_BY_ID } from '../../data/contraband'
import { MAX_NATIVE_EXPEDITION_CONTRACTS } from '../../data/expedition/contracts'
import { BRAND_DEALS } from '../../data/brandDeals'
import { getTranslatedBrandDealDisplay } from '../../utils/brandDealI18n'
import { BuildCommitmentPanel } from './BuildCommitmentPanel'
import { ExpeditionCrewPicker } from './ExpeditionCrewPicker'
import type {
  ExpeditionContrabandSelection,
  ExpeditionInsurancePolicyId,
  ExpeditionLoadout,
  ExpeditionMerchSelection
} from '../../types/expedition'

const MAX_SETLIST_SONGS = 4

type BuildTabCategory =
  | 'route_performance'
  | 'tourbus_cargo'
  | 'risk_protection'
  | 'commercial_contracts'

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
  const { startExpedition, prepareExpeditionSponsorOffers } = useGameActions()
  const runSeed = useGameSelector(state => state.runSeed)
  const money = useGameSelector(state => state.player.money)
  const currentFuel = useGameSelector(state => state.player.van?.fuel ?? 0)
  const ownedGearItemIds = useGameSelector(getExpeditionOwnedPerformanceGear)
  const career = useGameSelector(state => state.career)
  const state = useGameSelector(current => current)

  const [activeTab, setActiveTab] = useState<BuildTabCategory>(
    'route_performance'
  )

  const songIds = useMemo(() => [...SONGS_BY_ID.keys()], [])

  const [setlistSongIds, setSetlistSongIds] = useState<string[]>(() =>
    songIds.slice(0, 1)
  )
  const [selectedGearItemIds, setSelectedGearItemIds] = useState<string[]>([])
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>([])

  const [activeTourbusAssetId, setActiveTourbusAssetId] = useState<
    string | null
  >(null)
  const [spareParts, setSpareParts] = useState(0)
  const [supplies, setSupplies] = useState(0)

  const [insurancePolicyId, setInsurancePolicyId] =
    useState<ExpeditionInsurancePolicyId | null>(null)
  const [merch, setMerch] = useState<ExpeditionMerchSelection[]>([])
  const [contraband, setContraband] = useState<ExpeditionContrabandSelection[]>(
    []
  )

  // Ceil, not round: production Fuel is deliberately fractional and the
  // loadout rule is `startingFuelTarget >= currentFuel`. At 44.1 in the tank,
  // rounding hands the validator 44 and Tour Prep opens on an invalid build
  // the player never touched, with `handleCommit` refusing on the first click.
  const [startingFuelTarget, setStartingFuelTarget] = useState<number>(() =>
    Math.ceil(currentFuel)
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

  const ownedTourbusAssets = useMemo(() => {
    const assets = Array.isArray(state.assets) ? state.assets : []
    return assets.filter(asset => asset.kind === 'tourbus_chassis')
  }, [state.assets])

  const activeChassisAsset = useMemo(() => {
    if (!activeTourbusAssetId) return null
    return (
      ownedTourbusAssets.find(asset => asset.id === activeTourbusAssetId) ?? null
    )
  }, [activeTourbusAssetId, ownedTourbusAssets])

  const activeModuleIds = useMemo(() => {
    if (!activeChassisAsset) return []
    const slots = Array.isArray(activeChassisAsset.slots)
      ? activeChassisAsset.slots
      : []
    const ids: string[] = []
    for (const slot of slots) {
      if (typeof slot?.installedModuleId === 'string') {
        ids.push(slot.installedModuleId)
      }
    }
    return ids.sort()
  }, [activeChassisAsset])

  const cargoCapacity = useMemo(
    () => calculateExpeditionCargoCapacity(activeChassisAsset, activeModuleIds),
    [activeChassisAsset, activeModuleIds]
  )

  const cargoUsage = useMemo(
    () =>
      calculateExpeditionCargoUsage(
        {
          spareParts,
          supplies,
          technicalGearItemIds: selectedGearItemIds,
          merch,
          contraband
        },
        cargoCapacity
      ),
    [spareParts, supplies, selectedGearItemIds, merch, contraband, cargoCapacity]
  )

  const availableInsurancePolicyIds = useMemo(
    () => getAvailableInsurancePolicyIds(state),
    [state]
  )

  const ownedMerchItems = useMemo(() => {
    const inv = state.band?.inventory ?? {}
    return Object.keys(MERCH_PROFILES)
      .filter(key => typeof inv[key] === 'number' && inv[key] > 0)
      .map(key => ({ inventoryKey: key, ownedQuantity: inv[key] as number }))
  }, [state.band?.inventory])

  const ownedContrabandItems = useMemo(() => {
    const stash = state.band?.stash ?? {}
    return [...CONTRABAND_BY_ID.keys()]
      .filter(key => {
        const item = stash[key]
        return item && typeof item.stacks === 'number' && item.stacks > 0
      })
      .map(key => {
        const item = stash[key]!
        return {
          stashKey: key,
          instanceId:
            typeof item.instanceId === 'string' ? item.instanceId : null,
          ownedStacks: item.stacks as number
        }
      })
  }, [state.band?.stash])

  // Both selections are derived from the prepared route: the staged Sponsor
  // offers and the available Contract templates are rebuilt whenever the Tour
  // or Region changes, and a previously picked id can drop out of the new set.
  const selectRoute = useCallback(
    (currentId: string, nextId: string, apply: () => void) => {
      if (currentId === nextId) return
      apply()
      setSponsorOfferId(null)
      setContractTemplateIds([])
    },
    []
  )

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

  const preparedMap = useMemo(
    () => buildExpeditionMap(runSeed, tourTypeId, regionId),
    [regionId, runSeed, tourTypeId]
  )

  const sponsorOffers = useMemo(
    () =>
      state.expedition.preparedSponsorOffers &&
      state.expedition.preparedSponsorOffers.length > 0
        ? state.expedition.preparedSponsorOffers
        : buildPreparedExpeditionSponsorOffers(
            state,
            preparedMap.regionId,
            preparedMap.tourTypeId,
            starterPerkId
          ),
    [preparedMap, starterPerkId, state]
  )

  useEffect(() => {
    prepareExpeditionSponsorOffers?.(
      preparedMap.regionId,
      preparedMap.tourTypeId,
      starterPerkId
    )
  }, [
    prepareExpeditionSponsorOffers,
    preparedMap.regionId,
    preparedMap.tourTypeId,
    runSeed,
    starterPerkId
  ])

  const availableSponsorOfferIds = useMemo(
    () => sponsorOffers.map(offer => offer.offerId),
    [sponsorOffers]
  )
  const availableContractTemplateIds = useMemo(
    () => getAvailableNativeContractTemplateIds(state, preparedMap),
    [preparedMap, state]
  )

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
      activeTourbusAssetId,
      crewIds: selectedCrewIds,
      cargo: { spareParts, supplies },
      starterPerkId,
      nativeContracts,
      insurancePolicyId,
      pressureModifierIds,
      build: {
        setlistSongIds,
        equipment: { selectedGearItemIds },
        selectedTourbusModuleIds: activeModuleIds,
        merch,
        contraband,
        sponsorOfferId,
        startingFuelTarget,
        protectedCareerCash
      }
    }),
    [
      activeModuleIds,
      activeTourbusAssetId,
      contraband,
      insurancePolicyId,
      merch,
      nativeContracts,
      protectedCareerCash,
      regionId,
      selectedCrewIds,
      selectedGearItemIds,
      setlistSongIds,
      spareParts,
      sponsorOfferId,
      starterPerkId,
      startingFuelTarget,
      supplies,
      tourTypeId,
      pressureModifierIds
    ]
  )

  const validation = useMemo(
    () => validateExpeditionBuildCommitment(state, candidate, preparedMap),
    [candidate, preparedMap, state]
  )

  const fuelCost = getExpeditionFuelTopUpCost(currentFuel, startingFuelTarget)
  const insurancePremium = getExpeditionInsurancePremium(insurancePolicyId)
  const upfrontCost = fuelCost + insurancePremium
  const spendableAfterCommit = Math.max(
    0,
    money - upfrontCost - protectedCareerCash
  )

  const handleCommit = useCallback(() => {
    if (!validation.valid) return
    prepareExpeditionSponsorOffers?.(
      validation.normalized.regionId,
      validation.normalized.tourTypeId,
      validation.normalized.starterPerkId
    )
    startExpedition(validation.normalized)
  }, [prepareExpeditionSponsorOffers, startExpedition, validation])

  const toggleSong = useCallback((songId: string) => {
    setSetlistSongIds(current =>
      toggleBounded(current, songId, MAX_SETLIST_SONGS)
    )
  }, [])

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

  const updateMerchQuantity = useCallback(
    (inventoryKey: string, quantity: number) => {
      setMerch(current => {
        const filtered = current.filter(m => m.inventoryKey !== inventoryKey)
        if (quantity <= 0) return filtered
        return [...filtered, { inventoryKey, quantity }]
      })
    },
    []
  )

  const updateContrabandStacks = useCallback(
    (stashKey: string, instanceId: string | null, stacks: number) => {
      setContraband(current => {
        const filtered = current.filter(c => c.stashKey !== stashKey)
        if (stacks <= 0) return filtered
        return [...filtered, { stashKey, instanceId, stacks }]
      })
    },
    []
  )

  const TAB_CATEGORIES: { id: BuildTabCategory; labelKey: string }[] = [
    {
      id: 'route_performance',
      labelKey: 'ui:expedition.prep.tab.route_performance'
    },
    { id: 'tourbus_cargo', labelKey: 'ui:expedition.prep.tab.tourbus_cargo' },
    {
      id: 'risk_protection',
      labelKey: 'ui:expedition.prep.tab.risk_protection'
    },
    {
      id: 'commercial_contracts',
      labelKey: 'ui:expedition.prep.tab.commercial_contracts'
    }
  ]

  return (
    <div
      className='flex flex-col gap-6'
      data-testid='expedition-tour-prep-loadout'
    >
      {/* 4 Build Categories Navigation Tabs */}
      <div role='tablist' className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
        {TAB_CATEGORIES.map(tab => {
          const isSelected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role='tab'
              id={`tab-${tab.id}`}
              aria-selected={isSelected}
              aria-controls={`panel-${tab.id}`}
              type='button'
              onClick={() => setActiveTab(tab.id)}
              data-testid={`expedition-prep-tab-${tab.id}`}
              className={`min-h-11 px-3 py-2 text-xs font-mono uppercase border transition-colors ${
                isSelected
                  ? 'border-toxic-green bg-toxic-green/20 text-star-white font-bold'
                  : 'border-steel-gray text-ash-gray hover:border-toxic-green'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          )
        })}
      </div>

      {/* Main Layout: Controls Left, Sticky Summary Panel Right */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'>
        <div className='lg:col-span-2 flex flex-col gap-4'>
          {/* CATEGORY 1: Route & Performance */}
          <div
            role='tabpanel'
            id='panel-route_performance'
            aria-labelledby='tab-route_performance'
            hidden={activeTab !== 'route_performance'}
            className='flex flex-col gap-4'
          >
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
                      onClick={() =>
                        selectRoute(tourTypeId, id, () => setTourTypeId(id))
                      }
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
                      onClick={() =>
                        selectRoute(regionId, id, () => setRegionId(id))
                      }
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
                      <strong>
                        {t(`ui:expedition.pressure.${modifierId}`)}
                      </strong>
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
          </div>

          {/* CATEGORY 2: Tourbus & Cargo */}
          <div
            role='tabpanel'
            id='panel-tourbus_cargo'
            aria-labelledby='tab-tourbus_cargo'
            hidden={activeTab !== 'tourbus_cargo'}
            className='flex flex-col gap-4'
          >
            <fieldset className='border border-steel-gray p-3 flex flex-col gap-2'>
              <legend className='text-xs uppercase tracking-widest text-toxic-green px-1'>
                {t('ui:expedition.prep.tourbus')}
              </legend>
              <p className='text-xs text-ash-gray'>
                {t('ui:expedition.prep.tourbusHint')}
              </p>
              <div className='flex flex-wrap gap-2'>
                <button
                  type='button'
                  aria-pressed={activeTourbusAssetId === null}
                  onClick={() => setActiveTourbusAssetId(null)}
                  data-testid='expedition-prep-tourbus-default'
                  className={`min-h-11 px-3 py-2 text-xs font-mono uppercase border transition-colors ${
                    activeTourbusAssetId === null
                      ? 'border-toxic-green bg-toxic-green/20 text-star-white'
                      : 'border-steel-gray text-ash-gray hover:border-toxic-green'
                  }`}
                >
                  {t('ui:expedition.prep.noOwnedTourbus')}
                </button>
                {ownedTourbusAssets.map(asset => {
                  const isSelected = activeTourbusAssetId === asset.id
                  const profile = getExpeditionChassisProfile(asset)
                  const isTierLocked =
                    Math.floor(finiteNumberOr(asset.chassisTier, 1)) > 1 &&
                    !isExpeditionCapabilityUnlocked(
                      career?.unlockedSetIds,
                      'chassis_higher_tier'
                    )
                  return (
                    <button
                      key={asset.id}
                      type='button'
                      disabled={isTierLocked}
                      aria-pressed={isSelected}
                      onClick={() => !isTierLocked && setActiveTourbusAssetId(asset.id)}
                      data-testid={`expedition-prep-tourbus-${asset.id}`}
                      className={`min-h-11 px-3 py-2 text-left text-xs font-mono uppercase border transition-colors ${
                        isTierLocked
                          ? 'border-steel-gray/30 text-steel-gray opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'border-toxic-green bg-toxic-green/20 text-star-white'
                          : 'border-steel-gray text-ash-gray hover:border-toxic-green'
                      }`}
                    >
                      <strong>{asset.id}</strong>
                      <span className='block normal-case text-ash-gray'>
                        Archetype: {profile.archetype} | Cargo Bonus: +
                        {profile.cargoCapacityBonus}
                        {isTierLocked && (
                          <span className='block text-signal-red text-[10px] mt-0.5'>
                            ({t('ui:expedition.prep.reject.CHASSIS_TIER_LOCKED')})
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>

              {activeChassisAsset && (
                <div className='mt-2 p-2 border border-steel-gray/50 text-xs font-mono text-ash-gray'>
                  <span className='text-star-white font-bold block'>
                    {t('ui:expedition.prep.modulesInstalled')}
                  </span>
                  {activeModuleIds.length === 0 ? (
                    <span>{t('ui:expedition.prep.noModulesInstalled')}</span>
                  ) : (
                    <ul className='list-disc list-inside mt-1'>
                      {activeModuleIds.map(modId => (
                        <li key={modId}>{modId}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </fieldset>

            <fieldset className='border border-steel-gray p-3 flex flex-col gap-2'>
              <legend className='text-xs uppercase tracking-widest text-toxic-green px-1'>
                {t('ui:expedition.prep.cargo')}
              </legend>
              <p className='text-xs text-ash-gray'>
                {t('ui:expedition.prep.cargoHint')}
              </p>

              {/* Cargo meter */}
              <div
                role='meter'
                aria-label='Cargo Capacity'
                aria-valuenow={cargoUsage.visibleSlotsUsed}
                aria-valuemin={0}
                aria-valuemax={cargoUsage.visibleCapacity}
                className='p-2 border border-steel-gray bg-void-black flex flex-col gap-1 text-xs font-mono'
              >
                <div className='flex justify-between text-star-white'>
                  <span>
                    {t('ui:expedition.prep.cargoUsage', {
                      used: cargoUsage.visibleSlotsUsed,
                      max: cargoUsage.visibleCapacity,
                      hiddenUsed: cargoUsage.hiddenSlotsUsed,
                      hiddenMax: cargoUsage.hiddenCapacity
                    })}
                  </span>
                </div>
                <div className='w-full h-2 bg-steel-gray/30 overflow-hidden flex'>
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        (cargoUsage.visibleSlotsUsed /
                          Math.max(1, cargoUsage.visibleCapacity)) *
                          100
                      )}%`
                    }}
                    className={`h-full ${
                      cargoUsage.visibleSlotsUsed > cargoUsage.visibleCapacity
                        ? 'bg-blood-red'
                        : 'bg-toxic-green'
                    }`}
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2'>
                <label className='flex flex-col gap-1 text-xs font-mono uppercase text-ash-gray'>
                  {t('ui:expedition.prep.spareParts', { value: spareParts })}
                  <input
                    type='range'
                    min={0}
                    max={10}
                    step={1}
                    value={spareParts}
                    data-testid='expedition-prep-spare-parts'
                    onChange={e => setSpareParts(Number(e.currentTarget.value))}
                  />
                </label>
                <label className='flex flex-col gap-1 text-xs font-mono uppercase text-ash-gray'>
                  {t('ui:expedition.prep.supplies', { value: supplies })}
                  <input
                    type='range'
                    min={0}
                    max={10}
                    step={1}
                    value={supplies}
                    data-testid='expedition-prep-supplies'
                    onChange={e => setSupplies(Number(e.currentTarget.value))}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className='border border-steel-gray p-3 flex flex-col gap-2'>
              <legend className='text-xs uppercase tracking-widest text-toxic-green px-1'>
                {t('ui:expedition.prep.resources')}
              </legend>
              <label className='flex flex-col gap-1 text-xs font-mono uppercase text-ash-gray'>
                {t('ui:expedition.prep.fuelTarget', {
                  value: startingFuelTarget
                })}
                <input
                  type='range'
                  min={Math.ceil(currentFuel)}
                  max={100}
                  step={1}
                  value={startingFuelTarget}
                  data-testid='expedition-prep-fuel-target'
                  onChange={event =>
                    setStartingFuelTarget(Number(event.currentTarget.value))
                  }
                />
              </label>
            </fieldset>
          </div>

          {/* CATEGORY 3: Risk & Protection */}
          <div
            role='tabpanel'
            id='panel-risk_protection'
            aria-labelledby='tab-risk_protection'
            hidden={activeTab !== 'risk_protection'}
            className='flex flex-col gap-4'
          >
            <fieldset className='border border-steel-gray p-3 flex flex-col gap-2'>
              <legend className='text-xs uppercase tracking-widest text-toxic-green px-1'>
                {t('ui:expedition.prep.insurance')}
              </legend>
              <p className='text-xs text-ash-gray'>
                {t('ui:expedition.prep.insuranceHint')}
              </p>
              <div className='flex flex-wrap gap-2'>
                <button
                  type='button'
                  aria-pressed={insurancePolicyId === null}
                  onClick={() => setInsurancePolicyId(null)}
                  data-testid='expedition-prep-insurance-none'
                  className={`min-h-11 px-3 py-2 text-xs font-mono uppercase border transition-colors ${
                    insurancePolicyId === null
                      ? 'border-toxic-green bg-toxic-green/20 text-star-white'
                      : 'border-steel-gray text-ash-gray hover:border-toxic-green'
                  }`}
                >
                  {t('ui:expedition.prep.insuranceNone')}
                </button>
                {availableInsurancePolicyIds.map(policyId => {
                  const policy = EXPEDITION_INSURANCE_POLICIES[policyId]
                  const isSelected = insurancePolicyId === policyId
                  return (
                    <button
                      key={policyId}
                      type='button'
                      aria-pressed={isSelected}
                      onClick={() => setInsurancePolicyId(policyId)}
                      data-testid={`expedition-prep-insurance-${policyId}`}
                      className={`min-h-11 px-3 py-2 text-left text-xs font-mono uppercase border transition-colors ${
                        isSelected
                          ? 'border-toxic-green bg-toxic-green/20 text-star-white'
                          : 'border-steel-gray text-ash-gray hover:border-toxic-green'
                      }`}
                    >
                      <strong>{policyId}</strong>
                      <span className='block normal-case text-ash-gray'>
                        Coverage: {policy.coverage} | Premium:{' '}
                        {formatCurrency(policy.premium, i18n.language)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <fieldset className='border border-steel-gray p-3 flex flex-col gap-2'>
              <legend className='text-xs uppercase tracking-widest text-toxic-green px-1'>
                {t('ui:expedition.prep.contraband')}
              </legend>
              <p className='text-xs text-ash-gray'>
                {t('ui:expedition.prep.contrabandHint')}
              </p>
              {ownedContrabandItems.length === 0 ? (
                <p
                  className='text-xs text-ash-gray'
                  data-testid='expedition-prep-no-contraband'
                >
                  {t('ui:expedition.prep.noContrabandStash')}
                </p>
              ) : (
                <div className='flex flex-col gap-3'>
                  {ownedContrabandItems.map(item => {
                    const currentSelection = contraband.find(
                      c => c.stashKey === item.stashKey
                    )
                    const currentStacks = currentSelection?.stacks ?? 0
                    const contrabandInfo = CONTRABAND_BY_ID.get(item.stashKey)
                    return (
                      <label
                        key={item.stashKey}
                        className='flex flex-col gap-1 text-xs font-mono uppercase text-ash-gray border border-steel-gray/40 p-2'
                      >
                        <div className='flex justify-between text-star-white'>
                          <span>{contrabandInfo?.name ?? item.stashKey}</span>
                          <span>
                            {currentStacks} / {item.ownedStacks} Stacks
                          </span>
                        </div>
                        <input
                          type='range'
                          min={0}
                          max={item.ownedStacks}
                          step={1}
                          value={currentStacks}
                          data-testid={`expedition-prep-contraband-${item.stashKey}`}
                          onChange={e =>
                            updateContrabandStacks(
                              item.stashKey,
                              item.instanceId,
                              Number(e.currentTarget.value)
                            )
                          }
                        />
                      </label>
                    )
                  })}
                </div>
              )}
            </fieldset>

            <fieldset className='border border-steel-gray p-3 flex flex-col gap-2'>
              <legend className='text-xs uppercase tracking-widest text-toxic-green px-1'>
                {t('ui:expedition.prep.protectedCash', {
                  amount: formatCurrency(protectedCareerCash, i18n.language)
                })}
              </legend>
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
              <p className='text-xs text-ash-gray'>
                {t('ui:expedition.prep.protectedCashHint')}
              </p>
            </fieldset>
          </div>

          {/* CATEGORY 4: Commercial & Contracts */}
          <div
            role='tabpanel'
            id='panel-commercial_contracts'
            aria-labelledby='tab-commercial_contracts'
            hidden={activeTab !== 'commercial_contracts'}
            className='flex flex-col gap-4'
          >
            <fieldset className='border border-steel-gray p-3 flex flex-col gap-2'>
              <legend className='text-xs uppercase tracking-widest text-toxic-green px-1'>
                {t('ui:expedition.prep.merch')}
              </legend>
              <p className='text-xs text-ash-gray'>
                {t('ui:expedition.prep.merchHint')}
              </p>
              {ownedMerchItems.length === 0 ? (
                <p
                  className='text-xs text-ash-gray'
                  data-testid='expedition-prep-no-merch'
                >
                  {t('ui:expedition.prep.noMerchInventory')}
                </p>
              ) : (
                <div className='flex flex-col gap-3'>
                  {ownedMerchItems.map(item => {
                    const currentSelection = merch.find(
                      m => m.inventoryKey === item.inventoryKey
                    )
                    const currentQty = currentSelection?.quantity ?? 0
                    return (
                      <label
                        key={item.inventoryKey}
                        className='flex flex-col gap-1 text-xs font-mono uppercase text-ash-gray border border-steel-gray/40 p-2'
                      >
                        <div className='flex justify-between text-star-white'>
                          <span>{item.inventoryKey}</span>
                          <span>
                            {currentQty} / {item.ownedQuantity} Items
                          </span>
                        </div>
                        <input
                          type='range'
                          min={0}
                          max={item.ownedQuantity}
                          step={1}
                          value={currentQty}
                          data-testid={`expedition-prep-merch-${item.inventoryKey}`}
                          onChange={e =>
                            updateMerchQuantity(
                              item.inventoryKey,
                              Number(e.currentTarget.value)
                            )
                          }
                        />
                      </label>
                    )
                  })}
                </div>
              )}
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
                  .filter(offer =>
                    availableSponsorOfferIds.includes(offer.offerId)
                  )
                  .map(offer => {
                    const deal = BRAND_DEALS.find(
                      entry => entry.id === offer.dealId
                    )
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
                  const isBlocked =
                    !isSelected &&
                    (contractTemplateIds.length >=
                      MAX_NATIVE_EXPEDITION_CONTRACTS ||
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
          </div>
        </div>

        {/* Sticky Summary Panel */}
        <div className='lg:col-span-1 lg:sticky lg:top-4'>
          <BuildCommitmentPanel
            preparedMap={preparedMap}
            validation={validation}
            fuelCost={fuelCost}
            insurancePremium={insurancePremium}
            spendableAfterCommit={spendableAfterCommit}
            onCommit={handleCommit}
          />
        </div>
      </div>
    </div>
  )
})
