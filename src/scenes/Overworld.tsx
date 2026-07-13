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
import { ToggleRadio } from '../components/ToggleRadio'
import { EventLog } from '../ui/overworld/EventLog'
import { translateLocation } from '../utils/locationI18n'
import { OverworldMap } from '../components/overworld'
import { OverworldModals } from '../components/overworld/OverworldModals'

/**
 * The map navigation scene where players select their next destination.
 */
export const Overworld = () => {
  const { t } = useTranslation(['ui', 'venues'])
  const player = useGameSelector(state => state.player)
  const gameMap = useGameSelector(state => state.gameMap)
  const band = useGameSelector(state => state.band)
  const assets = useGameSelector(state => state.assets)
  const liabilities = useGameSelector(state => state.liabilities)
  const social = useGameSelector(state => state.social)
  const reputationByRegion = useGameSelector(state => state.reputationByRegion)
  const venueBlacklist = useGameSelector(state => state.venueBlacklist)
  const activeStoryFlags = useGameSelector(state => state.activeStoryFlags)
  const rivalBand = useGameSelector(state => state.rivalBand)
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
    updateRivalBand,
    moveRivalBand,
    checkRivalEncounter,
    applyQuestEvent
  } = useGameActions()

  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null)

  useSpawnRivalBand(rivalBand, gameMap, spawnRivalBand)
  useRivalEscalation(rivalBand, player.currentNodeId, updateRivalBand)
  const glitch = useGlitchEffect()

  const modals = useOverworldModals()

  const {
    isTraveling,
    travelTarget,
    pendingTravelNode,
    isConnected,
    getNodeVisibility,
    handleTravel,
    handleRefuel,
    handleRepair,
    onTravelComplete,
    travelCompletedRef
  } = useTravelLogic({
    player,
    band,
    assets,
    liabilities,
    social,
    gameMap,
    reputationByRegion,
    venueBlacklist,
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
    onStartTravelMinigame: startTravelMinigame,
    moveRivalBand,
    checkRivalEncounter,
    applyQuestEvent
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
      className={`scene ${glitch} w-full h-full bg-void-black relative overflow-hidden flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 ${isTraveling ? 'pointer-events-none' : ''}`}
    >
      <OverworldHeader
        t={t}
        locationName={locationName}
        isTraveling={isTraveling}
      />
      <OverworldHUD player={player} band={band} />
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
        openHQ={modals.hq.openHQ}
        openAssets={openAssets}
        handleRefuel={handleRefuel}
        handleRepair={handleRepair}
        handleSaveWithDelay={handleSaveWithDelay}
      />

      <OverworldMap
        t={t}
        gameMap={gameMap}
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
        travelTarget={travelTarget}
        travelCompletedRef={travelCompletedRef}
        onTravelComplete={onTravelComplete}
        activeStoryFlags={activeStoryFlags}
      />

      <EventLog t={t} day={player.day} locationId={player.location} />

      <OverworldModals modals={modals} />
    </div>
  )
}
