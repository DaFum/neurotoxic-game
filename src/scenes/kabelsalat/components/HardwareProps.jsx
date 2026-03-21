export const RackScrew = ({ x, y }) => (
  <g transform={`translate(${x}, ${y})`}>
    <circle
      cx='0'
      cy='0'
      r='4'
      fill='var(--color-concrete-gray)'
      stroke='var(--color-void-black)'
      strokeWidth='1'
    />
    <line
      x1='-2'
      y1='-2'
      x2='2'
      y2='2'
      stroke='var(--color-void-black)'
      strokeWidth='1.5'
    />
    <line
      x1='-2'
      y1='2'
      x2='2'
      y2='-2'
      stroke='var(--color-void-black)'
      strokeWidth='1.5'
    />
  </g>
)

export const RackPanel = () => (
  <g>
    <rect
      x='40'
      y='20'
      width='720'
      height='180'
      fill='var(--color-shadow-black)'
      stroke='var(--color-concrete-gray)'
      strokeWidth='4'
    />
    <rect
      x='50'
      y='30'
      width='700'
      height='160'
      fill='var(--color-void-black)'
    />
    <RackScrew x='60' y='40' />
    <RackScrew x='760' y='40' />
    <RackScrew x='60' y='170' />
    <RackScrew x='760' y='170' />
  </g>
)

export const PowerIndicator = ({ t, isPowerConnected }) => (
  <g>
    <circle
      cx='80'
      cy='100'
      r='6'
      fill={
        isPowerConnected
          ? 'var(--color-success-green)'
          : 'var(--color-concrete-gray)'
      }
      style={{
        filter: isPowerConnected
          ? 'drop-shadow(0 0 10px var(--color-success-green))'
          : 'none'
      }}
    />
    <text
      x='80'
      y='125'
      fill='var(--color-ash-gray)'
      fontSize='8'
      textAnchor='middle'
      className='font-mono tracking-widest'
    >
      {t('ui:minigames.kabelsalat.pwrLabel')}
    </text>
  </g>
)
