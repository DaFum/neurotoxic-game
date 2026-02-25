import { memo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { Panel, ActionButton } from '../../ui/shared'

const SocialOptionButton = memo(({ opt, index, onSelect }) => {
  const handleClick = useCallback(() => onSelect(opt), [onSelect, opt])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.15 }}
      className='h-full'
    >
      <ActionButton
        onClick={handleClick}
        className='flex flex-col h-full items-start justify-start p-4 min-h-[140px] text-left relative overflow-hidden w-full'
      >
        <div className='flex justify-between items-start mb-2 w-full z-10 relative'>
          <div className='font-bold text-lg leading-tight pr-2 group-hover:text-(--toxic-green) transition-colors'>
            {opt.name}
          </div>
          <div className='flex gap-1 text-sm bg-(--void-black)/50 px-1 rounded backdrop-blur-sm'>
            {opt.badges?.map(b => (
              <span key={b}>{b}</span>
            ))}
          </div>
        </div>
        <div className='text-xs text-(--ash-gray) font-mono space-y-1 mb-2 w-full z-10 relative'>
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
        <div className='mt-auto pt-2 text-[10px] uppercase font-mono tracking-wider w-full z-10 relative'>
          <div className='flex flex-wrap gap-2'>
            {opt.badges?.includes('⚠️') && (
              <span className='text-(--blood-red)'>High Variance Risk</span>
            )}
            {opt.badges?.includes('🛡️') && (
              <span className='text-(--toxic-green)'>Consistent Growth</span>
            )}
          </div>
        </div>
      </ActionButton>
    </motion.div>
  )
})

SocialOptionButton.displayName = 'SocialOptionButton'
SocialOptionButton.propTypes = {
  opt: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    platform: PropTypes.string.isRequired,
    category: PropTypes.string,
    badges: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  index: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired
}

export const SocialPhase = ({ options, onSelect, trend }) => (
  <Panel className='space-y-6'>
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
  </Panel>
)

SocialPhase.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      platform: PropTypes.string.isRequired
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  trend: PropTypes.string
}
