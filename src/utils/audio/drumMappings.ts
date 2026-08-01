import { audioState } from './state'
import { clampUnit } from '../numberUtils'

/** Voice a MIDI percussion pitch is routed to. */
type DrumKind = 'kick' | 'snare' | 'hihat' | 'crash'

type DrumMap = {
  kind: DrumKind
  note?: string
  duration?: string
  freq?: number
  velScale?: number
}

type DrumKit = NonNullable<typeof audioState.drumKit>

/**
 * Dispatch table for MIDI drum events, keyed by the mapped voice.
 */
export const DRUM_HANDLERS: Record<
  DrumKind,
  (kit: DrumKit, map: DrumMap, time: number, vel: number) => void
> = {
  kick: (kit, map, time, vel) =>
    kit.kick.triggerAttackRelease(
      map.note ?? 'C1',
      map.duration ?? '8n',
      time,
      vel
    ),
  snare: (kit, map, time, vel) =>
    kit.snare.triggerAttackRelease(map.duration ?? '16n', time, vel),
  hihat: (kit, map, time, vel) =>
    kit.hihat.triggerAttackRelease(
      map.freq ?? 8000,
      map.duration ?? '32n',
      time,
      vel
    ),
  crash: (kit, map, time, vel) =>
    kit.crash.triggerAttackRelease(
      map.freq ?? 4000,
      map.duration ?? '4n',
      time,
      vel
    )
}

const DRUM_MAPPING = new Array(128)
// Kick
DRUM_MAPPING[35] = {
  kind: 'kick',
  note: 'C1',
  duration: '8n',
  velScale: 1
}
DRUM_MAPPING[36] = {
  kind: 'kick',
  note: 'C1',
  duration: '8n',
  velScale: 1
}
// Snare (LayeredSnare takes duration, time, velocity)
DRUM_MAPPING[37] = {
  kind: 'snare',
  duration: '32n',
  velScale: 0.4
}
DRUM_MAPPING[38] = {
  kind: 'snare',
  duration: '16n',
  velScale: 1
}
DRUM_MAPPING[40] = {
  kind: 'snare',
  duration: '16n',
  velScale: 1
}
// HiHat (MetalSynth takes frequency, duration, time, velocity)
DRUM_MAPPING[42] = {
  kind: 'hihat',
  freq: 8000,
  duration: '32n',
  velScale: 0.7
}
DRUM_MAPPING[44] = {
  kind: 'hihat',
  freq: 8000,
  duration: '32n',
  velScale: 0.7
}
DRUM_MAPPING[46] = {
  kind: 'hihat',
  freq: 6000,
  duration: '16n',
  velScale: 0.8
}
// Crash
DRUM_MAPPING[49] = {
  kind: 'crash',
  freq: 4000,
  duration: '4n',
  velScale: 0.7
}
DRUM_MAPPING[57] = {
  kind: 'crash',
  freq: 4000,
  duration: '4n',
  velScale: 0.7
}
// Ride (mapped to HiHat)
DRUM_MAPPING[51] = {
  kind: 'hihat',
  freq: 5000,
  duration: '8n',
  velScale: 0.5
}
DRUM_MAPPING[59] = {
  kind: 'hihat',
  freq: 5000,
  duration: '8n',
  velScale: 0.5
}
// Toms (mapped to Kick)
DRUM_MAPPING[41] = {
  kind: 'kick',
  note: 'G1',
  duration: '8n',
  velScale: 0.8
}
DRUM_MAPPING[43] = {
  kind: 'kick',
  note: 'G1',
  duration: '8n',
  velScale: 0.8
}
DRUM_MAPPING[45] = {
  kind: 'kick',
  note: 'D2',
  duration: '8n',
  velScale: 0.7
}
DRUM_MAPPING[47] = {
  kind: 'kick',
  note: 'D2',
  duration: '8n',
  velScale: 0.7
}
DRUM_MAPPING[48] = {
  kind: 'kick',
  note: 'A2',
  duration: '8n',
  velScale: 0.6
}
DRUM_MAPPING[50] = {
  kind: 'kick',
  note: 'A2',
  duration: '8n',
  velScale: 0.6
}

/**
 * Triggers the drum sound mapped to a MIDI percussion pitch.
 *
 * Velocity is clamped to 0-1. Unknown pitches fall back to a closed hihat.
 *
 * @param midiPitch - MIDI percussion note number.
 * @param time - Tone.js time when the drum sound should trigger.
 * @param velocity - Note velocity; non-finite and out-of-range values are clamped.
 * @param kit - Drum kit to trigger. Defaults to `audioState.drumKit`.
 */
export function playDrumNote(
  midiPitch: number,
  time: number,
  velocity: number,
  kit: DrumKit = audioState.drumKit as DrumKit
) {
  if (!kit) return

  const velRaw = Number.isFinite(velocity) ? velocity : 0
  const vel = clampUnit(velRaw)

  const map = DRUM_MAPPING[midiPitch] as DrumMap | undefined
  const handler = map ? DRUM_HANDLERS[map.kind] : null

  if (handler && map) {
    try {
      const scale = typeof map.velScale === 'number' ? map.velScale : 1
      handler(kit, map, time, vel * scale)
    } catch (_e) {
      // Ignored: Tone.js node likely disposed or context suspended
    }
  } else {
    // Default to closed HiHat for unknown percussion or missing handler
    try {
      kit.hihat.triggerAttackRelease(8000, '32n', time, vel * 0.4)
    } catch (_e) {
      // Ignored
    }
  }
}
