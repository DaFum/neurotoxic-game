import { useCallback, memo } from 'react'
import { useAudioControl } from '../hooks/useAudioControl'

export const ToggleRadio = memo(() => {
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
      className='bg-(--void-black) border border-(--toxic-green) text-(--toxic-green) px-2 py-1 text-xs uppercase hover:bg-(--toxic-green) hover:text-(--void-black) font-mono'
      title={isPlaying ? 'Stop Radio' : 'Play/Resume Radio'}
      aria-label={isPlaying ? 'Stop Radio' : 'Play/Resume Radio'}
    >
      {isPlaying ? '■' : '▶'}
    </button>
  )
})

ToggleRadio.displayName = 'ToggleRadio'
