// @ts-nocheck
/*
 * (#1) Actual Updates: Extracted complex UI sub-components into standalone files (HeaderTitle, HeaderTimer) for better maintainability.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import PropTypes from 'prop-types'
import { HeaderTitle } from './HeaderTitle.tsx'
import { HeaderTimer } from './HeaderTimer.tsx'

export const Header = ({ t, isShocked, isPoweredOn, isGameOver, timeLeft }) => (
  <div className='w-full flex flex-col md:flex-row justify-between items-end border-b-2 border-toxic-green pb-2 mb-6 gap-4 bg-void-black/80 p-4 rounded-t-sm'>
    <HeaderTitle
      t={t}
      isShocked={isShocked}
      isPoweredOn={isPoweredOn}
      isGameOver={isGameOver}
    />
    <HeaderTimer t={t} timeLeft={timeLeft} isPoweredOn={isPoweredOn} />
  </div>
)

Header.propTypes = {
  t: PropTypes.func.isRequired,
  isShocked: PropTypes.bool.isRequired,
  isPoweredOn: PropTypes.bool.isRequired,
  isGameOver: PropTypes.bool.isRequired,
  timeLeft: PropTypes.number.isRequired
}
