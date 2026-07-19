import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

// Array of explicit shortcut entries
const SHORTCUTS = [
  { key: '?', label: 'ui:shortcuts.toggleHelp' },
  { key: 'h', label: 'ui:shortcuts.toggleHelpAlt' },
  { key: 'm', label: 'ui:shortcuts.toggleMute' },
  { key: 'Esc', label: 'ui:shortcuts.closePanel' }
] as const

interface UseKeyboardShortcutsProps {
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>
  onToggleMute?: () => void
}

export function useKeyboardShortcuts({
  setShowHelp,
  onToggleMute
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return
      }

      switch (e.key) {
        case '?':
        case 'h':
          setShowHelp(prev => !prev)
          break
        case 'Escape':
          setShowHelp(false)
          break
        case 'm':
        case 'M':
          if (onToggleMute) {
            onToggleMute()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setShowHelp, onToggleMute])
}

interface KeyboardShortcutsPanelProps {
  showHelp: boolean
  className?: string
}

export function KeyboardShortcutsPanel({
  showHelp,
  className = ''
}: KeyboardShortcutsPanelProps) {
  const { t } = useTranslation(['ui'])

  if (!showHelp) return null

  return (
    <div
      id='shortcuts-panel'
      role='region'
      aria-label={t('ui:aria.shortcutsPanel', {
        defaultValue: 'Keyboard Shortcuts Panel'
      })}
      className={`bg-void-black/95 border border-warning-yellow p-3 text-warning-yellow shadow-[4px_4px_0px_var(--color-warning-yellow)] pointer-events-auto backdrop-blur-sm ${className}`}
    >
      <div className='flex items-center justify-between mb-2 border-b border-warning-yellow/30 pb-1'>
        <span className='font-bold uppercase tracking-wider text-xs'>
          {t('ui:shortcuts.title', { defaultValue: 'KEYBOARD SHORTCUTS' })}
        </span>
        <X size={14} className='opacity-50' aria-hidden='true' />
      </div>
      <div className='flex flex-col gap-1.5'>
        {SHORTCUTS.map(({ key, label }) => (
          <div key={key} className='flex justify-between items-center text-xs'>
            <span className='text-star-white/80'>
              {t(label as Parameters<typeof t>[0], {
                defaultValue: label.split('.').pop()
              })}
            </span>
            <kbd className='bg-ash-gray text-void-black px-1.5 rounded font-bold min-w-5 text-center uppercase shadow-[1px_1px_0px_var(--color-star-white)]'>
              {key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  )
}
