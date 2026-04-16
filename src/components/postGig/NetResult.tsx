// @ts-nocheck
import React from 'react'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '../../utils/numberUtils'

export const NetResult = React.memo(({ net }) => {
  const { t, i18n } = useTranslation(['economy', 'ui'])

  const getNetString = () => {
    if (net > 0)
      return t('economy:report.amount_positive', {
        amount: formatNumber(net, i18n?.language)
      })
    if (net < 0)
      return t('economy:report.amount_negative', {
        amount: formatNumber(Math.abs(net), i18n?.language)
      })
    return t('economy:report.amount_with_currency', {
      amount: formatNumber(0, i18n?.language)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8, type: 'spring' }}
      className='text-center py-6 border-y-2 border-ash-gray/30'
    >
      <div className='text-[10px] text-ash-gray tracking-widest mb-2'>
        {t('economy:postGig.netProfit')}
      </div>
      <div
        className={`text-5xl font-bold font-display tabular-nums ${
          net >= 0
            ? 'text-toxic-green drop-shadow-[0_0_20px_var(--color-toxic-green)]'
            : 'text-blood-red drop-shadow-[0_0_20px_var(--color-blood-red)]'
        }`}
      >
        {getNetString()}
      </div>
    </motion.div>
  )
})

NetResult.displayName = 'NetResult'

NetResult.propTypes = {
  net: PropTypes.number.isRequired
}
