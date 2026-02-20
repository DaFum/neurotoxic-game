import { useCallback, memo } from 'react'
import { useAudioControl } from '../hooks/useAudioControl'
import { audioManager } from '../utils/AudioManager'

export const ToggleRadio = memo(() => {
  const { audioState: isPlaying } = useAudioControl(
    useCallback(
      state => state.currentSongId === 'ambient' && state.isPlaying,
      []
    )
  )

  const toggle = useCallback(() => {
    if (isPlaying) {
      audioManager.stopMusic()
      return
    }

    void audioManager.resumeMusic()
  }, [isPlaying])

  return (
    <button
      onClick={toggle}
      className='bg-(--void-black) border border-(--toxic-green) text-(--toxic-green) px-2 py-1 text-xs uppercase hover:bg-(--toxic-green) hover:text-(--void-black) font-mono'
      title={isPlaying ? 'Stop Radio' : 'Play/Resume Radio'}
      aria-label={isPlaying ? 'Stop Radio' : 'Play/Resume Radio'}
    >
      {isPlaying ? '■' : '▶'}
    </button>
  )
})

ToggleRadio.displayName = 'ToggleRadio'
