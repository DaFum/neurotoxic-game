/*
 * (#1) Actual Updates: Extracted PreGigHeader into a separate component.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import React from 'react'
import { motion } from 'framer-motion'
import PropTypes from 'prop-types'
import { formatNumber } from '../../utils/numberUtils'

export const PreGigHeader = React.memo(
  ({ t, i18n, currentGig, player, calculatedBudget }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center mb-4 sm:mb-6 w-full max-w-4xl'
      >
        <h2 className="text-3xl sm:text-4xl text-toxic-green font-['Metal_Mania'] mb-2">
          {t('ui:pregig.title')}
        </h2>
        <div className='w-48 h-[1px] bg-gradient-to-r from-transparent via-toxic-green to-transparent mx-auto mb-3' />
        <div className='text-lg mb-1 font-mono text-star-white/80'>
          {currentGig?.name ? t(currentGig.name) : ''}
        </div>
        <div className='font-mono text-[11px] sm:text-xs md:text-sm text-ash-gray flex flex-wrap items-center justify-center gap-x-3 gap-y-1'>
          <span>
            {t('ui:pregig.budget')}{' '}
            <span className='text-toxic-green font-bold tabular-nums'>
              {t('ui:currency', {
                value: formatNumber(player.money, i18n?.language)
              })}
            </span>
          </span>
          <span className='text-ash-gray/30'>|</span>
          <span>
            {t('ui:pregig.costs')}{' '}
            <span className='text-blood-red font-bold tabular-nums'>
              {t('ui:currencyNegative', {
                value: formatNumber(calculatedBudget, i18n?.language)
              })}
            </span>
          </span>
        </div>
      </motion.div>
    )
  }
)
PreGigHeader.displayName = 'PreGigHeader'

PreGigHeader.propTypes = {
  t: PropTypes.func.isRequired,
  i18n: PropTypes.shape({
    language: PropTypes.string
  }),
  currentGig: PropTypes.shape({
    name: PropTypes.string
  }),
  player: PropTypes.shape({
    money: PropTypes.number.isRequired
  }).isRequired,
  calculatedBudget: PropTypes.number.isRequired
}
