import { useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAudioControl } from '../hooks/useAudioControl'
import { RazorPlayIcon } from '../ui/shared/Icons'
import { Tooltip } from '../ui/shared'

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
        className='radio-btn'
        aria-label={label}
      >
        {isPlaying ? (
          '■'
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14"><polygon points="3,2 12,7 3,12" fill="currentColor"/></svg>
        )}
      </button>
    </Tooltip>
  )
})

ToggleRadio.displayName = 'ToggleRadio'
