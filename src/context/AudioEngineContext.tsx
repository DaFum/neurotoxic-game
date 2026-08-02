import { createContext, use } from 'react'
import type { ReactNode } from 'react'
import { toneAudioEngine } from '../utils/audio/audioEngineInterface'
import type { IAudioEngine } from '../utils/audio/audioEngineInterface'

const AudioEngineContext = createContext<IAudioEngine>(toneAudioEngine)

/**
 * Provides a gig-audio engine to the tree below. Tests and CI wrap with a
 * `NullAudioEngine` or a stub whose gig clock they drive; the app relies on the
 * `toneAudioEngine` default, so production needs no wiring.
 *
 * @param props - Engine to provide and the subtree receiving it.
 */
export const AudioEngineProvider = ({
  engine,
  children
}: {
  engine: IAudioEngine
  children: ReactNode
}) => <AudioEngineContext value={engine}>{children}</AudioEngineContext>

/**
 * Reads the injected gig-audio engine.
 *
 * @returns The engine provided by the nearest `AudioEngineProvider`, or
 * `toneAudioEngine`.
 */
export const useAudioEngine = (): IAudioEngine => use(AudioEngineContext)
