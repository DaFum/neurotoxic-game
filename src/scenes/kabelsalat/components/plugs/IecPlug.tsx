// @ts-nocheck
/*
 * (#1) Actual Updates: Extracted IecPlug into a static UI component.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import React from 'react'

export const IecPlug = React.memo(function IecPlug() {
  return (
    <g>
      <path
        d='M -18 -15 L 18 -15 L 14 -35 L -14 -35 Z'
        fill='var(--color-void-black)'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='round'
      />
      <rect x='-8' y='-30' width='3' height='10' fill='currentColor' />
      <rect x='-1.5' y='-30' width='3' height='10' fill='currentColor' />
      <rect x='5' y='-30' width='3' height='10' fill='currentColor' />
    </g>
  )
})
