/*
 * (#1) Actual Updates: Added PropTypes.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import PropTypes from 'prop-types'
import { CONNECTOR_TYPES } from '../constants.js'

const PlugXlr = () => (
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

const PlugJack = () => (
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

const PlugDc = () => (
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

const PlugIec = () => (
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

const PlugMidi = () => (
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

export const PlugGraphics = ({ type }) => {
  switch (type) {
    case 'xlr':
      return <PlugXlr />
    case 'jack':
      return <PlugJack />
    case 'dc':
      return <PlugDc />
    case 'iec':
      return <PlugIec />
    case 'midi':
      return <PlugMidi />
    default:
      return null
  }
}

PlugGraphics.propTypes = {
  type: PropTypes.oneOf(CONNECTOR_TYPES).isRequired
}
