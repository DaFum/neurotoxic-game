import React from 'react'

/**
 * Renders the IEC power socket graphic.
 * @returns The rendered Iec Socket UI.
 */
export const IecSocket = React.memo(function IecSocket() {
  return (
    <g>
      <path
        d='M -22 -12 L 22 -12 L 18 18 L -18 18 Z'
        fill='var(--color-shadow-black)'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
      <rect
        x='-9'
        y='-4'
        width='4'
        height='10'
        fill='var(--color-void-black)'
      />
      <rect
        x='-2'
        y='-4'
        width='4'
        height='10'
        fill='var(--color-void-black)'
      />
      <rect x='5' y='-4' width='4' height='10' fill='var(--color-void-black)' />
    </g>
  )
})
