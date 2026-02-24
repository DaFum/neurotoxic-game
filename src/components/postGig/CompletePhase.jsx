import PropTypes from 'prop-types'
import { motion } from 'framer-motion'

export const CompletePhase = ({ result, onContinue, onSpinStory, player, social }) => {
  const hasPR = player.hqUpgrades?.includes('pr_manager_contract')
  const isHighControversy = (social?.controversyLevel || 0) > 50

  return (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className='text-center py-4'
  >
    <motion.h3
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
      className={`text-4xl font-[Metal_Mania] mb-4 ${
        result.success
          ? 'text-(--toxic-green) drop-shadow-[0_0_20px_var(--toxic-green)] animate-neon-flicker'
          : 'text-(--blood-red)'
      }`}
    >
      {result.success ? 'VIRAL HIT!' : 'FLOPOCOLYPSE'}
    </motion.h3>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className='mb-6 text-(--ash-gray) font-mono max-w-md mx-auto'
    >
      {result.message}
    </motion.p>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className={`text-3xl font-bold mb-8 tabular-nums font-mono ${
        result.totalFollowers > 0
          ? 'text-(--toxic-green)'
          : 'text-(--blood-red)'
      }`}
    >
      {result.totalFollowers > 0 ? '+' : ''}
      {result.totalFollowers} Followers
      <div className='text-sm text-(--ash-gray)/60 mt-1 font-normal tracking-wider'>
        {result.platform}
      </div>
    </motion.div>

    {/* Side Effects Summary */}
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8 }}
      className='mb-8 flex flex-col items-center gap-2 font-mono text-sm'
    >
      {result.moneyChange ? (
        <div className={result.moneyChange > 0 ? 'text-(--toxic-green)' : 'text-(--blood-red)'}>
          💰 {result.moneyChange > 0 ? '+' : ''}{result.moneyChange}€
        </div>
      ) : null}

      {result.harmonyChange ? (
        <div className={result.harmonyChange > 0 ? 'text-(--toxic-green)' : 'text-(--blood-red)'}>
          🎸 Harmony {result.harmonyChange > 0 ? '+' : ''}{result.harmonyChange}
        </div>
      ) : null}

      {result.controversyChange ? (
         <div className={result.controversyChange > 0 ? 'text-(--blood-red)' : 'text-(--toxic-green)'}>
           {result.controversyChange > 0 ? '⚠️' : '🛡️'} Controversy {result.controversyChange > 0 ? '+' : ''}{result.controversyChange}
         </div>
      ) : null}

      {result.loyaltyChange ? (
         <div className={result.loyaltyChange > 0 ? 'text-(--toxic-green)' : 'text-(--blood-red)'}>
           🛡️ Loyalty {result.loyaltyChange > 0 ? '+' : ''}{result.loyaltyChange}
         </div>
      ) : null}

      {(result.staminaChange || result.moodChange) ? (
         <div className='text-(--ash-gray)'>
            👥 {result.targetMember ? `${result.targetMember} Affected` : 'Band Affected'}
         </div>
      ) : null}
    </motion.div>

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.9 }}
      className="flex flex-col gap-4 items-center"
    >
      {hasPR && isHighControversy && (
        <button
          onClick={onSpinStory}
          className='bg-(--blood-red) text-(--star-white) px-6 py-2 font-bold hover:bg-(--star-white) hover:text-(--blood-red) border-2 border-(--blood-red) uppercase tracking-wider text-sm'
        >
          Spin Story (-200€, -25 Controversy)
        </button>
      )}

      <button
        onClick={onContinue}
        className='bg-(--toxic-green) text-(--void-black) px-8 py-3 font-bold hover:bg-(--star-white) uppercase tracking-wider shadow-[4px_4px_0px_var(--void-black)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all'
      >
        Back to Tour &gt;
      </button>
    </motion.div>
  </motion.div>
  )
}

CompletePhase.propTypes = {
  result: PropTypes.shape({
    success: PropTypes.bool.isRequired,
    message: PropTypes.string.isRequired,
    followers: PropTypes.number,
    totalFollowers: PropTypes.number.isRequired,
    platform: PropTypes.string.isRequired
  }).isRequired,
  onContinue: PropTypes.func.isRequired,
  onSpinStory: PropTypes.func,
  player: PropTypes.object,
  social: PropTypes.object
}
