import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-black text-green-500 font-mono">LOADING TRANSLATIONS...</div>}>
      <App />
    </Suspense>
  </StrictMode>
)
