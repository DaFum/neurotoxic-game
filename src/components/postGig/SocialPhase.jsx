import PropTypes from 'prop-types'
import { memo, useCallback } from 'react'
import { motion } from 'framer-motion'

const SocialOptionButton = memo(({ opt, index, onSelect }) => {
  const handleClick = useCallback(() => onSelect(opt), [onSelect, opt])

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.15 }}
      onClick={handleClick}
      className='flex flex-col border-2 border-(--toxic-green)/40 p-4 hover:bg-(--toxic-green)/10 hover:border-(--toxic-green) text-left group transition-all relative overflow-hidden bg-(--void-black)/80 min-h-[140px]'
    >
      <div className='flex justify-between items-start mb-2 w-full'>
        <div className='font-bold text-lg group-hover:text-(--toxic-green) transition-colors leading-tight pr-2'>
          {opt.name}
        </div>
        <div className='flex gap-1 text-sm bg-(--void-black) px-1 rounded'>
          {opt.badges?.map((b, i) => <span key={`${b}-${i}`}>{b}</span>)}
        </div>
      </div>
      <div className='text-xs text-(--ash-gray) font-mono space-y-1 mb-2 w-full'>
        <div className='flex justify-between border-b border-(--ash-gray)/20 pb-1'>
          <span>Platform</span>
          <span className='text-(--star-white)/60'>{opt.platform}</span>
        </div>
        <div className='flex justify-between pt-1'>
          <span>Category</span>
          <span className='text-(--star-white)/60'>{opt.category}</span>
        </div>
      </div>

      {/* Side Effects Preview */}
      <div className='mt-auto pt-2 text-[10px] uppercase font-mono tracking-wider w-full'>
        <div className='flex flex-wrap gap-2'>
          {/* Example preview indicators based on the resolve function signature if possible, or just imply risk based on badges */}
          {opt.badges?.includes('⚠️') && (
             <span className="text-(--blood-red)">High Variance Risk</span>
          )}
          {opt.badges?.includes('🛡️') && (
             <span className="text-(--stamina-green)">Consistent Growth</span>
          )}
        </div>
      </div>
      <div className='absolute inset-0 bg-(--star-white)/5 translate-x-[-100%] group-hover:animate-[shimmer_0.8s_ease-out] skew-x-12 pointer-events-none' />
    </motion.button>
  )
})

SocialOptionButton.displayName = 'SocialOptionButton'
SocialOptionButton.propTypes = {
  opt: PropTypes.shape({
    name: PropTypes.string.isRequired,
    platform: PropTypes.string.isRequired,
    category: PropTypes.string,
    badges: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  index: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired
}

export const SocialPhase = ({ options, onSelect, trend }) => (
  <div className='space-y-6'>
    <div className='text-center mb-2'>
      <h3 className='text-xl font-mono tracking-widest'>
        POST TO SOCIAL MEDIA
      </h3>
      {trend && (
        <div className='text-sm text-(--toxic-green) tracking-widest mt-1 font-bold animate-pulse'>
          CURRENT TREND: {trend}
        </div>
      )}
      <div className='text-[10px] text-(--ash-gray) tracking-wider mt-1'>
        CHOOSE YOUR STRATEGY
      </div>
    </div>
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      {options.map((opt, i) => (
        <SocialOptionButton
          key={opt.id}
          opt={opt}
          index={i}
          onSelect={onSelect}
        />
      ))}
    </div>
  </div>
)

SocialPhase.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      platform: PropTypes.string.isRequired
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  trend: PropTypes.string
}
