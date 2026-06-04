/**
 * Returns the most reliable AudioContext state using raw context first.
 * @param params - Candidate context states.
 * - `params.rawContextState` - Web Audio state.
 * - `params.toneContextState` - Tone.js context state.
 * @returns Preferred state string or `unknown` when unavailable.
 */
export function getPreferredAudioContextState({
  rawContextState,
  toneContextState
}: {
  rawContextState?: string | null
  toneContextState?: string | null
}): string {
  if (typeof rawContextState === 'string') return rawContextState
  if (typeof toneContextState === 'string') return toneContextState
  return 'unknown'
}

/**
 * Determines whether the AudioContext can be resumed.
 * @param state - AudioContext state.
 * @returns True when `resume()` is a valid recovery path.
 */
export function canResumeAudioContextState(state: string): boolean {
  return state === 'suspended' || state === 'interrupted'
}

/**
 * Determines whether the AudioContext state is closed.
 * @param state - AudioContext state.
 * @returns True when the context is closed and must be rebuilt.
 */
export function isClosedAudioContextState(state: string): boolean {
  return state === 'closed'
}
