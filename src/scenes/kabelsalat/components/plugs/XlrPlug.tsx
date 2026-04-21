/*
 * (#1) Actual Updates: Extracted XlrPlug into a static UI component.


 */
import React from 'react'

export const XlrPlug = React.memo(function XlrPlug() {
  return (
    <g>
      <rect
        x='-15'
        y='-35'
        width='30'
        height='35'
        rx='3'
        fill='var(--color-void-black)'
        stroke='currentColor'
        strokeWidth='2'
      />
      <circle cx='-6' cy='-25' r='2.5' fill='currentColor' />
      <circle cx='6' cy='-25' r='2.5' fill='currentColor' />
      <circle cx='0' cy='-12' r='2.5' fill='currentColor' />
    </g>
  )
})
