import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import { useTravelLogic } from '../hooks/useTravelLogic'
import { useBandHQModal } from '../hooks/useBandHQModal'
import { useQuestsModal } from '../hooks/useQuestsModal'
import { useContrabandStash } from '../hooks/useContrabandStash'
import { usePirateRadio } from '../hooks/usePirateRadio'
import { useMerchPress } from '../hooks/useMerchPress'
import { useBloodBank } from '../hooks/useBloodBank'
import { useDarkWebLeak } from '../hooks/useDarkWebLeak'

import { OverworldHeader } from '../ui/overworld/OverworldHeader'
import { OverworldMenu } from '../ui/overworld/OverworldMenu'
import { OverworldHUD } from '../ui/overworld/OverworldHUD'
import { ToggleRadio } from '../components/ToggleRadio'
import { EventLog } from '../ui/overworld/EventLog'
import { audioManager } from '../utils/AudioManager'
import { translateLocation } from '../utils/locationI18n'
import { OverworldMap } from '../components/overworld'

/**
 * The map navigation scene where players select their next destination.
 */
export const Overworld = () => {
  const { t } = useTranslation(['ui', 'venues'])
  const {
    startGig,
    player,
    updatePlayer,
    triggerEvent,
    saveGame,
    gameMap,
    hasUpgrade,
    updateBand,
    band,
    reputationByRegion,
    venueBlacklist,
    addToast,
    advanceDay,
    changeScene,
    startTravelMinigame,
    activeStoryFlags
  } = useGameState()

  const [hoveredNode, setHoveredNode] = useState(null)

  const [glitch, setGlitch] = useState('')
  useEffect(() => {
    const TYPES = ['glitch-on', 'g-hue', 'g-pixel']
    let timeoutId: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      if (Math.random() < 0.22) {
        const glitchType = TYPES[Math.floor(Math.random() * TYPES.length)]
        setGlitch(glitchType)
        timeoutId = setTimeout(() => setGlitch(''), 160 + Math.random() * 120)
      }
    }, 4000)
    return () => {
      clearInterval(id)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const { showHQ, openHQ, closeHQ } = useBandHQModal()
  const { showQuests, openQuests, questsProps } = useQuestsModal()
  const { showStash, openStash, stashProps } = useContrabandStash()
  const {
    showPirateRadio,
    openPirateRadio,
    closePirateRadio,
    triggerBroadcast,
    canBroadcast,
    hasBroadcastedToday,
    PIRATE_RADIO_CONFIG
  } = usePirateRadio()

  const {
    showMerchPress,
    openMerchPress,
    closeMerchPress,
    triggerPress,
    canPress,
    config: merchPressConfig
  } = useMerchPress()

  const {
    showBloodBank,
    openBloodBank,
    closeBloodBank,
    triggerDonate,
    canDonate,
    config: bloodBankConfig
  } = useBloodBank()

  const {
    showDarkWebLeak,
    hasLeakedToday,
    openDarkWebLeak,
    closeDarkWebLeak,
    triggerLeak,
    canLeak: canDarkWebLeak,
    DARK_WEB_LEAK_CONFIG
  } = useDarkWebLeak()

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
    gameMap,
    reputationByRegion,
    venueBlacklist,
    updatePlayer,
    updateBand,
    saveGame,
    advanceDay,
    triggerEvent,
    startGig,
    hasUpgrade,
    addToast,
    changeScene,
    onShowHQ: openHQ,
    onStartTravelMinigame: startTravelMinigame
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const locationName = translateLocation(t, player.location, player.location)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const handleSaveWithDelay = useCallback(() => {
    if (isSaving) return
    setIsSaving(true)
    setTimeout(() => {
      if (isMountedRef.current) {
        saveGame()
        setIsSaving(false)
      }
    }, 500)
  }, [isSaving, saveGame])

  const currentNode = gameMap?.nodes[player.currentNodeId]
  const currentLayer = currentNode?.layer || 0

  // Resume ambient on mount and retry once on startup failure.
  useEffect(() => {
    let cancelled = false
    let retryTimeoutId = null

    const attemptResume = async (attempt = 0) => {
      const started = await audioManager.resumeMusic().catch(() => false)
      if (!started && !cancelled && attempt < 1) {
        retryTimeoutId = setTimeout(() => {
          void attemptResume(attempt + 1)
        }, 1200)
      }
    }

    void attemptResume()

    return () => {
      cancelled = true
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId)
      }
    }
  }, [])

  return (
    <div
      className={`scene ${glitch} w-full h-full bg-void-black relative overflow-hidden flex flex-col items-center justify-center p-8 ${isTraveling ? 'pointer-events-none' : ''}`}
    >
      {useGameState()?.gameState?.settings?.crtEnabled && <><div className="noise" /><div className="crt" /><div className="scan" /></>}
      <OverworldHeader
        t={t}
        locationName={locationName}
        isTraveling={isTraveling}
      />
      <OverworldHUD player={player} band={band} />
            {/* Radio Widget */}
      <div className='fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto bg-void-black border border-shadow-black p-2 flex items-center gap-2 rounded shadow-[0_0_10px_var(--color-toxic-green-20)]'>
        <div className='w-2 h-2 rounded-full bg-blood-red animate-pulse' />
        <span className='text-xs text-ash-gray font-mono'>FM 66.6</span>
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
        currentLayer={currentLayer}
        isTraveling={isTraveling}
        pendingTravelNode={pendingTravelNode}
        getNodeVisibility={getNodeVisibility}
        isConnected={isConnected}
        handleTravel={handleTravel}
        setHoveredNode={setHoveredNode}
        hoveredNode={hoveredNode}
        currentNode={currentNode}
        travelTarget={travelTarget}
        travelCompletedRef={travelCompletedRef}
        onTravelComplete={onTravelComplete}
        activeStoryFlags={activeStoryFlags}
      />

      <EventLog t={t} day={player.day} locationName={locationName} />

      {showHQ && <BandHQ onClose={closeHQ} />}
      {showQuests && <QuestsModal {...questsProps} />}
      {showStash && <ContrabandStash {...stashProps} />}
      {showPirateRadio && (
        <PirateRadioModal
          onClose={closePirateRadio}
          onBroadcast={triggerBroadcast}
          canBroadcast={canBroadcast}
          hasBroadcastedToday={hasBroadcastedToday}
          config={PIRATE_RADIO_CONFIG}
        />
      )}
      {showMerchPress && (
        <MerchPressModal
          onClose={closeMerchPress}
          onPress={triggerPress}
          canPress={canPress}
          config={merchPressConfig}
        />
      )}
      {showBloodBank && (
        <BloodBankModal
          onClose={closeBloodBank}
          onDonate={triggerDonate}
          canDonate={canDonate}
          config={bloodBankConfig}
        />
      )}
      {showDarkWebLeak && (
        <DarkWebLeakModal
          onCancel={closeDarkWebLeak}
          onConfirm={triggerLeak}
          canLeak={canDarkWebLeak}
          hasLeakedToday={hasLeakedToday}
          config={DARK_WEB_LEAK_CONFIG}
        />
      )}

    </div>
  )
}

export default Overworld
