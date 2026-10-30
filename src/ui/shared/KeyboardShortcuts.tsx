import { InputHint } from './InputHint'
import { useActiveInputSource } from '../../utils/gamepad/inputSource'
import { useGamepadActions } from '../../hooks/gamepad/GamepadContext'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { HelpCircle, X } from 'lucide-react'
import { Tooltip } from './Tooltip'
import { hasActiveModal, isEditableKeyTarget } from './useModalBehavior'

// Array of explicit shortcut entries
const SHORTCUTS = [
  { key: '?', label: 'ui:shortcuts.toggleHelp' },
  { key: 'h', label: 'ui:shortcuts.toggleHelpAlt' },
  { key: 'm', label: 'ui:shortcuts.toggleMute' },
  { key: 'Esc', label: 'ui:shortcuts.closePanel' }
] as const

/**
 * Configuration properties for the useKeyboardShortcuts hook.
 */
interface UseKeyboardShortcutsProps {
  /** State setter to toggle the visibility of the help panel. */
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>
  /** Optional callback function to toggle application audio mute state. */
  onToggleMute?: () => void
}

/**
 * Hook to manage global keyboard shortcuts for the application.
 * Listens for keydown events and triggers corresponding UI actions,
 * bypassing events originating from input or editable elements to avoid interference.
 *
 * @param props - Configuration properties for the hook.
 */
export function useKeyboardShortcuts({
  setShowHelp,
  onToggleMute
}: UseKeyboardShortcutsProps) {
  useGamepadActions({
    onHelp: () => {
      if (!hasActiveModal() && !isEditableKeyTarget(document.activeElement))
        setShowHelp(prev => !prev)
    }
  })
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // An open dialog owns the keyboard; background shortcuts stay silent.
      if (hasActiveModal()) return

      // Don't trigger shortcuts when typing in inputs
      if (isEditableKeyTarget(e.target)) return

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

/**
 * Component properties for the KeyboardShortcutsPanel.
 */
interface KeyboardShortcutsPanelProps {
  /** Boolean indicating whether the panel should be visible. */
  showHelp: boolean
  /** Optional callback function to close the panel when the close button is clicked. */
  onClose?: () => void
  /** Optional CSS class name for custom styling. */
  className?: string
}

/**
 * A UI component that displays a panel listing available keyboard shortcuts.
 * The panel is conditionally rendered based on the provided visibility state.
 *
 * @param props - Component properties.
 * @returns The rendered keyboard shortcuts panel or null if hidden.
 */
export function KeyboardShortcutsPanel({
  showHelp,
  onClose,
  className = ''
}: KeyboardShortcutsPanelProps) {
  const { t } = useTranslation(['ui'])
  const source = useActiveInputSource()

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
        {onClose ? (
          <button
            type='button'
            onClick={onClose}
            aria-label={t('ui:shortcuts.closeAria', {
              defaultValue: 'Close keyboard shortcuts'
            })}
            className='opacity-70 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-yellow rounded p-0.5 cursor-pointer'
          >
            <X size={14} aria-hidden='true' />
          </button>
        ) : (
          <button
            type='button'
            disabled
            aria-label={t('ui:shortcuts.closeAria', {
              defaultValue: 'Close keyboard shortcuts'
            })}
            className='opacity-50 cursor-not-allowed p-0.5'
          >
            <X size={14} aria-hidden='true' />
          </button>
        )}
      </div>
      {source === 'gamepad' ? (
        <div className='flex flex-col gap-1.5'>
          {(
            [
              [
                'confirm',
                t('ui:controller.confirm', { defaultValue: 'Confirm' })
              ],
              ['back', t('ui:controller.back', { defaultValue: 'Back' })],
              [
                'menu',
                t('ui:controller.menu', { defaultValue: 'Menu / Pause' })
              ],
              ['help', t('ui:controller.help', { defaultValue: 'Help' })],
              [
                'direction',
                t('ui:controller.direction', {
                  defaultValue: 'Move / Navigate'
                })
              ]
            ] as const
          ).map(([action, label]) => (
            <div
              key={action}
              className='flex justify-between items-center text-xs'
            >
              <span>{label}</span>
              <InputHint action={action} />
            </div>
          ))}
          {(['guitar', 'drums', 'bass'] as const).map((lane, index) => (
            <div
              key={lane}
              className='flex justify-between items-center text-xs'
            >
              <span>{t(`ui:rhythm.lane_${lane}`)}</span>
              <InputHint action='lane' lane={index} />
            </div>
          ))}
        </div>
      ) : (
        <div className='flex flex-col gap-1.5'>
          {SHORTCUTS.map(({ key, label }) => (
            <div
              key={key}
              className='flex justify-between items-center text-xs'
            >
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
      )}
    </div>
  )
}

/**
 * Component properties for the ShortcutsToggle.
 */
interface ShortcutsToggleProps {
  /** Whether the shortcuts panel is currently shown. */
  showHelp: boolean
  /** Toggles the shortcuts panel. */
  onToggle: () => void
  /** Layout classes applied in both states. */
  className: string
  /** Classes applied while the panel is shown. */
  activeClassName: string
  /** Classes applied while the panel is hidden. */
  inactiveClassName: string
  /** Pixel size of the help icon. */
  iconSize: number
}

/**
 * Tooltip-wrapped button that toggles the {@link KeyboardShortcutsPanel}.
 *
 * @remarks
 * Owns the shared label, tooltip and ARIA wiring (`aria-pressed`,
 * `aria-expanded`, and `aria-controls` pointing at the panel only while it is
 * shown). Hosts keep the `showHelp` state and decide where the panel mounts.
 *
 * @param props - Panel state, toggle handler, and state-specific classes.
 */
export function ShortcutsToggle({
  showHelp,
  onToggle,
  className,
  activeClassName,
  inactiveClassName,
  iconSize
}: ShortcutsToggleProps) {
  const { t } = useTranslation(['ui'])

  return (
    <Tooltip
      content={t('ui:button.shortcuts', {
        defaultValue: 'Shortcuts (?, h)'
      })}
    >
      <button
        type='button'
        onClick={onToggle}
        aria-pressed={showHelp}
        aria-expanded={showHelp}
        aria-controls={showHelp ? 'shortcuts-panel' : undefined}
        aria-label={t('ui:aria.shortcutsHelp', {
          defaultValue: 'Toggle keyboard shortcuts help'
        })}
        className={`${className} ${showHelp ? activeClassName : inactiveClassName}`}
      >
        <HelpCircle size={iconSize} aria-hidden='true' />
      </button>
    </Tooltip>
  )
}
