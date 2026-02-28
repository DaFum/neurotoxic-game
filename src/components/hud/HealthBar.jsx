import { memo } from 'react'
import PropTypes from 'prop-types'

const SegmentedBar = memo(function SegmentedBar({
  value,
  segments = 20,
  lowThreshold = 20,
  className = ''
}) {
  const filledCount = Math.round((value / 100) * segments)
  const isLow = value < lowThreshold
  return (
    <div className={`flex gap-[2px] ${className}`}>
      {/* Segments are stable, not re-ordered, and have no IDs */}
      {Array.from({ length: segments }).map((_, i) => (
        <div
          // eslint-disable-next-line @eslint-react/no-array-index-key
          key={i}
          className={`flex-1 h-full transition-all duration-150 ${
            i < filledCount
              ? isLow
                ? 'bg-(--blood-red) shadow-[0_0_4px_var(--blood-red)]'
                : 'bg-(--toxic-green) shadow-[0_0_2px_var(--toxic-green)]'
              : 'bg-(--ash-gray)/10'
          }`}
        />
      ))}
    </div>
  )
})

SegmentedBar.propTypes = {
  value: PropTypes.number.isRequired,
  segments: PropTypes.number,
  lowThreshold: PropTypes.number,
  className: PropTypes.string
}

import { BlockMeter } from '../../ui/shared/BrutalistUI'

export const HealthBar = memo(function HealthBar({ health, isToxicMode }) {
  return (
    <div className='absolute bottom-20 left-1/2 -translate-x-1/2 w-[28rem] z-10 pointer-events-none'>
      <div className="bg-(--void-black)/80 p-4 border border-(--toxic-green)/30 backdrop-blur-sm">
        <BlockMeter
          label="CROWD ENERGY"
          value={Math.round((health / 100) * 20)}
          max={20}
          isDanger={health < 20}
        />
        {isToxicMode && (
          <div className='mt-3 text-(--blood-red) animate-neon-flicker font-bold tracking-widest text-center font-[var(--font-display)] text-sm border-t border-(--blood-red)/30 pt-2'>
            TOXIC MODE ACTIVE
          </div>
        )}
      </div>
    </div>
  )
})

HealthBar.propTypes = {
  health: PropTypes.number.isRequired,
  isToxicMode: PropTypes.bool
}
