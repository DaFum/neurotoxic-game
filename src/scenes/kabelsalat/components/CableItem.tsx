import React, { useCallback } from 'react'
import type { FC } from 'react'
import type { TFunction } from 'i18next'
import { PlugGraphics } from './PlugGraphics.tsx'
import type { Cable, CableId } from '../kabelsalatConstants'

interface CableItemProps {
  t: TFunction
  cable: Cable
  isConnected: boolean
  isSelected: boolean
  isShocked: boolean
  isGameOver: boolean
  handleCableClick: (id: CableId) => void
}

const CableItemComponent: FC<CableItemProps> = ({
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
    (e: React.KeyboardEvent<SVGElement>) => {
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

/**
 * Renders one draggable Kabelsalat cable entry.
 * @param props - Cable definition, interaction state, translator, and cable-click handler.
 */
export const CableItem = React.memo(CableItemComponent)
CableItem.displayName = 'CableItem'
