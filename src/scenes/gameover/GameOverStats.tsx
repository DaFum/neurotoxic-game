/*
 * (#1) Actual Updates: Extracted statistics container and rows from GameOver.tsx to a standalone file. Added strict PropTypes and nullish coalescing to GameOverStats.
 * (#2) Next Steps: Continue extracting other sub-components from GameOver.tsx.

 */
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import PropTypes from 'prop-types'

export const GameOverStats = ({ player }) => {
  const { t } = useTranslation(['ui'])

  const statRows = [
    { label: t('ui:stats.daysSurvived'), value: player?.day ?? 0 },
    { label: t('ui:stats.fameReached'), value: player?.fame ?? 0 },
    { label: t('ui:stats.totalTravels'), value: player?.totalTravels ?? 0 },
    { label: t('ui:stats.totalScore'), value: player?.score ?? 0 }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.5 }}
      className='border-2 border-blood-red/60 p-6 w-full max-w-lg mb-8 bg-void-black/80 backdrop-blur-sm relative z-10 shadow-[0_0_30px_var(--color-blood-red-20)]'
    >
      <div className='text-[10px] text-blood-red tracking-widest mb-4 border-b border-blood-red/30 pb-2'>
        {t('ui:gameOver.finalStatistics')}
      </div>
      <div className='space-y-3 font-mono'>
        {statRows.map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4 + i * 0.15 }}
            className='flex justify-between items-center'
          >
            <span className='text-xs text-ash-gray tracking-wider'>
              {row.label}
            </span>
            <span className='text-lg text-star-white font-bold tabular-nums'>
              {row.value}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

GameOverStats.propTypes = {
  player: PropTypes.shape({
    day: PropTypes.number,
    fame: PropTypes.number,
    totalTravels: PropTypes.number,
    score: PropTypes.number
  })
}
