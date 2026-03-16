// TODO: Implement this
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
