import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { AnimatedDivider, AnimatedSubtitle } from '../../ui/shared'
import { VoidSkullIcon } from '../../ui/shared/Icons'

type GameOverHeaderProps = {
  /** Victory variant shown after completing the FINALE gig. */
  victory?: boolean
}

/**
 * Displays the game-over headline and summary section heading. The `victory`
 * variant swaps the blood-red defeat styling for toxic-green tour-complete
 * copy when the run ended by finishing the FINALE gig.
 */
export const GameOverHeader = React.memo(
  ({ victory = false }: GameOverHeaderProps) => {
    const { t } = useTranslation(['ui'])
    const title = victory
      ? t('ui:gameOver.tourComplete')
      : t('ui:gameOver.soldOut')
    const subtitle = victory
      ? t('ui:tour.conqueredTheVoid')
      : t('ui:tour.endedPrematurely')
    const accentText = victory ? 'text-toxic-green' : 'text-blood-red'
    const accentShadow = victory
      ? 'drop-shadow-[0_0_20px_var(--color-toxic-green)]'
      : 'drop-shadow-[0_0_20px_var(--color-blood-red)]'
    const dividerVia = victory ? 'via-toxic-green' : 'via-blood-red'

    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className='relative z-10 mb-4'
          aria-hidden='true'
        >
          <VoidSkullIcon
            className={`w-24 h-24 ${accentText} ${accentShadow}`}
          />
        </motion.div>

        <h1
          data-text={title}
          className={`title-ghost text-8xl md:text-9xl ${accentText} font-display mb-2 animate-doom-zoom animate-chromatic-flicker relative z-10`}
        >
          {title}
        </h1>

        {/* jscpd:ignore-start */}
        <AnimatedDivider
          width='16rem'
          transition={{ duration: 0.8, delay: 0.8 }}
          className={`bg-gradient-to-r from-transparent ${dividerVia} to-transparent mb-3`}
        />

        <AnimatedSubtitle
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className='text-lg text-ash-gray font-mono mb-10 tracking-[0.3em] relative z-10'
        >
          {subtitle}
        </AnimatedSubtitle>
        {/* jscpd:ignore-end */}
      </>
    )
  }
)

GameOverHeader.displayName = 'GameOverHeader'
