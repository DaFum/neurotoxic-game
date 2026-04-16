// @ts-nocheck
/*
 * (#1) Actual Updates: Added PropTypes.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import { memo } from 'react'
import PropTypes from 'prop-types'

export const RackScrew = memo(({ x, y }) => (
  <g transform={`translate(${x}, ${y})`}>
    <circle
      cx='0'
      cy='0'
      r='4'
      fill='var(--color-concrete-gray)'
      stroke='var(--color-void-black)'
      strokeWidth='1'
    />
    <line
      x1='-2'
      y1='-2'
      x2='2'
      y2='2'
      stroke='var(--color-void-black)'
      strokeWidth='1.5'
    />
    <line
      x1='-2'
      y1='2'
      x2='2'
      y2='-2'
      stroke='var(--color-void-black)'
      strokeWidth='1.5'
    />
  </g>
))

const RACK_GEOMETRY = {
  OUTER_X: 40,
  OUTER_Y: 20,
  OUTER_WIDTH: 720,
  OUTER_HEIGHT: 180,
  INNER_X: 50,
  INNER_Y: 30,
  INNER_WIDTH: 700,
  INNER_HEIGHT: 160,
  SCREW_LEFT_X: 60,
  SCREW_RIGHT_X: 760,
  SCREW_TOP_Y: 40,
  SCREW_BOTTOM_Y: 170
}

export const RackPanel = memo(() => (
  <g>
    <rect
      x={RACK_GEOMETRY.OUTER_X}
      y={RACK_GEOMETRY.OUTER_Y}
      width={RACK_GEOMETRY.OUTER_WIDTH}
      height={RACK_GEOMETRY.OUTER_HEIGHT}
      fill='var(--color-shadow-black)'
      stroke='var(--color-concrete-gray)'
      strokeWidth='4'
    />
    <rect
      x={RACK_GEOMETRY.INNER_X}
      y={RACK_GEOMETRY.INNER_Y}
      width={RACK_GEOMETRY.INNER_WIDTH}
      height={RACK_GEOMETRY.INNER_HEIGHT}
      fill='var(--color-void-black)'
    />
    <RackScrew x={RACK_GEOMETRY.SCREW_LEFT_X} y={RACK_GEOMETRY.SCREW_TOP_Y} />
    <RackScrew x={RACK_GEOMETRY.SCREW_RIGHT_X} y={RACK_GEOMETRY.SCREW_TOP_Y} />
    <RackScrew
      x={RACK_GEOMETRY.SCREW_LEFT_X}
      y={RACK_GEOMETRY.SCREW_BOTTOM_Y}
    />
    <RackScrew
      x={RACK_GEOMETRY.SCREW_RIGHT_X}
      y={RACK_GEOMETRY.SCREW_BOTTOM_Y}
    />
  </g>
))

const INDICATOR_GEOMETRY = {
  CX: 80,
  CY: 100,
  RADIUS: 6,
  LABEL_Y: 125
}

export const PowerIndicator = memo(({ t, isPowerConnected }) => (
  <g>
    <circle
      cx={INDICATOR_GEOMETRY.CX}
      cy={INDICATOR_GEOMETRY.CY}
      r={INDICATOR_GEOMETRY.RADIUS}
      fill={
        isPowerConnected
          ? 'var(--color-success-green)'
          : 'var(--color-concrete-gray)'
      }
      style={{
        filter: isPowerConnected
          ? 'drop-shadow(0 0 10px var(--color-success-green))'
          : 'none'
      }}
    />
    <text
      x={INDICATOR_GEOMETRY.CX}
      y={INDICATOR_GEOMETRY.LABEL_Y}
      fill='var(--color-ash-gray)'
      fontSize='8'
      textAnchor='middle'
      className='font-mono tracking-widest'
    >
      {t('ui:minigames.kabelsalat.pwrLabel')}
    </text>
  </g>
))

RackScrew.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired
}

PowerIndicator.propTypes = {
  t: PropTypes.func.isRequired,
  isPowerConnected: PropTypes.bool.isRequired
}
