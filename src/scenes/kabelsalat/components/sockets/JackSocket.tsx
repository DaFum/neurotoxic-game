/*
 * (#1) Actual Updates: Extracted JackSocket into a static UI component.


 */
import React from 'react'

export const JackSocket = React.memo(function JackSocket() {
  return (
    <g>
      <polygon
        points='-18,-10 0,-22 18,-10 18,10 0,22 -18,10'
        fill='var(--color-shadow-black)'
        stroke='currentColor'
        strokeWidth='2'
      />
      <circle
        cx='0'
        cy='0'
        r='8'
        fill='var(--color-void-black)'
        stroke='currentColor'
        strokeWidth='1'
        strokeDasharray='2 2'
      />
    </g>
  )
})
