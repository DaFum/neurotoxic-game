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
      {Array.from({ length: segments }).map((_, i) => (
        <div
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

export const HealthBar = memo(function HealthBar({ health, isToxicMode }) {
  return (
    <div className='absolute bottom-20 left-1/2 -translate-x-1/2 w-[28rem] z-10 pointer-events-none'>
      <div className='flex justify-between text-(--star-white) text-xs mb-1 font-bold tracking-widest drop-shadow-md'>
        <span>CROWD ENERGY</span>
        <span
          className={`tabular-nums ${
            health < 20
              ? 'text-(--blood-red) animate-fuel-warning'
              : 'text-(--star-white)'
          }`}
        >
          {Math.floor(health)}%
        </span>
      </div>
      <div
        className={`w-full h-5 bg-(--void-black)/70 border-2 backdrop-blur-sm p-[3px] ${
          health < 20
            ? 'border-(--blood-red) shadow-[0_0_10px_var(--blood-red)]'
            : 'border-(--ash-gray)/30'
        }`}
      >
        <SegmentedBar
          value={health}
          segments={25}
          lowThreshold={20}
          className='h-full'
        />
      </div>
      {isToxicMode && (
        <div className='mt-2 text-(--blood-red) animate-neon-flicker font-bold tracking-widest text-center font-[var(--font-display)] text-sm'>
          TOXIC MODE ACTIVE
        </div>
      )}
    </div>
  )
})

HealthBar.propTypes = {
  health: PropTypes.number.isRequired,
  isToxicMode: PropTypes.bool
}
