/*
 * (#1) Actual Updates: Added PropTypes.


 */
import PropTypes from 'prop-types'
import type { FC } from 'react'

const LIGHTNING_Y_COORDS = [0, 200, 400, 600]

type LightningSeed = {
  id: string | number
  startX: number
  o1: number
  o2: number
  o3: number
  w: number
}

export const LightningEffects: FC<{ lightningSeeds: LightningSeed[] }> = ({
  lightningSeeds
}) => (
  <g>
    {lightningSeeds.map(seed => (
      <path
        key={seed.id}
        d={`M ${seed.startX} ${LIGHTNING_Y_COORDS[0]} L ${seed.startX + seed.o1} ${LIGHTNING_Y_COORDS[1]} L ${seed.startX + seed.o2} ${LIGHTNING_Y_COORDS[2]} L ${seed.startX + seed.o3} ${LIGHTNING_Y_COORDS[3]}`}
        fill='none'
        stroke='var(--color-warning-yellow)'
        strokeWidth={seed.w}
        className='animate-[flash_0.05s_infinite]'
        style={{
          filter: 'drop-shadow(0 0 20px var(--color-warning-yellow))'
        }}
      />
    ))}
  </g>
)

LightningEffects.propTypes = {
  lightningSeeds: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      startX: PropTypes.number.isRequired,
      o1: PropTypes.number.isRequired,
      o2: PropTypes.number.isRequired,
      o3: PropTypes.number.isRequired,
      w: PropTypes.number.isRequired
    })
  ).isRequired
}
