import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Menu, X, Volume2, VolumeX, HelpCircle, Pause } from 'lucide-react'
import { Tooltip, KeyboardShortcutsPanel } from '../../ui/shared'
import { useAudioControl } from '../../hooks/useAudioControl'

/**
 * Configuration properties for the collapsed gig controls cluster.
 */
interface GigControlsClusterProps {
  /** Callback invoked when the user toggles the pause state. */
  onTogglePause?: () => void
  /** Indicates whether the gig is over, disabling the pause functionality. */
  isGameOver?: boolean
}

const BUTTON_BASE =
  'pointer-events-auto bg-void-black/90 border-2 w-12 h-12 flex items-center justify-center transition-all touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'

/**
 * Collapses the volume, keyboard-help, and pause buttons behind a single
 * top-left toggle so the gig HUD stays uncluttered during play.
 *
 * @remarks
 * The keyboard shortcuts (M to mute, ESC to pause) keep working regardless of
 * whether the cluster is expanded; this only hides the visual buttons.
 *
 * @returns The collapsed controls cluster for the gig HUD.
 */
export const GigControlsCluster = memo(function GigControlsCluster({
  onTogglePause,
  isGameOver
}: GigControlsClusterProps) {
  const { t } = useTranslation(['ui'])
  const [isOpen, setIsOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const { audioState, handleAudioChange } = useAudioControl()

  return (
    <div className='absolute top-4 left-4 z-(--z-hud) pointer-events-none'>
      <div className='flex gap-1.5'>
        <Tooltip
          content={t('ui:gig.controlsHint', { defaultValue: 'Game Controls' })}
        >
          <button
            type='button'
            onClick={() => {
              setIsOpen(prev => !prev)
              setShowHelp(false)
            }}
            aria-expanded={isOpen}
            aria-label={t('ui:gig.controlsAria', {
              defaultValue: 'Toggle game controls'
            })}
            className={`${BUTTON_BASE} border-toxic-green text-toxic-green hover:bg-toxic-green hover:text-void-black focus-visible:ring-toxic-green`}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </Tooltip>

        {isOpen && (
          <>
            <Tooltip
              content={
                audioState.isMuted
                  ? t('ui:button.unmute', { defaultValue: 'Unmute (M)' })
                  : t('ui:button.mute', { defaultValue: 'Mute (M)' })
              }
            >
              <button
                type='button'
                onClick={handleAudioChange.toggleMute}
                aria-label={t('ui:aria.toggleMuteSystem', {
                  defaultValue: 'Toggle mute system'
                })}
                aria-pressed={audioState.isMuted}
                className={`${BUTTON_BASE} ${
                  audioState.isMuted
                    ? 'border-ash-gray text-ash-gray hover:bg-ash-gray hover:text-void-black focus-visible:ring-ash-gray'
                    : 'border-toxic-green text-toxic-green hover:bg-toxic-green hover:text-void-black focus-visible:ring-toxic-green'
                }`}
              >
                {audioState.isMuted ? (
                  <VolumeX size={20} />
                ) : (
                  <Volume2 size={20} />
                )}
              </button>
            </Tooltip>
            <Tooltip
              content={t('ui:button.shortcuts', {
                defaultValue: 'Shortcuts (?, h)'
              })}
            >
              <button
                type='button'
                onClick={() => setShowHelp(prev => !prev)}
                aria-expanded={showHelp}
                aria-controls='shortcuts-panel'
                aria-label={t('ui:aria.shortcutsHelp', {
                  defaultValue: 'Toggle keyboard shortcuts help'
                })}
                className={`${BUTTON_BASE} ${
                  showHelp
                    ? 'border-warning-yellow text-warning-yellow focus-visible:ring-warning-yellow'
                    : 'border-toxic-green text-toxic-green hover:bg-toxic-green hover:text-void-black focus-visible:ring-toxic-green'
                }`}
              >
                <HelpCircle size={20} />
              </button>
            </Tooltip>
            <Tooltip
              content={t('ui:gig.pause', { defaultValue: 'Pause Game (ESC)' })}
            >
              <button
                type='button'
                onClick={onTogglePause}
                aria-label={t('ui:gig.pauseAria', {
                  defaultValue: 'Pause Game'
                })}
                disabled={isGameOver}
                className={`${BUTTON_BASE} ${
                  isGameOver
                    ? 'opacity-50 pointer-events-none border-ash-gray text-ash-gray'
                    : 'border-toxic-green text-toxic-green hover:bg-toxic-green hover:text-void-black focus-visible:ring-toxic-green'
                }`}
              >
                <Pause size={20} />
              </button>
            </Tooltip>
          </>
        )}
      </div>

      {isOpen && (
        <KeyboardShortcutsPanel showHelp={showHelp} className='w-52 mt-2' />
      )}
    </div>
  )
})
