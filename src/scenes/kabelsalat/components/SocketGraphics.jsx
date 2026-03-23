/*
 * (#1) Actual Updates: Extracted socket graphics to sub-components, removed TODO.
 * (#2) Next Steps: Extract PlugGraphics components.
 * (#3) Found Errors + Solutions: N/A
 */
import PropTypes from 'prop-types'
import { CONNECTOR_TYPES } from '../constants.js'
import { XlrSocket } from './sockets/XlrSocket.jsx'
import { JackSocket } from './sockets/JackSocket.jsx'
import { DcSocket } from './sockets/DcSocket.jsx'
import { IecSocket } from './sockets/IecSocket.jsx'
import { MidiSocket } from './sockets/MidiSocket.jsx'

const SocketXlr = () => (
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

const SocketJack = () => (
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

const SocketDc = () => (
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

const SocketIec = () => (
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
    <rect
      x='5'
      y='-4'
      width='4'
      height='10'
      fill='var(--color-void-black)'
    />
  </g>
)

const SocketMidi = () => (
  <g>
    <circle
      cx='0'
      cy='0'
      r='20'
      fill='var(--color-shadow-black)'
      stroke='currentColor'
      strokeWidth='2'
    />
    <path
      d='M -15 0 A 15 15 0 0 1 15 0'
      fill='none'
      stroke='var(--color-void-black)'
      strokeWidth='6'
      strokeLinecap='round'
    />
  </g>
)

export const SocketGraphics = ({ type }) => {
  switch (type) {
    case 'xlr':
      return <SocketXlr />
    case 'jack':
      return <SocketJack />
    case 'dc':
      return <SocketDc />
    case 'iec':
      return <SocketIec />
    case 'midi':
      return <SocketMidi />
    default:
      return null
  }
}

SocketGraphics.propTypes = {
  type: PropTypes.oneOf(CONNECTOR_TYPES).isRequired
}
