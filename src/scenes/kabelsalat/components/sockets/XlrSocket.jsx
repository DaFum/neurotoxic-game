/*
 * (#1) Actual Updates: Extracted XlrSocket into a static UI component.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import React from 'react'

export const XlrSocket = React.memo(function XlrSocket() {
  return (
    <g>
      <circle
        cx='0'
        cy='0'
        r='22'
        fill='var(--color-shadow-black)'
        stroke='currentColor'
        strokeWidth='2'
      />
      <circle cx='-6' cy='-5' r='4' fill='var(--color-void-black)' />
      <circle cx='6' cy='-5' r='4' fill='var(--color-void-black)' />
      <circle cx='0' cy='8' r='4' fill='var(--color-void-black)' />
    </g>
  )
})
