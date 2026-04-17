// TODO: Review this file
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element "#root" not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <Suspense
      fallback={
        <div
          className='flex h-screen w-full items-center justify-center bg-void-black text-toxic-green'
          role='status'
        >
          <div className='w-12 h-12 border-4 border-toxic-green border-t-transparent rounded-full animate-spin'>
            <span className='sr-only'>Loading...</span>
          </div>
        </div>
      }
    >
      <App />
    </Suspense>
  </StrictMode>
)
