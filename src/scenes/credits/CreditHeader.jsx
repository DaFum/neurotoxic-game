/*
 * (#1) Actual Updates: Extracted CreditHeader component, localized text, and wrapped in React.memo.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import React from 'react'
import { useTranslation } from 'react-i18next'

export const CreditHeader = React.memo(() => {
  const { t } = useTranslation()
  return (
    <div className='mb-16'>
      <h1 className='text-6xl text-toxic-green font-[Metal_Mania] animate-neon-flicker'>
        {t('ui:credits', { defaultValue: 'CREDITS' })}
      </h1>
      <div className='w-48 h-[1px] bg-gradient-to-r from-transparent via-toxic-green to-transparent mx-auto mt-4' />
    </div>
  )
})
CreditHeader.displayName = 'CreditHeader'
