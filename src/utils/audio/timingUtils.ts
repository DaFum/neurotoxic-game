/**
 * Calculates a scheduled Tone.js time in milliseconds for hit playback.
 * @param params - Timing parameters.
 * - `params.noteTimeMs` - Target note time in ms (gig clock).
 * - `params.gigTimeMs` - Current gig clock time in ms.
 * - `params.audioTimeMs` - Current Tone.js audio time in ms.
 * - `params.maxLeadMs` - Maximum lead time in ms for scheduling. Defaults to `30`.
 * @returns Scheduled Tone.js time in ms.
 */
export const getScheduledHitTimeMs = ({
  noteTimeMs,
  gigTimeMs,
  audioTimeMs,
  maxLeadMs = 30
}: {
  noteTimeMs: number
  gigTimeMs: number
  audioTimeMs: number
  maxLeadMs?: number
}): number => {
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
