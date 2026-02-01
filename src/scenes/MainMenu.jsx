import React from 'react'
import { useGameState } from '../context/GameState'
import { motion } from 'framer-motion'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen'
import { GlitchButton } from '../ui/GlitchButton'
import { audioManager } from '../utils/AudioManager'
import { UpgradeMenu } from '../ui/UpgradeMenu'

/**
 * The main menu scene component.
 * @returns {JSX.Element} The rendered menu.
 */
export const MainMenu = () => {
  const {
    changeScene,
    loadGame,
    addToast,
    player,
    updatePlayer,
    band,
    updateBand
  } = useGameState()
  const [showUpgrades, setShowUpgrades] = React.useState(false)

  React.useEffect(() => {
    audioManager.startAmbient()
  }, [])

  /**
   * Handles loading a saved game.
   */
  const handleLoad = () => {
    if (loadGame()) {
      changeScene('OVERWORLD')
    } else {
      addToast('No save game found!', 'error')
    }
  }

  const handleBuyUpgrade = upgrade => {
    // Guard: Already owned
    if (player.van.upgrades.includes(upgrade.id)) {
      addToast('Upgrade already owned!', 'error')
      return
    }

    if (player.fame >= upgrade.cost) {
      const playerUpdates = {
        fame: player.fame - upgrade.cost,
        van: { ...player.van, upgrades: [...player.van.upgrades, upgrade.id] }
      }
      const bandUpdates = {}

      if (upgrade.effect) {
        const eff = upgrade.effect
        if (eff.type === 'stat_modifier') {
          if (eff.stat === 'breakdown_chance') {
            playerUpdates.van.breakdownChance = Math.max(
              0,
              (player.van.breakdownChance || 0.05) + eff.value
            )
          } else if (eff.stat === 'inventory_slots') {
            bandUpdates.inventorySlots = Math.max(
              0,
              (band.inventorySlots || 0) + eff.value
            )
          } else if (eff.stat === 'guitar_difficulty') {
            bandUpdates.performance = {
              ...band.performance,
              guitarDifficulty: Math.max(
                0,
                (band.performance?.guitarDifficulty || 1.0) + eff.value
              )
            }
          } else if (eff.stat === 'drum_score_multiplier') {
            bandUpdates.performance = {
              ...band.performance,
              drumMultiplier: Math.max(
                0,
                (band.performance?.drumMultiplier || 1.0) + eff.value
              )
            }
          } else if (eff.stat === 'crowd_decay') {
            bandUpdates.performance = {
              ...band.performance,
              crowdDecay: Math.max(
                0,
                (band.performance?.crowdDecay || 1.0) + eff.value
              )
            }
          }
        } else if (eff.type === 'start_bonus' && eff.stat === 'fame') {
          playerUpdates.fame += eff.value
        } else if (eff.type === 'passive') {
          if (eff.effect === 'harmony_regen_travel') {
            bandUpdates.harmonyRegenTravel = true
          } else if (eff.effect === 'passive_followers') {
            playerUpdates.passiveFollowers =
              (player.passiveFollowers || 0) + (eff.value || 0)
          }
        }
      }

      updatePlayer(playerUpdates)
      if (Object.keys(bandUpdates).length > 0) {
        updateBand(bandUpdates)
      }

      addToast(`Purchased ${upgrade.name}!`, 'success')
    } else {
      addToast('Not enough Fame!', 'error')
    }
  }

  return (
    <div className='flex flex-col items-center justify-center h-full w-full bg-black z-50 relative overflow-hidden'>
      {/* Dynamic Background */}
      <div
        className='absolute inset-0 z-0 opacity-40 bg-cover bg-center pointer-events-none'
        style={{
          backgroundImage: `url("${getGenImageUrl(IMG_PROMPTS.MAIN_MENU_BG)}")`
        }}
      />
      <div className='absolute inset-0 z-0 bg-gradient-to-b from-black/0 to-black/90 pointer-events-none' />

      {showUpgrades && (
        <UpgradeMenu
          onClose={() => setShowUpgrades(false)}
          player={player}
          onBuyUpgrade={handleBuyUpgrade}
        />
      )}

      <div className='relative z-10 flex flex-col items-center'>
        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'mirror' }}
          className="text-6xl md:text-9xl text-center text-transparent bg-clip-text bg-gradient-to-b from-[var(--toxic-green)] to-[var(--void-black)] font-['Metal_Mania'] glitch-text mb-8"
          style={{ WebkitTextStroke: '2px var(--toxic-green)' }}
        >
          NEUROTOXIC
        </motion.h1>
        <h2 className='text-2xl text-[var(--toxic-green)] mb-12 font-[Courier_New] tracking-widest uppercase text-center'>
          Grind The Void v3.0
        </h2>

        <div className='flex flex-col gap-4'>
          <GlitchButton
            onClick={() => changeScene('OVERWORLD')}
            className='relative z-20'
          >
            Start Tour
          </GlitchButton>

          <GlitchButton
            onClick={handleLoad}
            className='relative z-20 border-[var(--blood-red)] text-[var(--blood-red)] hover:bg-[var(--blood-red)] hover:shadow-[4px_4px_0px_var(--toxic-green)]'
          >
            Load Game
          </GlitchButton>

          <GlitchButton
            onClick={() => setShowUpgrades(true)}
            className='relative z-20 border-[var(--warning-yellow)] text-[var(--warning-yellow)] hover:bg-[var(--warning-yellow)] hover:shadow-[4px_4px_0px_var(--toxic-green)]'
          >
            Band HQ
          </GlitchButton>
        </div>

        <div className='flex gap-4 mt-8'>
          <button
            onClick={() => changeScene('SETTINGS')}
            className='text-gray-500 hover:text-[var(--toxic-green)] text-sm'
          >
            SETTINGS
          </button>
          <button
            onClick={() => changeScene('CREDITS')}
            className='text-gray-500 hover:text-[var(--toxic-green)] text-sm'
          >
            CREDITS
          </button>
        </div>
      </div>

      <div className='absolute bottom-8 text-(--ash-gray) text-xs font-mono z-10'>
        © 2026 NEUROTOXIC // DEATH GRINDCORE FROM STENDAL
      </div>
    </div>
  )
}
