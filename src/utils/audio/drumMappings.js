import { audioState } from './state.js'

// ⚡ BOLT OPTIMIZATION: Direct handler dispatch avoids string comparisons and property lookups
// on the critical audio scheduling path.
const DRUM_HANDLER_IDX = {
  KICK: 0,
  SNARE: 1,
  HIHAT: 2,
  CRASH: 3
}

const DRUM_HANDLERS = [
  // 0: Kick (note, duration)
  (kit, map, time, vel) =>
    kit.kick.triggerAttackRelease(map.note, map.duration, time, vel),
  // 1: Snare (duration)
  (kit, map, time, vel) =>
    kit.snare.triggerAttackRelease(map.duration, time, vel),
  // 2: HiHat (freq, duration)
  (kit, map, time, vel) =>
    kit.hihat.triggerAttackRelease(map.freq, map.duration, time, vel),
  // 3: Crash (freq, duration)
  (kit, map, time, vel) =>
    kit.crash.triggerAttackRelease(map.freq, map.duration, time, vel)
]

const DRUM_MAPPING = new Array(128)
// Kick
DRUM_MAPPING[35] = {
  handler: DRUM_HANDLER_IDX.KICK,
  note: 'C1',
  duration: '8n',
  velScale: 1
}
DRUM_MAPPING[36] = {
  handler: DRUM_HANDLER_IDX.KICK,
  note: 'C1',
  duration: '8n',
  velScale: 1
}
// Snare (LayeredSnare takes duration, time, velocity)
DRUM_MAPPING[37] = {
  handler: DRUM_HANDLER_IDX.SNARE,
  duration: '32n',
  velScale: 0.4
}
DRUM_MAPPING[38] = {
  handler: DRUM_HANDLER_IDX.SNARE,
  duration: '16n',
  velScale: 1
}
DRUM_MAPPING[40] = {
  handler: DRUM_HANDLER_IDX.SNARE,
  duration: '16n',
  velScale: 1
}
// HiHat (MetalSynth takes frequency, duration, time, velocity)
DRUM_MAPPING[42] = {
  handler: DRUM_HANDLER_IDX.HIHAT,
  freq: 8000,
  duration: '32n',
  velScale: 0.7
}
DRUM_MAPPING[44] = {
  handler: DRUM_HANDLER_IDX.HIHAT,
  freq: 8000,
  duration: '32n',
  velScale: 0.7
}
DRUM_MAPPING[46] = {
  handler: DRUM_HANDLER_IDX.HIHAT,
  freq: 6000,
  duration: '16n',
  velScale: 0.8
}
// Crash
DRUM_MAPPING[49] = {
  handler: DRUM_HANDLER_IDX.CRASH,
  freq: 4000,
  duration: '4n',
  velScale: 0.7
}
DRUM_MAPPING[57] = {
  handler: DRUM_HANDLER_IDX.CRASH,
  freq: 4000,
  duration: '4n',
  velScale: 0.7
}
// Ride (mapped to HiHat)
DRUM_MAPPING[51] = {
  handler: DRUM_HANDLER_IDX.HIHAT,
  freq: 5000,
  duration: '8n',
  velScale: 0.5
}
DRUM_MAPPING[59] = {
  handler: DRUM_HANDLER_IDX.HIHAT,
  freq: 5000,
  duration: '8n',
  velScale: 0.5
}
// Toms (mapped to Kick)
DRUM_MAPPING[41] = {
  handler: DRUM_HANDLER_IDX.KICK,
  note: 'G1',
  duration: '8n',
  velScale: 0.8
}
DRUM_MAPPING[43] = {
  handler: DRUM_HANDLER_IDX.KICK,
  note: 'G1',
  duration: '8n',
  velScale: 0.8
}
DRUM_MAPPING[45] = {
  handler: DRUM_HANDLER_IDX.KICK,
  note: 'D2',
  duration: '8n',
  velScale: 0.7
}
DRUM_MAPPING[47] = {
  handler: DRUM_HANDLER_IDX.KICK,
  note: 'D2',
  duration: '8n',
  velScale: 0.7
}
DRUM_MAPPING[48] = {
  handler: DRUM_HANDLER_IDX.KICK,
  note: 'A2',
  duration: '8n',
  velScale: 0.6
}
DRUM_MAPPING[50] = {
  handler: DRUM_HANDLER_IDX.KICK,
  note: 'A2',
  duration: '8n',
  velScale: 0.6
}

/**
 * Triggers a specific drum sound based on MIDI pitch.
 * @param {number} midiPitch - The MIDI note number.
 * @param {number} time - The time to trigger the note.
 * @param {number} velocity - The velocity of the note (0-1).
 */
export function playDrumNote(
  midiPitch,
  time,
  velocity,
  kit = audioState.drumKit
) {
  if (!kit) return

  // ⚡ BOLT OPTIMIZATION: O(1) array lookup and direct handler execution
  const map = DRUM_MAPPING[midiPitch]
  const handler = map ? DRUM_HANDLERS[map.handler] : null

  if (handler) {
    handler(kit, map, time, velocity * map.velScale)
  } else {
    // Default to closed HiHat for unknown percussion or missing handler
    kit.hihat.triggerAttackRelease(8000, '32n', time, velocity * 0.4)
  }
}
