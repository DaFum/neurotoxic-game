/**
 * Calculates a scheduled Tone.js time in milliseconds for hit playback.
 * @param {object} params - Timing parameters.
 * @param {number} params.noteTimeMs - Target note time in ms (gig clock).
 * @param {number} params.gigTimeMs - Current gig clock time in ms.
 * @param {number} params.audioTimeMs - Current Tone.js audio time in ms.
 * @param {number} [params.maxLeadMs=30] - Maximum lead time in ms for scheduling.
 * @returns {number} Scheduled Tone.js time in ms.
 */
export const getScheduledHitTimeMs = ({
  noteTimeMs,
  gigTimeMs,
  audioTimeMs,
  maxLeadMs = 30
}) => {
  const safeNoteTimeMs = Number.isFinite(noteTimeMs) ? noteTimeMs : 0
  const safeGigTimeMs = Number.isFinite(gigTimeMs) ? gigTimeMs : 0
  const safeAudioTimeMs = Number.isFinite(audioTimeMs) ? audioTimeMs : 0
  const safeMaxLeadMs = Number.isFinite(maxLeadMs) ? Math.max(0, maxLeadMs) : 0

  const timeOffsetMs = safeAudioTimeMs - safeGigTimeMs
  const noteTimeInAudioMs = safeNoteTimeMs + timeOffsetMs
  const deltaMs = noteTimeInAudioMs - safeAudioTimeMs

  if (deltaMs > 0 && deltaMs <= safeMaxLeadMs) {
    return noteTimeInAudioMs
  }

  return safeAudioTimeMs
}
