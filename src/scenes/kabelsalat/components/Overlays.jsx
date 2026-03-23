/*
 * (#1) Actual Updates: Refactored Overlays component to use sub-components.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import PropTypes from 'prop-types'
import { ShockOverlay } from './overlays/ShockOverlay.jsx'
import { GameOverOverlay } from './overlays/GameOverOverlay.jsx'
import { PoweredOnOverlay } from './overlays/PoweredOnOverlay.jsx'

export const Overlays = ({
  t,
  isShocked,
  isGameOver,
  isPoweredOn,
  faultReason
}) => {
  return (
    <>
      {isShocked && <ShockOverlay t={t} faultReason={faultReason} />}
      {isGameOver && !isShocked && <GameOverOverlay t={t} />}
      {isPoweredOn && <PoweredOnOverlay t={t} />}
    </>
  )
}

Overlays.propTypes = {
  t: PropTypes.func.isRequired,
  isShocked: PropTypes.bool.isRequired,
  isGameOver: PropTypes.bool.isRequired,
  isPoweredOn: PropTypes.bool.isRequired,
  faultReason: PropTypes.string.isRequired
}
