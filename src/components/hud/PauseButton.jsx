import { memo } from 'react'
import PropTypes from 'prop-types'

export const PauseButton = memo(function PauseButton({
  onTogglePause,
  isGameOver
}) {
  return (
    <div className='absolute top-4 right-4 z-50 pointer-events-auto'>
      <button
        onClick={onTogglePause}
        className={`bg-(--void-black)/80 border border-(--toxic-green) text-(--toxic-green) p-2 transition-all ${isGameOver ? 'opacity-50 pointer-events-none cursor-not-allowed' : 'hover:bg-(--toxic-green) hover:text-(--void-black)'}`}
        aria-label='Pause Game'
        disabled={isGameOver}
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={1.5}
          stroke='currentColor'
          className='w-8 h-8'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M15.75 5.25v13.5m-7.5-13.5v13.5'
          />
        </svg>
      </button>
    </div>
  )
})

PauseButton.propTypes = {
  onTogglePause: PropTypes.func,
  isGameOver: PropTypes.bool
}
