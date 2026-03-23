/*
 * (#1) Actual Updates: Extracted MidiPlug into a static UI component.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import React from 'react'

export const MidiPlug = React.memo(function MidiPlug() {
  return (
  <g>
    <circle
      cx='0'
      cy='-20'
      r='16'
      fill='var(--color-void-black)'
      stroke='currentColor'
      strokeWidth='2'
    />
    <circle cx='-8' cy='-20' r='2' fill='currentColor' />
    <circle cx='-5' cy='-28' r='2' fill='currentColor' />
    <circle cx='0' cy='-31' r='2' fill='currentColor' />
    <circle cx='5' cy='-28' r='2' fill='currentColor' />
    <circle cx='8' cy='-20' r='2' fill='currentColor' />
  </g>
  )
})
