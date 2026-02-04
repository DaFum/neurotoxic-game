import React from 'react'
import { useGameState } from '../context/GameState'
import { motion, AnimatePresence } from 'framer-motion'

export const ToastOverlay = () => {
  const { toasts } = useGameState()

  return (
    <div className='fixed inset-0 z-[9999] flex flex-col gap-2 items-center justify-start pt-24 pointer-events-none'>
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`
              min-w-[200px] max-w-[300px] p-3 border-l-4 font-mono text-sm shadow-lg backdrop-blur-md bg-(--void-black)/80
              ${toast.type === 'error' ? 'border-(--blood-red) text-(--blood-red)' : 'border-(--toxic-green) text-(--toxic-green)'}
            `}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
