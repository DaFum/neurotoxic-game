/*
 * (#1) Actual Updates: Extracted CableItem component, wrapped in React.memo
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { PlugGraphics } from './PlugGraphics.jsx'

export const CableItem = React.memo(
  ({
    t,
    cable,
    isConnected,
    isSelected,
    isShocked,
    isGameOver,
    handleCableClick
  }) => {
    const isInteractive = !isConnected && !isShocked && !isGameOver
    const canClick = !isShocked && !isGameOver

    const handleClick = useCallback(() => {
      if (!canClick) return
      handleCableClick(cable.id)
    }, [handleCableClick, cable.id, canClick])

    const handleKeyDown = useCallback(
      e => {
        if (!canClick) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCableClick(cable.id)
        }
      },
      [handleCableClick, cable.id, canClick]
    )

    return (
      <g
        transform={`translate(${cable.x}, ${isSelected ? cable.y - 40 : cable.y})`}
        onClick={canClick ? handleClick : undefined}
        onKeyDown={canClick ? handleKeyDown : undefined}
        role='button'
        tabIndex={isInteractive || (isConnected && canClick) ? 0 : -1}
        className={
          isInteractive || (isConnected && canClick)
            ? 'cursor-pointer transition-transform duration-200 group'
            : 'transition-transform duration-200 outline-hidden'
        }
        style={{ color: cable.color }}
        aria-label={t('ui:minigames.kabelsalat.a11y.cable', {
          label: t(cable.labelKey)
        })}
      >
        <ellipse
          cx='0'
          cy='80'
          rx='25'
          ry='10'
          fill='var(--color-void-black)'
          opacity='0.8'
        />

        {!isConnected && (
          <>
            <path
              d='M 0 0 C 0 40, -10 60, 0 80'
              stroke='currentColor'
              strokeWidth='12'
              fill='none'
              style={{
                filter: `drop-shadow(0 5px 5px var(--color-shadow-black))`
              }}
            />

            {isSelected && (
              <circle
                cx='0'
                cy='-15'
                r='35'
                fill='currentColor'
                opacity='0.15'
                className='animate-pulse'
              />
            )}

            {!isSelected && !isGameOver && (
              <rect
                x='-30'
                y='-40'
                width='60'
                height='80'
                fill='transparent'
                className='group-hover:fill-[currentColor] group-hover:opacity-10 transition-colors'
              />
            )}

            <PlugGraphics type={cable.type} />

            <rect
              x='-25'
              y='-68'
              width='50'
              height='18'
              fill='var(--color-void-black)'
              stroke='currentColor'
              strokeWidth='1'
            />
            <text
              x='0'
              y='-55'
              fill='currentColor'
              fontSize='12'
              textAnchor='middle'
              className='font-mono font-bold tracking-widest'
            >
              {t(cable.labelKey)}
            </text>
          </>
        )}
      </g>
    )
  }
)
CableItem.displayName = 'CableItem'

CableItem.propTypes = {
  t: PropTypes.func.isRequired,
  cable: PropTypes.shape({
    id: PropTypes.string.isRequired,
    labelKey: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    color: PropTypes.string.isRequired
  }).isRequired,
  isConnected: PropTypes.bool.isRequired,
  isSelected: PropTypes.bool.isRequired,
  isShocked: PropTypes.bool.isRequired,
  isGameOver: PropTypes.bool.isRequired,
  handleCableClick: PropTypes.func.isRequired
}
