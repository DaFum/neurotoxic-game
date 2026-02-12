/**
 * Returns the most reliable AudioContext state using raw context first.
 * @param {object} params - Candidate context states.
 * @param {string|undefined|null} params.rawContextState - Web Audio state.
 * @param {string|undefined|null} params.toneContextState - Tone.js context state.
 * @returns {string} Preferred state string or `unknown` when unavailable.
 */
export function getPreferredAudioContextState({
  rawContextState,
  toneContextState
}) {
  if (typeof rawContextState === 'string') return rawContextState
  if (typeof toneContextState === 'string') return toneContextState
  return 'unknown'
}

/**
 * Determines whether the AudioContext can be resumed.
 * @param {string} state - AudioContext state.
 * @returns {boolean} True when `resume()` is a valid recovery path.
 */
export function canResumeAudioContextState(state) {
  return state === 'suspended' || state === 'interrupted'
}

/**
 * Determines whether the AudioContext state is closed.
 * @param {string} state - AudioContext state.
 * @returns {boolean} True when the context is closed and must be rebuilt.
 */
export function isClosedAudioContextState(state) {
  return state === 'closed'
}

/**
 * Selects the most reliable context object to resume.
 * @param {object} params - Resume target candidates.
 * @param {object|null|undefined} params.toneContext - Tone.js context wrapper.
 * @param {object|null|undefined} params.rawContext - Native AudioContext.
 * @returns {object|null} Resumable context object or null when unavailable.
 */
export function getAudioResumeTarget({ toneContext, rawContext }) {
  if (typeof toneContext?.resume === 'function') return toneContext
  if (typeof rawContext?.resume === 'function') return rawContext
  return null
}
