// @ts-nocheck
/*
 * (#1) Actual Updates: Extracted DcPlug into a static UI component.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import React from 'react'

export const DcPlug = React.memo(function DcPlug() {
  return (
    <g>
      <rect
        x='-10'
        y='-15'
        width='20'
        height='15'
        rx='2'
        fill='var(--color-void-black)'
        stroke='currentColor'
        strokeWidth='2'
      />
      <rect x='-4' y='-30' width='8' height='15' fill='currentColor' />
      <line
        x1='-2'
        y1='-30'
        x2='2'
        y2='-30'
        stroke='var(--color-void-black)'
        strokeWidth='2'
      />
    </g>
  )
})
