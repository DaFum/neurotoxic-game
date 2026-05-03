import React from 'react'
import { useTranslation } from 'react-i18next'
import { useRegisterSW } from 'virtual:pwa-register/react'
import './ReloadPrompt.css'

export default function ReloadPrompt() {
  const { t } = useTranslation('ui')
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisterError(error) {
      console.warn('SW registration error', error)
    }
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) {
    return null
  }

  return (
    <div className='ReloadPrompt-container pointer-events-auto'>
      <div className='ReloadPrompt-toast bg-void-black border-2 border-toxic-green text-toxic-green p-4 font-mono z-50'>
        <div className='ReloadPrompt-message mb-2'>
          {offlineReady ? (
            <span>{t('offline.offlineReady')}</span>
          ) : (
            <span>{t('offline.needRefresh')}</span>
          )}
        </div>
        <div className='flex gap-4'>
          {needRefresh && (
            <button
              className='ReloadPrompt-toast-button border border-toxic-green px-3 py-1 hover:bg-toxic-green hover:text-void-black transition-colors focus-visible:ring-toxic-green focus-visible:ring-offset-void-black'
              onClick={() => updateServiceWorker(true)}
            >
              {t('offline.reload')}
            </button>
          )}
          <button
            className='ReloadPrompt-toast-button border border-toxic-green px-3 py-1 hover:bg-toxic-green hover:text-void-black transition-colors focus-visible:ring-toxic-green focus-visible:ring-offset-void-black'
            onClick={() => close()}
          >
            {t('offline.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
