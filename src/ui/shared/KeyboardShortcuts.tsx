import { memo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAudioControl } from '../../hooks/useAudioControl'

export interface KeyboardShortcutsProps {
  showHelp: boolean
  panelId?: string
  className?: string
}

export const useKeyboardShortcuts = (
  setShowHelp: (show: boolean | ((prev: boolean) => boolean)) => void
) => {
  const { handleAudioChange } = useAudioControl()

  useEffect(() => {
    const isInputTarget = (target: EventTarget | null) => {
      const element = target as HTMLElement | null
      if (!element) return false
      return (
        element.tagName === 'INPUT' ||
        element.tagName === 'TEXTAREA' ||
        element.tagName === 'SELECT' ||
        element.isContentEditable
      )
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isInputTarget(event.target)) return

      if (
        event.key === '?' ||
        (event.key === 'h' && !event.ctrlKey && !event.metaKey)
      ) {
        setShowHelp(prev => !prev)
        return
      }

      if (event.key === 'm' && !event.ctrlKey && !event.metaKey) {
        handleAudioChange.toggleMute()
        return
      }

      if (event.key === 'Escape') {
        setShowHelp(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleAudioChange, setShowHelp])
}

export const KeyboardShortcutsPanel = memo(
  ({
    showHelp,
    panelId = 'shortcuts-panel',
    className = ''
  }: KeyboardShortcutsProps) => {
    const { t } = useTranslation(['ui'])

    if (!showHelp) return null

    const shortcuts = [
      { key: '?, h', descKey: 'ui:shortcuts.toggleHelp', desc: 'Toggle this help' },
      { key: 'M', descKey: 'ui:shortcuts.mute', desc: 'Mute / Unmute' },
      { key: '1-4', descKey: 'ui:shortcuts.selectEvent', desc: 'Select event option' },
      { key: '\u2190\u2191\u2192', descKey: 'ui:shortcuts.hitNotes', desc: 'Hit notes (Gig)' },
      { key: 'ESC', descKey: 'ui:shortcuts.closeOverlays', desc: 'Close overlays' }
    ]

    return (
      <div
        id={panelId}
        className={`pointer-events-auto bg-void-black/95 border border-toxic-green p-3 shadow-[0_0_12px_var(--color-toxic-green-20)] ${className}`}
      >
        <div className='text-xs text-toxic-green tracking-widest uppercase mb-2 border-b border-toxic-green/30 pb-1'>
          {t('ui:keyboardShortcuts', {
            defaultValue: 'Keyboard Shortcuts'
          })}
        </div>
        {shortcuts.map(s => (
          <div
            key={s.key}
            className='flex items-center justify-between mb-1 last:mb-0'
          >
            <kbd className='text-xs bg-ash-gray/20 border border-ash-gray/40 px-1.5 py-0.5 text-star-white font-mono'>
              {s.key}
            </kbd>
            <span className='text-xs text-ash-gray'>
              {t(s.descKey, { defaultValue: s.desc })}
            </span>
          </div>
        ))}
      </div>
    )
  }
)

KeyboardShortcutsPanel.displayName = 'KeyboardShortcutsPanel'
