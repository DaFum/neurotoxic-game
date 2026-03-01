import { useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAudioControl } from '../hooks/useAudioControl'
import { RazorPlayIcon } from '../ui/shared/Icons'

export const ToggleRadio = memo(() => {
  const { t } = useTranslation()
  const { audioState: isPlaying, handleAudioChange } = useAudioControl(
    useCallback(
      state => state.currentSongId === 'ambient' && state.isPlaying,
      []
    ),
    { pollEvenWithSubscribe: true, pollMs: 1000 }
  )

  const toggle = useCallback(() => {
    if (isPlaying) {
      handleAudioChange.stopMusic()
      return
    }

    void handleAudioChange.resumeMusic()
  }, [handleAudioChange, isPlaying])

  return (
    <button
      onClick={toggle}
      className='bg-(--void-black) border border-(--toxic-green) text-(--toxic-green) w-8 h-8 flex items-center justify-center hover:bg-(--toxic-green)/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--toxic-green)'
      title={isPlaying ? t('ui:radio.stop', 'Stop Radio') : t('ui:radio.play', 'Play/Resume Radio')}
      aria-label={isPlaying ? t('ui:radio.stop', 'Stop Radio') : t('ui:radio.play', 'Play/Resume Radio')}
    >
      {isPlaying ? (
        <span className="text-xl font-bold font-mono">■</span>
      ) : (
        <RazorPlayIcon className="w-5 h-5 text-(--toxic-green)" />
      )}
    </button>
  )
})

ToggleRadio.displayName = 'ToggleRadio'
