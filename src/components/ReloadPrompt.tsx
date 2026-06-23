import { useTranslation } from 'react-i18next'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { logger } from '../utils/logger'
import './ReloadPrompt.css'

/**
 * Displays the service-worker update prompt and triggers a reload on confirmation.
 */
export default function ReloadPrompt() {
  const { t } = useTranslation()
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisterError(error) {
      logger.warn('ReloadPrompt', 'SW registration error', error)
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
    <div className='ReloadPrompt-container'>
      <div
        role='status'
        className='ReloadPrompt-toast bg-void-black border-2 border-toxic-green text-toxic-green p-4 font-mono shadow-[4px_4px_0px_theme(colors.toxic-green)]'
      >
        <div className='ReloadPrompt-message mb-2'>
          {offlineReady ? (
            <span>{t('ui:offline.offlineReady')}</span>
          ) : (
            <span>{t('ui:offline.needRefresh')}</span>
          )}
        </div>
        <div className='flex gap-4'>
          {needRefresh && (
            <button
              type='button'
              className='ReloadPrompt-toast-button min-h-11 border-2 border-toxic-green px-4 py-2 hover:bg-toxic-green hover:text-void-black transition-colors focus-visible:ring-toxic-green focus-visible:ring-offset-void-black'
              onClick={() => updateServiceWorker(true)}
            >
              {t('ui:offline.reload')}
            </button>
          )}
          <button
            type='button'
            className='ReloadPrompt-toast-button min-h-11 border-2 border-toxic-green px-4 py-2 hover:bg-toxic-green hover:text-void-black transition-colors focus-visible:ring-toxic-green focus-visible:ring-offset-void-black'
            onClick={close}
          >
            {t('ui:offline.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
