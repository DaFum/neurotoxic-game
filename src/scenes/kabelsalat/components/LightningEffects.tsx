import type { FC } from 'react'

const LIGHTNING_Y_COORDS = [0, 200, 400, 600]

import type { LightningSeed } from '../../../types/kabelsalat'

/**
 * Renders the Lightning Effects scene from lightningSeeds.
 * @param props - Lightning seed positions for Kabelsalat visual effects.
 * @returns The rendered Lightning Effects UI.
 */
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
        className='motion-safe:animate-[flash_0.05s_infinite]'
        style={{
          filter: 'drop-shadow(0 0 20px var(--color-warning-yellow))'
        }}
      />
    ))}
  </g>
)
