// TODO: Review this file
import { CABLES } from '../constants.js'
import { PlugGraphics } from './PlugGraphics.jsx'

export const CableList = ({
  t,
  connections,
  selectedCable,
  isShocked,
  isGameOver,
  handleCableClick
}) => {
  return (
    <>
      {CABLES.map(cable => {
        const isConnected = Object.values(connections).includes(cable.id)
        const isSelected = selectedCable === cable.id

        return (
          <g
            key={cable.id}
            transform={`translate(${cable.x}, ${isSelected ? cable.y - 40 : cable.y})`}
            onClick={() => handleCableClick(cable.id)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleCableClick(cable.id)
              }
            }}
            role='button'
            tabIndex={!isConnected && !isShocked && !isGameOver ? 0 : -1}
            className={
              !isConnected && !isShocked && !isGameOver
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
      })}
    </>
  )
}
