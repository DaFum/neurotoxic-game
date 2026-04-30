import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import './ReloadPrompt.css'

export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
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
            <span>App ready to work offline</span>
          ) : (
            <span>
              New content available, click on reload button to update.
            </span>
          )}
        </div>
        <div className='flex gap-4'>
          {needRefresh && (
            <button
              className='ReloadPrompt-toast-button border border-toxic-green px-3 py-1 hover:bg-toxic-green hover:text-void-black transition-colors focus-visible:ring-toxic-green focus-visible:ring-offset-void-black'
              onClick={() => updateServiceWorker(true)}
            >
              Reload
            </button>
          )}
          <button
            className='ReloadPrompt-toast-button border border-toxic-green px-3 py-1 hover:bg-toxic-green hover:text-void-black transition-colors focus-visible:ring-toxic-green focus-visible:ring-offset-void-black'
            onClick={() => close()}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
