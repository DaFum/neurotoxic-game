import { useState, useEffect, useCallback, memo } from 'react'
import { audioManager } from '../utils/AudioManager'

export const ToggleRadio = memo(() => {
  const [isPlaying, setIsPlaying] = useState(
    () => audioManager.currentSongId === 'ambient' && audioManager.isPlaying
  )

  // Poll periodically to catch external audio changes without a global event bus.
  useEffect(() => {
    const derive = () =>
      audioManager.currentSongId === 'ambient' && audioManager.isPlaying
    setIsPlaying(derive())
    const id = setInterval(() => setIsPlaying(derive()), 1000)
    return () => clearInterval(id)
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
