import React from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  formatCurrency,
  formatSignedFinancialAmount
} from '../../utils/numberUtils'

type NetResultProps = { net: number }

export const NetResult = React.memo(({ net }: NetResultProps) => {
  const { t, i18n } = useTranslation(['economy', 'ui'])

  const getNetString = () => {
    if (net > 0)
      return formatSignedFinancialAmount(net, 'income', i18n.language)
    if (net < 0)
      return formatSignedFinancialAmount(net, 'expense', i18n.language)
    return formatCurrency(0, i18n.language)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8, type: 'spring' }}
      className='text-center py-4 sm:py-6 border-y-2 border-ash-gray/30'
    >
      <div className='text-[10px] text-ash-gray tracking-widest mb-2'>
        {t('economy:postGig.netProfit')}
      </div>
      <div
        data-testid='post-gig-net-result-value'
        className={`text-3xl sm:text-5xl font-bold font-display tabular-nums leading-tight break-words ${
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
