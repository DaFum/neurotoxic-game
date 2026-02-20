import { useSyncExternalStore, useCallback, memo } from 'react'
import { audioManager } from '../utils/AudioManager'

export const ToggleRadio = memo(() => {
  const subscribe = useCallback(listener => {
    if (typeof audioManager.subscribe === 'function') {
      return audioManager.subscribe(listener)
    }

    const pollId = setInterval(listener, 1000)
    return () => clearInterval(pollId)
  }, [])

  const getSnapshot = useCallback(
    () => audioManager.currentSongId === 'ambient' && audioManager.isPlaying,
    []
  )

  const isPlaying = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const toggle = useCallback(() => {
    if (isPlaying) {
      audioManager.stopMusic()
    } else {
      audioManager
        .resumeMusic()
        .then(started => {
          if (!started && typeof audioManager.emitChange === 'function') {
            audioManager.emitChange()
          }
        })
        .catch(() => {
          if (typeof audioManager.emitChange === 'function') {
            audioManager.emitChange()
          }
        })
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
