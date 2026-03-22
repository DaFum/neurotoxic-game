/*
 * (#1) Actual Updates: Added PropTypes.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import PropTypes from 'prop-types'

// TODO: Extract complex UI sub-components into standalone files for better maintainability
export const SocketGraphics = ({ type }) => {
  switch (type) {
    case 'xlr':
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
    case 'jack':
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
    case 'dc':
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
    case 'iec':
      return (
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
    case 'midi':
      return (
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
    default:
      return null
  }
}

SocketGraphics.propTypes = {
  type: PropTypes.string.isRequired
}
