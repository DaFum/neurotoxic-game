/*
 * (#1) Actual Updates: Extracted CreditFooter component, localized text, and wrapped in React.memo.


 */
import React from 'react'
import { useTranslation } from 'react-i18next'

export const CreditFooter = React.memo(() => {
  const { t } = useTranslation()
  return (
    <div className='pt-16'>
      <div className='text-toxic-green/40 text-xs font-mono tracking-widest'>
        {t('ui:creditFooter.title')}
      </div>
      <div className='text-ash-gray/30 text-[10px] font-mono mt-2'>
        {t('ui:creditFooter.subtitle')}
      </div>
    </div>
  )
})
CreditFooter.displayName = 'CreditFooter'
