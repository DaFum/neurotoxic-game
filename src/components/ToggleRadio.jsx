import { useState, useEffect, useCallback, memo } from 'react'
import { audioManager } from '../utils/AudioManager'

export const ToggleRadio = memo(() => {
  const [isPlaying, setIsPlaying] = useState(
    () => audioManager.currentSongId === 'ambient' && audioManager.isPlaying
  )

  useEffect(() => {
    setIsPlaying(
      audioManager.currentSongId === 'ambient' && audioManager.isPlaying
    )
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) {
      audioManager.stopMusic()
      setIsPlaying(false)
    } else {
      audioManager
        .resumeMusic()
        .then(started => {
          setIsPlaying(Boolean(started))
        })
        .catch(() => setIsPlaying(false))
    }
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
