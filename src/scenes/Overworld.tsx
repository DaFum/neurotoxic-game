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
import { SupplyStopModal } from '../ui/SupplyStopModal'

/**
 * The map navigation scene where players select their next destination.
 */
export const Overworld = () => {
  const { t } = useTranslation(['ui', 'venues'])
  const player = useGameSelector(state => state.player)
  const gameMap = useGameSelector(state => state.gameMap)
  const band = useGameSelector(state => state.band)
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
    updateRivalBand
  } = useGameActions()

  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null)

  useSpawnRivalBand(rivalBand, gameMap, spawnRivalBand)
  useRivalEscalation(rivalBand, player.currentNodeId, updateRivalBand)
  const glitch = useGlitchEffect()

  const {
    hq: { showHQ, openHQ, closeHQ },
    quests: { showQuests, openQuests, questsProps },
    stash: { showStash, openStash, stashProps },
    pirateRadio: {
      showPirateRadio,
      openPirateRadio,
      closePirateRadio,
      triggerBroadcast,
      canBroadcast,
      hasBroadcastedToday,
      PIRATE_RADIO_CONFIG
    },
    merchPress: {
      showMerchPress,
      openMerchPress,
      closeMerchPress,
      triggerPress,
      canPress,
      config: merchPressConfig
    },
    bloodBank: {
      showBloodBank,
      openBloodBank,
      closeBloodBank,
      triggerDonate,
      canDonate,
      canDonateMarrow,
      config: bloodBankConfig,
      marrowConfig
    },
    darkWebLeak: {
      showDarkWebLeak,
      hasLeakedToday,
      openDarkWebLeak,
      closeDarkWebLeak,
      triggerLeak,
      canLeak: canDarkWebLeak,
      DARK_WEB_LEAK_CONFIG
    }
  } = useOverworldModals()
  const [supplyStopInventory, setSupplyStopInventory] = useState<
    import('../types/components').PurchaseItem[] | null
  >(null)

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
    onShowHQ: openHQ,
    onShowSupplyStop: setSupplyStopInventory,
    onStartTravelMinigame: startTravelMinigame
    // dispatch removed as we no longer pass it
  })

  const { isSaving, handleSaveWithDelay } = useOverworldSave(saveGame)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const locationName = translateLocation(t, player.location, player.location)
  const openClinic = useCallback(() => {
    changeScene(GAME_PHASES.CLINIC)
  }, [changeScene])

  const currentNode = gameMap?.nodes[player.currentNodeId]
  const currentLayer = currentNode?.layer || 0

  useAmbientResume()

  return (
    <div
      className={`scene ${glitch} w-full h-full bg-void-black relative overflow-hidden flex flex-col items-center justify-center p-8 ${isTraveling ? 'pointer-events-none' : ''}`}
    >
      <OverworldHeader
        t={t}
        locationName={locationName}
        isTraveling={isTraveling}
      />
      <OverworldHUD player={player} band={band} />
      {/* Radio Widget */}
      <div className='fixed top-2 right-2 sm:top-8 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 pointer-events-auto bg-void-black border border-shadow-black p-2 flex items-center gap-2 rounded shadow-[0_0_10px_var(--color-toxic-green-20)] scale-100 origin-top-right sm:origin-center'>
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
        openStash={openStash}
        openQuests={openQuests}
        openPirateRadio={openPirateRadio}
        openMerchPress={openMerchPress}
        openBloodBank={openBloodBank}
        openClinic={openClinic}
        openDarkWebLeak={openDarkWebLeak}
        openHQ={openHQ}
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

      {supplyStopInventory && (
        <SupplyStopModal
          inventory={supplyStopInventory}
          onClose={() => setSupplyStopInventory(null)}
        />
      )}
      <OverworldModals
        showHQ={showHQ}
        closeHQ={closeHQ}
        showQuests={showQuests}
        questsProps={questsProps}
        showStash={showStash}
        stashProps={stashProps}
        showPirateRadio={showPirateRadio}
        closePirateRadio={closePirateRadio}
        triggerBroadcast={triggerBroadcast}
        canBroadcast={canBroadcast}
        hasBroadcastedToday={hasBroadcastedToday}
        PIRATE_RADIO_CONFIG={PIRATE_RADIO_CONFIG}
        showMerchPress={showMerchPress}
        closeMerchPress={closeMerchPress}
        triggerPress={triggerPress}
        canPress={canPress}
        merchPressConfig={merchPressConfig}
        showBloodBank={showBloodBank}
        closeBloodBank={closeBloodBank}
        triggerDonate={triggerDonate}
        canDonate={canDonate}
        canDonateMarrow={canDonateMarrow}
        bloodBankConfig={bloodBankConfig}
        marrowConfig={marrowConfig}
        showDarkWebLeak={showDarkWebLeak}
        closeDarkWebLeak={closeDarkWebLeak}
        triggerLeak={triggerLeak}
        canDarkWebLeak={canDarkWebLeak}
        hasLeakedToday={hasLeakedToday}
        DARK_WEB_LEAK_CONFIG={DARK_WEB_LEAK_CONFIG}
      />
    </div>
  )
}
