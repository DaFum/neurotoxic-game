import { useState, useCallback } from 'react'
import type { MapNode } from '../types'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../context/GameState'
import { useTravelLogic } from '../hooks/useTravelLogic'
import { GAME_PHASES } from '../context/gameConstants'
import {
  useGlitchEffect,
  useAmbientResume,
  useOverworldSave,
  useSpawnRivalBand,
  useRivalEscalation,
  useOverworldModals
} from '../hooks/overworld'

import { OverworldHeader } from '../ui/overworld/OverworldHeader'
import { OverworldMenu } from '../ui/overworld/OverworldMenu'
import { OverworldHUD } from '../ui/overworld/OverworldHUD'
import { OverworldPhoneResources } from '../ui/overworld/OverworldPhoneResources'
import { readVanCondition } from '../utils/gameState'
import { ToggleRadio } from '../components/ToggleRadio'
import { EventLog } from '../ui/overworld/EventLog'
import { translateLocation } from '../utils/locationI18n'
import { OverworldMap } from '../components/overworld'
import { OverworldModals } from '../components/overworld/OverworldModals'
import { getExpeditionNodeFogByNodeId } from '../domain/expedition/nodeFog'
import {
  getExpeditionOverlaySubtypeByNodeId,
  getExpeditionTravelMap
} from '../domain/expedition/routeOverlay'
import { getExpeditionNodeBookingLock } from '../domain/expedition/fame'
import { getExpeditionProtectedCash } from '../domain/expedition/loadout'
import { getEffectiveExpeditionRules } from '../domain/expedition/effectiveRules'
import { ExpeditionStatusStrip } from '../ui/expedition/ExpeditionStatusStrip'
import { ExpeditionCrewStatus } from '../ui/expedition/ExpeditionCrewStatus'
import { ExpeditionRunControls } from '../ui/expedition/ExpeditionRunControls'

/**
 * The map navigation scene where players select their next destination.
 */
export const Overworld = () => {
  const { t, i18n } = useTranslation(['ui', 'venues'])
  const player = useGameSelector(state => state.player)
  const gameMap = useGameSelector(state => state.gameMap)
  // The base map plus any overlay edge the run may travel; `gameMap` itself
  // outside a run, so the Career readout is unchanged.
  const travelMap = useGameSelector(getExpeditionTravelMap)
  // Icon and label only; `travelMap` keeps each node's base type for travel.
  const overlaySubtypeByNodeId = useGameSelector(
    getExpeditionOverlaySubtypeByNodeId
  )
  const band = useGameSelector(state => state.band)
  const assets = useGameSelector(state => state.assets)
  // `null` outside a run, which keeps the Career map readout unchanged.
  const expeditionFogByNodeId = useGameSelector(getExpeditionNodeFogByNodeId)
  const liabilities = useGameSelector(state => state.liabilities)
  const social = useGameSelector(state => state.social)
  const reputationByRegion = useGameSelector(state => state.reputationByRegion)
  const venueBlacklist = useGameSelector(state => state.venueBlacklist)
  const activeStoryFlags = useGameSelector(state => state.activeStoryFlags)
  const rivalBand = useGameSelector(state => state.rivalBand)
  const expeditionStatus = useGameSelector(state => state.expedition?.status)
  const expeditionDraftPending = useGameSelector(
    state => state.expedition?.pendingRunDraftOffer != null
  )
  // Neutral outside a run; a number, so the selector stays stable.
  const expeditionFuelMultiplier = useGameSelector(state =>
    state.expedition?.status === 'active'
      ? getEffectiveExpeditionRules(state).numeric.fuelConsumptionMultiplier
      : 1
  )
  const expeditionProtectedCash = useGameSelector(getExpeditionProtectedCash)
  // The Fame a Festival booking needs, or `null` when it is open (always
  // `null` outside a run). A number, so the selector stays stable.
  const festivalBookingMinimumFame = useGameSelector(
    state =>
      getExpeditionNodeBookingLock(state, 'FESTIVAL')?.minimumFame ?? null
  )
  const {
    startGig,
    updatePlayer,
    triggerEvent,
    saveGame,
    updateBand,
    addToast,
    advanceDay,
    changeScene,
    startTravelMinigame,
    spawnRivalBand,
    updateRivalBand
  } = useGameActions()

  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null)

  useSpawnRivalBand(rivalBand, gameMap, spawnRivalBand)
  useRivalEscalation(rivalBand, player.currentNodeId, updateRivalBand)
  const glitch = useGlitchEffect()

  const modals = useOverworldModals()

  const {
    isTraveling,
    pendingTravelNode,
    isConnected,
    getNodeVisibility,
    handleTravel,
    handleRefuel,
    handleRepair,
    handleRestInVan
  } = useTravelLogic({
    player,
    band,
    assets,
    liabilities,
    social,
    gameMap: travelMap,
    reputationByRegion,
    venueBlacklist,
    expeditionStatus,
    expeditionDraftPending,
    expeditionFuelMultiplier,
    expeditionProtectedCash,
    updatePlayer,
    updateBand,
    saveGame,
    advanceDay,
    triggerEvent,
    startGig,
    addToast,
    changeScene,
    onShowHQ: modals.hq.openHQ,
    onShowSupplyStop: modals.supplyStop.openSupplyStop,
    onStartTravelMinigame: startTravelMinigame
  })

  const { isSaving, handleSaveWithDelay } = useOverworldSave(saveGame)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const locationName = translateLocation(t, player.location, player.location)
  const openClinic = useCallback(() => {
    changeScene(GAME_PHASES.CLINIC)
  }, [changeScene])
  const openAssets = useCallback(() => {
    changeScene(GAME_PHASES.ASSETS)
  }, [changeScene])

  const currentNode = gameMap?.nodes[player.currentNodeId]
  const currentLayer = Number.isFinite(currentNode?.layer)
    ? currentNode!.layer
    : 0

  useAmbientResume()

  return (
    <div
      className={`scene ${expeditionStatus === 'active' ? 'scene--expedition' : ''} ${glitch} w-full h-full bg-void-black relative overflow-hidden flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 ${isTraveling ? 'pointer-events-none' : ''}`}
    >
      <OverworldHeader
        t={t}
        locationName={locationName}
        isTraveling={isTraveling}
      />
      {expeditionStatus !== 'active' && (
        <OverworldPhoneResources
          money={player.money}
          fuel={player.van?.fuel}
          condition={readVanCondition(player.van?.condition)}
          language={i18n.language}
          t={t}
        />
      )}
      <OverworldHUD
        player={player}
        band={band}
        expeditionActive={expeditionStatus === 'active'}
      />
      {/* Radio Widget */}
      <div className='fixed top-2 right-2 sm:top-8 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-(--z-overlay) pointer-events-auto bg-void-black border-2 border-toxic-green p-2 flex items-center gap-2 shadow-[0_0_10px_var(--color-toxic-green-20)] scale-100 origin-top-right sm:origin-center'>
        <div className='w-2 h-2 rounded-full bg-blood-red animate-pulse' />
        <span className='text-xs text-ash-gray font-mono'>
          {t('ui:overworld.radio_station', { defaultValue: 'FM 66.6' })}
        </span>
        <ToggleRadio />
      </div>

      <OverworldMenu
        t={t}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        isTraveling={isTraveling}
        vanFuel={player.van?.fuel}
        vanCondition={player.van?.condition}
        isSaving={isSaving}
        openStash={modals.stash.openStash}
        openQuests={modals.quests.openQuests}
        openPirateRadio={modals.pirateRadio.openPirateRadio}
        openMerchPress={modals.merchPress.openMerchPress}
        openBloodBank={modals.bloodBank.openBloodBank}
        openClinic={openClinic}
        openDarkWebLeak={modals.darkWebLeak.openDarkWebLeak}
        openVoidSermon={modals.voidSermon.openVoidSermon}
        openCultIndoctrination={
          modals.cultIndoctrination.openCultIndoctrination
        }
        openHQ={modals.hq.openHQ}
        openAssets={openAssets}
        handleRefuel={handleRefuel}
        handleRepair={handleRepair}
        handleRestInVan={handleRestInVan}
        handleSaveWithDelay={handleSaveWithDelay}
      />

      <OverworldMap
        t={t}
        gameMap={travelMap}
        overlaySubtypeByNodeId={overlaySubtypeByNodeId}
        player={player}
        band={band}
        rivalBand={rivalBand}
        currentLayer={currentLayer}
        isTraveling={isTraveling}
        pendingTravelNode={pendingTravelNode}
        getNodeVisibility={getNodeVisibility}
        isConnected={isConnected}
        handleTravel={handleTravel}
        setHoveredNode={setHoveredNode}
        hoveredNode={hoveredNode}
        currentNode={currentNode ?? null}
        activeStoryFlags={activeStoryFlags}
        expeditionFogByNodeId={expeditionFogByNodeId}
        festivalBookingMinimumFame={festivalBookingMinimumFame}
      />

      <ExpeditionStatusStrip />
      <ExpeditionCrewStatus />

      <ExpeditionRunControls />

      <EventLog t={t} day={player.day} locationId={player.location} />

      <OverworldModals modals={modals} />
    </div>
  )
}
