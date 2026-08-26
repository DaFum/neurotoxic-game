import { createContext, use } from 'react'
import type { ReactNode } from 'react'
import { toneAudioEngine } from '../utils/audio/audioEngineInterface'
import type { IAudioEngine } from '../utils/audio/audioEngineInterface'

const AudioEngineContext = createContext<IAudioEngine>(toneAudioEngine)

/**
 * Provides a gig-audio engine to the tree below. Tests and CI pass a
 * `NullAudioEngine` or a stub whose gig clock they drive.
 *
 * @param props - Engine to provide (defaults to `toneAudioEngine`) and the
 * subtree receiving it.
 *
 * @remarks
 * `engine` is optional so the composition root can mount the seam without
 * importing `toneAudioEngine` itself: `src/utils/audio/AGENTS.md` requires
 * outside imports to go through the `audioEngine.ts` hub, and this module is
 * the one place that legitimately resolves the real engine.
 */
export const AudioEngineProvider = ({
  engine = toneAudioEngine,
  children
}: {
  engine?: IAudioEngine
  children: ReactNode
}) => <AudioEngineContext value={engine}>{children}</AudioEngineContext>

/**
 * Reads the injected gig-audio engine.
 *
 * @returns The engine provided by the nearest `AudioEngineProvider`, or
 * `toneAudioEngine`.
 */
export const useAudioEngine = (): IAudioEngine => use(AudioEngineContext)
