import { useGameState } from '../context/GameState'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { logger } from '../utils/logger.js'
import { isForbiddenKey } from '../utils/gameStateUtils.js'
import { useEffect, memo } from 'react'

const renderToastMessage = (toast, t) => {
  if (toast.messageKey) {
    return t(toast.messageKey, {
      ...(toast.options || {}),
      defaultValue: toast.message
    })
  }

  if (!toast.message || !toast.message.startsWith('ui:')) {
    return toast.message
  }

  if (toast.message.includes('|')) {
    const firstPipeIdx = toast.message.indexOf('|')
    const key = toast.message.slice(0, firstPipeIdx)
    const contextStr = toast.message.slice(firstPipeIdx + 1)
    try {
      const rawContext = JSON.parse(contextStr)
      const context = translateContextKeys(rawContext, t)
      return t(key, context)
    } catch (_e) {
      logger.error('UI', 'Toast message JSON parse error', {
        error: _e,
        contextStr,
        toastMessage: toast.message
      })
      return t(key)
    }
  }

  return t(toast.message)
}

const ToastItem = memo(({ toast, t, removeToast, style }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id)
    }, 3000)
    return () => clearTimeout(timer)
  }, [toast.id, removeToast])

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`
        w-[min(34rem,94vw)] border-2 ${style.border} bg-void-black/90 backdrop-blur-md
        shadow-[0_0_0_1px_var(--color-void-black),0_10px_24px_var(--color-shadow-overlay)]
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
        <p
          className={`font-[Courier_New] text-sm leading-snug ${style.text}`}
        >
          {renderToastMessage(toast, t)}
        </p>
      </div>
      <div className={`h-[2px] w-full ${style.border} border-t`} />
    </motion.div>
  )
})
ToastItem.displayName = 'ToastItem'


const TOAST_STYLE_MAP = {
  success: {
    border: 'border-toxic-green',
    text: 'text-toxic-green',
    icon: '✔'
  },
  error: {
    border: 'border-blood-red',
    text: 'text-blood-red',
    icon: '✖'
  },
  warning: {
    border: 'border-warning-yellow',
    text: 'text-warning-yellow',
    icon: '⚠'
  },
  info: {
    border: 'border-info-blue',
    text: 'text-info-blue',
    icon: 'ℹ'
  }
}

const VALID_NAMESPACES = ['ui:', 'events:', 'venues:', 'items:', 'economy:']

/**
 * Recursively translates translation keys within a context object and filters forbidden keys.
 * @param {any} context - The context object to translate and sanitize.
 * @param {Function} t - The translation function.
 * @returns {any} The sanitized and translated context.
 */
export const translateContextKeys = (context, t) => {
  // Handle null or non-object types (e.g., from JSON.parse("null") or literals)
  if (
    context === null ||
    typeof context !== 'object' ||
    Array.isArray(context)
  ) {
    return context
  }

  const translatedContext = {}
  for (const prop of Object.keys(context)) {
    // SECURITY: Skip forbidden keys to prevent prototype pollution or other injection
    if (isForbiddenKey(prop)) continue

    const value = context[prop]

    if (typeof value === 'string') {
      const isTranslationKey = VALID_NAMESPACES.some(ns => value.startsWith(ns))
      translatedContext[prop] = isTranslationKey ? t(value) : value
    } else if (typeof value === 'object' && value !== null) {
      // SECURITY: Recurse into nested objects to sanitize and translate
      translatedContext[prop] = translateContextKeys(value, t)
    } else {
      translatedContext[prop] = value
    }
  }
  return translatedContext
}

/**
 * Renders global toast notifications with consistent visual taxonomy.
 * Supports pipe-separated translation payload format (e.g. `ui:key|{"context":"value"}`)
 * where `ui:key` acts as the translation template and the JSON provides context parameters.
 * Note that some components like `usePurchaseLogic.js` pre-translate strings before calling `addToast`,
 * which this component also correctly handles.
 *
 * @returns {JSX.Element} Toast stack overlay.
 */
export const ToastOverlay = () => {
  const { toasts, removeToast } = useGameState()
  const { t } = useTranslation(['ui', 'events', 'venues', 'items', 'economy'])

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
          return <ToastItem key={toast.id} toast={toast} t={t} removeToast={removeToast} style={style} />
        })}
      </AnimatePresence>
    </div>
  )
}
