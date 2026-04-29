/*
 * (#1) Actual Updates: Extracted CreditFooter component, localized text, and wrapped in React.memo.


 */
import React from 'react'
import { useTranslation } from 'react-i18next'

export const CreditFooter = React.memo(() => {
  const { t } = useTranslation(['ui'])
  return (
    <div className='pt-16'>
      <div className='text-toxic-green/40 text-xs font-mono tracking-widest'>
        {t('ui:creditFooter.title', {
          defaultValue: 'NEUROTOXIC: GRIND THE VOID v3.0'
        })}
      </div>
      <div className='text-ash-gray/30 text-[10px] font-mono mt-2'>
        {t('ui:creditFooter.subtitle', {
          defaultValue: 'DEATH GRINDCORE FROM STENDAL // 2026'
        })}
      </div>
    </div>
  )
})
CreditFooter.displayName = 'CreditFooter'
