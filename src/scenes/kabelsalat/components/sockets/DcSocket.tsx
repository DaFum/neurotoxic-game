/*
 * (#1) Actual Updates: Extracted DcSocket into a static UI component.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import React from 'react'

export const DcSocket = React.memo(function DcSocket() {
  return (
    <g>
      <rect
        x='-14'
        y='-14'
        width='28'
        height='28'
        rx='4'
        fill='var(--color-shadow-black)'
        stroke='currentColor'
        strokeWidth='2'
      />
      <circle cx='0' cy='0' r='7' fill='var(--color-void-black)' />
      <circle cx='0' cy='0' r='2' fill='currentColor' />
    </g>
  )
})
