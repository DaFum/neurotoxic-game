import { useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAudioControl } from '../hooks/useAudioControl'
import { RazorPlayIcon } from '../ui/shared/Icons'
import { Tooltip } from '../ui/shared'

/**
 * Toggles ambient radio playback from the compact HUD control.
 *
 * @remarks
 * The pressed state tracks only the `ambient` song, so unrelated audio playback
 * does not make the radio button appear active.
 */
export const ToggleRadio = memo(() => {
  const { t } = useTranslation()
  const { audioState: isPlaying, handleAudioChange } = useAudioControl(
    useCallback((state: unknown) => {
      if (typeof state !== 'object' || state === null) return false
      const audioState = state as {
        currentSongId?: unknown
        isPlaying?: unknown
      }
      return (
        audioState.currentSongId === 'ambient' && audioState.isPlaying === true
      )
    }, []),
    { pollEvenWithSubscribe: true, pollMs: 1000 }
  )

  const toggle = useCallback(() => {
    if (isPlaying) {
      handleAudioChange.stopMusic()
      return
    }

    void handleAudioChange.resumeMusic()
  }, [handleAudioChange, isPlaying])

  const label = isPlaying
    ? t('ui:radio.stop', 'Stop Radio')
    : t('ui:radio.play', 'Play/Resume Radio')

  return (
    <Tooltip content={label}>
      <button
        type='button'
        onClick={toggle}
        className='bg-[color:var(--color-void-black)] border-2 border-[color:var(--color-toxic-green)] text-[color:var(--color-toxic-green)] w-11 h-11 flex items-center justify-center hover:bg-[color:var(--color-toxic-green)] hover:text-[color:var(--color-void-black)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-toxic-green)] touch-manipulation'
        aria-label={label}
        aria-pressed={isPlaying}
      >
        {isPlaying ? (
          <span className='text-xl font-bold font-mono'>■</span>
        ) : (
          <RazorPlayIcon className='w-5 h-5 text-current' />
        )}
      </button>
    </Tooltip>
  )
})

ToggleRadio.displayName = 'ToggleRadio'
