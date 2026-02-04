import React from 'react'
import { useGameState } from '../context/GameState'
import { motion } from 'framer-motion'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen'
import { GlitchButton } from '../ui/GlitchButton'
import { audioManager } from '../utils/AudioManager'
import { UpgradeMenu } from '../ui/UpgradeMenu'
import { usePurchaseLogic } from '../hooks/usePurchaseLogic'

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
    updateBand,
    settings
  } = useGameState()
  const [showUpgrades, setShowUpgrades] = React.useState(false)

  const { handleBuy } = usePurchaseLogic({
    player,
    band,
    updatePlayer,
    updateBand,
    addToast
  })

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

  return (
    <div className='flex flex-col items-center justify-center h-full w-full bg-(--void-black) z-50 relative overflow-hidden'>
      {settings?.crtEnabled && (
        <div className='crt-overlay pointer-events-none fixed inset-0 z-50 mix-blend-overlay opacity-50' />
      )}
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
          onBuyUpgrade={handleBuy}
        />
      )}

      <div className='relative z-10 flex flex-col items-center'>
        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'mirror' }}
          className="text-6xl md:text-9xl text-center text-transparent bg-clip-text bg-gradient-to-b from-(--toxic-green) to-(--void-black) font-['Metal_Mania'] glitch-text mb-8"
          style={{ WebkitTextStroke: '2px var(--toxic-green)' }}
        >
          NEUROTOXIC
        </motion.h1>
        <h2 className='text-2xl text-(--toxic-green) mb-12 font-[Courier_New] tracking-widest uppercase text-center'>
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
            className='relative z-20 border-(--blood-red) text-(--blood-red) hover:bg-(--blood-red) hover:shadow-[4px_4px_0px_var(--toxic-green)]'
          >
            Load Game
          </GlitchButton>

          <GlitchButton
            onClick={() => setShowUpgrades(true)}
            className='relative z-20 border-(--warning-yellow) text-(--warning-yellow) hover:bg-(--warning-yellow) hover:shadow-[4px_4px_0px_var(--toxic-green)]'
          >
            Band HQ
          </GlitchButton>
        </div>

        <div className='flex gap-4 mt-8'>
          <GlitchButton onClick={() => changeScene('SETTINGS')}>
            SETTINGS
          </GlitchButton>
          <GlitchButton onClick={() => changeScene('CREDITS')}>
            CREDITS
          </GlitchButton>
        </div>
      </div>

      <div className='absolute bottom-8 text-(--ash-gray) text-xs font-mono z-10'>
        © 2026 NEUROTOXIC // DEATH GRINDCORE FROM STENDAL
      </div>
    </div>
  )
}
