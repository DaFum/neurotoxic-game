import * as Tone from 'tone'
import { logger } from '../logger.js'
import { audioState } from './state.js'
import { calculateTimeFromTicks, preprocessTempoMap } from '../rhythmUtils.js'
import { prepareTransportPlayback } from './playbackUtils.js'
import { getNoteName } from './midiUtils.js'
import { triggerInstrumentNote } from './midiNotePlayback.js'

/**
 * Plays a song using predefined note data.
 * @param {object} song - The song object containing `notes` and `bpm`.
 * @param {number} [delay=0] - Delay in seconds before starting.
 */
export async function playSongFromData(song, delay = 0, options = {}) {
  const { success, reqId, normalizedOptions } =
    await prepareTransportPlayback(options)
  if (!success) return false
  const { onEnded } = normalizedOptions

  const bpm = Math.max(1, song.bpm || 120) // Ensure BPM is positive
  const tpb = Math.max(1, song.tpb || 480) // Ensure TPB is positive
  Tone.getTransport().bpm.value = bpm

  // Validate notes
  if (!Array.isArray(song.notes)) {
    logger.error('AudioEngine', 'playSongFromData: song.notes is not an array')
    return false
  }

  // Validate Audio Components
  if (!audioState.guitar || !audioState.bass || !audioState.drumKit) {
    logger.error(
      'AudioEngine',
      'playSongFromData: Audio components not initialized.'
    )
    return false
  }

  // Fallback if tempoMap is missing/empty
  const useTempoMap = Array.isArray(song.tempoMap) && song.tempoMap.length > 0
  const activeTempoMap = useTempoMap
    ? preprocessTempoMap(song.tempoMap, tpb)
    : []
  const validDelay = Number.isFinite(delay) ? Math.max(0, delay) : 0

  // ⚡ BOLT OPTIMIZATION: Single-pass O(N) loop replaces 4 array passes (filter->map->filter->reduce)
  // Minimizes garbage collection spikes and main-thread blocking during song initialization.
  const events = []
  let lastTime = 0

  for (let i = 0; i < song.notes.length; i++) {
    const n = song.notes[i]

    // Validate note data
    if (
      typeof n.t !== 'number' ||
      !isFinite(n.t) ||
      typeof n.p !== 'number' ||
      !isFinite(n.p) ||
      typeof n.v !== 'number' ||
      !isFinite(n.v)
    ) {
      continue
    }

    const time = useTempoMap
      ? calculateTimeFromTicks(n.t, tpb, activeTempoMap, 's')
      : (n.t / tpb) * (60 / bpm)

    // Delay is applied once when Transport starts; keep note times relative.
    const finalTime = Number.isFinite(time) ? time : -1

    // Filter out notes with invalid or negative times to prevent clustering/errors
    if (finalTime >= 0) {
      const rawVelocity = Math.max(0, Math.min(127, n.v))

      // Track the maximum time in this pass to avoid a subsequent .reduce()
      if (finalTime > lastTime) {
        lastTime = finalTime
      }

      // ⚡ BOLT OPTIMIZATION: Pre-compute note names to avoid audio-thread allocation
      const noteName = n.lane !== 'drums' ? getNoteName(n.p) : null

      events.push({
        time: finalTime,
        note: n.p,
        noteName, // Store pre-computed string
        velocity: rawVelocity / 127,
        lane: n.lane
      })
    }
  }

  if (events.length === 0) {
    logger.warn(
      'AudioEngine',
      'playSongFromData: No valid notes found to schedule'
    )
    return false
  }

  audioState.part = new Tone.Part((time, value) => {
    // ⚡ BOLT SAFETY: Wrap in try-catch to prevent scheduler interruptions
    try {
      if (!audioState.guitar || !audioState.bass || !audioState.drumKit) return

      // Use pre-computed noteName or fallback if missing (though it should be present)
      // ⚡ BOLT OPTIMIZATION: Avoid calling getNoteName if noteName is explicitly null (drums)
      const noteName =
        value.noteName === null
          ? null
          : (value.noteName ?? getNoteName(value.note))

      triggerInstrumentNote(
        value.lane,
        value.note,
        time,
        value.velocity,
        noteName
      )
    } catch (err) {
      // Log concisely and return early to keep the scheduler alive
      logger.error('AudioEngine', 'Error in Song callback', err)
    }
  }, events).start(0)

  // Schedule Transport.start in advance to prevent pops/crackles
  // Add minimum 100ms lookahead for reliable scheduling
  const minLookahead = 0.1
  const startTime = Tone.now() + Math.max(minLookahead, validDelay)

  if (onEnded) {
    // ⚡ BOLT OPTIMIZATION: Use pre-calculated lastTime instead of a fourth reduce pass
    const duration = lastTime + Tone.Time('4n').toSeconds()

    Tone.getTransport().scheduleOnce(() => {
      if (reqId !== audioState.playRequestId) return
      onEnded()
    }, duration)
  }

  Tone.getTransport().start(startTime)
  return true
}
