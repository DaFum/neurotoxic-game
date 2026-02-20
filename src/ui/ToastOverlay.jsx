import { memo } from 'react'
import { useGameState } from '../context/GameState'
import { motion, AnimatePresence } from 'framer-motion'

const TOAST_STYLE_MAP = {
  success: {
    border: 'border-(--toxic-green)',
    text: 'text-(--toxic-green)',
    icon: '✔'
  },
  error: {
    border: 'border-(--blood-red)',
    text: 'text-(--blood-red)',
    icon: '✖'
  },
  warning: {
    border: 'border-(--warning-yellow)',
    text: 'text-(--warning-yellow)',
    icon: '⚠'
  },
  info: {
    border: 'border-(--info-blue)',
    text: 'text-(--info-blue)',
    icon: 'ℹ'
  }
}

/**
 * Renders global toast notifications with consistent visual taxonomy.
 *
 * @returns {JSX.Element} Toast stack overlay.
 */
export const ToastOverlay = memo(() => {
  const { toasts } = useGameState()

  return (
    <div
      className='fixed inset-0 flex flex-col gap-3 items-center justify-start pt-20 px-3 md:pt-24 pointer-events-none'
      style={{ zIndex: 'var(--z-toast)' }}
      role='status'
      aria-live='polite'
      aria-atomic='false'
    >
      <AnimatePresence>
        {toasts.map(toast => {
          const style = TOAST_STYLE_MAP[toast.type] || TOAST_STYLE_MAP.info

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`
                w-[min(34rem,94vw)] border-2 ${style.border} bg-(--void-black)/90 backdrop-blur-md
                shadow-[0_0_0_1px_var(--void-black),0_10px_24px_var(--shadow-overlay)]
              `}
              aria-atomic='true'
            >
              <div className='flex items-start gap-3 px-3 py-2.5'>
                <span
                  className={`shrink-0 mt-0.5 text-sm font-bold font-[Courier_New] ${style.text}`}
                  aria-hidden='true'
                >
                  {style.icon}
                </span>
                <p className={`font-[Courier_New] text-sm leading-snug ${style.text}`}>
                  {toast.message}
                </p>
              </div>
              <div className={`h-[2px] w-full ${style.border} border-t`} />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
})
