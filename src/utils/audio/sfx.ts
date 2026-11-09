import * as Tone from 'tone'
import { logger } from '../logger'
import { clampUnit } from '../numberUtils'
import { audioState } from './state'

export interface SfxTrigger {
  readonly note: string
  readonly dur: string
  readonly offsetSec?: number
  readonly vel?: number
  readonly voice?: 'synth' | 'kick'
}

export const SFX_RECIPES = {
  hit: [{ note: 'A5', dur: '16n' }],
  miss: [{ note: 'D2', dur: '8n' }],
  menu: [{ note: 'C5', dur: '32n', vel: 0.3 }],
  travel: [{ note: 'C1', dur: '8n', vel: 0.5, voice: 'kick' }],
  cash: [
    { note: 'B5', dur: '16n', vel: 0.4 },
    { note: 'E6', dur: '16n', offsetSec: 0.05, vel: 0.4 }
  ],
  crash: [
    { note: 'C1', dur: '8n', vel: 1.0 },
    { note: 'F1', dur: '8n', offsetSec: 0.02, vel: 0.8 }
  ],
  honk: [
    { note: 'F#4', dur: '8n', vel: 0.6 },
    { note: 'A4', dur: '8n', vel: 0.6 }
  ],
  pickup: [
    { note: 'C5', dur: '32n', vel: 0.5 },
    { note: 'E5', dur: '32n', offsetSec: 0.05, vel: 0.5 }
  ],
  deliver: [
    { note: 'C2', dur: '4n', vel: 0.8 },
    { note: 'G2', dur: '4n', vel: 0.6 }
  ],
  void_hit: [
    { note: 'B1', dur: '8n', vel: 0.9 },
    { note: 'F2', dur: '8n', offsetSec: 0.03, vel: 0.7 },
    { note: 'C#2', dur: '16n', offsetSec: 0.06, vel: 0.5 }
  ]
} as const satisfies Record<string, readonly SfxTrigger[]>

export type AudioSfxType = keyof typeof SFX_RECIPES

/**
 * Plays a one-shot UI/gameplay sound effect on the shared SFX synth.
 *
 * @remarks
 * No-op until the audio engine is set up. An unrecognized `type` is logged as a
 * warning and produces no sound.
 *
 * @param type - Effect id, e.g. `'hit'`, `'miss'`, `'menu'`, `'travel'`, `'cash'`, `'crash'`, `'honk'`, `'pickup'`, `'deliver'`, or `'void_hit'`.
 */
export function playSFX(type: AudioSfxType | string): void {
  if (!Object.hasOwn(SFX_RECIPES, type)) {
    logger.warn('AudioEngine', `Unknown SFX type: ${type}`)
    return
  }

  if (!audioState.isSetup || !audioState.sfxSynth) return

  const recipe: readonly SfxTrigger[] = SFX_RECIPES[type as AudioSfxType]
  const now = Tone.now()

  for (const trigger of recipe) {
    const time = trigger.offsetSec != null ? now + trigger.offsetSec : now
    if (trigger.voice === 'kick' && audioState.drumKit?.kick) {
      audioState.drumKit.kick.triggerAttackRelease(
        trigger.note,
        trigger.dur,
        time,
        trigger.vel
      )
    } else {
      const note = trigger.voice === 'kick' ? 'G1' : trigger.note
      audioState.sfxSynth.triggerAttackRelease(
        note,
        trigger.dur,
        time,
        trigger.vel
      )
    }
  }
}

/**
 * Ramps the SFX gain node to a clamped linear volume.
 * @param vol - Volume between 0 and 1.
 * @returns True when applied to an existing gain node.
 */
export function setSFXVolume(vol: number): boolean {
  if (!audioState.sfxGain) return false
  // Convert 0-1 linear to decibels (approximate or use ramp)
  // Tone.Gain accepts linear values if units are default, but volume is typically db.
  // However, Tone.Gain.gain is linear amplitude.
  audioState.sfxGain.gain.rampTo(clampUnit(vol), 0.1)
  return true
}

/**
 * Sets the music volume using the dedicated music bus.
 * @param vol - Volume between 0 and 1.
 * @returns True when applied to an existing gain node.
 */
export function setMusicVolume(vol: number): boolean {
  if (!audioState.musicGain) return false
  const next = clampUnit(vol)
  audioState.musicGain.gain.rampTo(next, 0.1)
  return true
}
