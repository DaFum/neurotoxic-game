/*
 * (#1) Actual Updates: Extracted JackPlug into a static UI component.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import React from 'react'

export const JackPlug = React.memo(function JackPlug() {
  return (
    <g>
      <rect
        x='-8'
        y='-20'
        width='16'
        height='20'
        fill='var(--color-void-black)'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path d='M -4 -20 L -2 -45 L 2 -45 L 4 -20 Z' fill='currentColor' />
      <line
        x1='-3'
        y1='-30'
        x2='3'
        y2='-30'
        stroke='var(--color-void-black)'
        strokeWidth='1'
      />
      <line
        x1='-2'
        y1='-38'
        x2='2'
        y2='-38'
        stroke='var(--color-void-black)'
        strokeWidth='1'
      />
    </g>
  )
})
