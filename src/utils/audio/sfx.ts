import * as Tone from 'tone'
import { logger } from '../logger'
import { clampUnit } from '../numberUtils'
import { audioState } from './state'

/**
 * Plays a one-shot UI/gameplay sound effect on the shared SFX synth.
 *
 * @remarks
 * No-op until the audio engine is set up. An unrecognized `type` is logged as a
 * warning and produces no sound.
 *
 * @param type - Effect id, e.g. `'hit'`, `'miss'`, `'menu'`, `'travel'`, `'cash'`, `'crash'`, `'honk'`, `'pickup'`, `'deliver'`, or `'void_hit'`.
 */
export function playSFX(type: string): void {
  if (!audioState.isSetup || !audioState.sfxSynth) return

  const now = Tone.now()
  switch (type) {
    case 'hit':
      // High pitch success ping
      audioState.sfxSynth.triggerAttackRelease('A5', '16n', now)
      break
    case 'miss':
      // Low discordant buzz
      audioState.sfxSynth.triggerAttackRelease('D2', '8n', now)
      break
    case 'menu':
      // Gentle blip
      audioState.sfxSynth.triggerAttackRelease('C5', '32n', now, 0.3)
      break
    case 'travel':
      // Engine-like rumble using drum kick if available, or low synth
      if (audioState.drumKit && audioState.drumKit.kick) {
        audioState.drumKit.kick.triggerAttackRelease('C1', '8n', now, 0.5)
      } else {
        audioState.sfxSynth.triggerAttackRelease('G1', '8n', now, 0.5)
      }
      break
    case 'cash':
      // Bright chime/coin sound
      audioState.sfxSynth.triggerAttackRelease('B5', '16n', now, 0.4)
      audioState.sfxSynth.triggerAttackRelease('E6', '16n', now + 0.05, 0.4)
      break
    case 'crash':
      // Low noise burst
      audioState.sfxSynth.triggerAttackRelease('C1', '8n', now, 1.0)
      audioState.sfxSynth.triggerAttackRelease('F1', '8n', now + 0.02, 0.8)
      break
    case 'honk':
      // Car horn
      audioState.sfxSynth.triggerAttackRelease('F#4', '8n', now, 0.6)
      audioState.sfxSynth.triggerAttackRelease('A4', '8n', now, 0.6)
      break
    case 'pickup':
      // Quick upward blip
      audioState.sfxSynth.triggerAttackRelease('C5', '32n', now, 0.5)
      audioState.sfxSynth.triggerAttackRelease('E5', '32n', now + 0.05, 0.5)
      break
    case 'deliver':
      // Heavy success thud
      audioState.sfxSynth.triggerAttackRelease('C2', '4n', now, 0.8)
      audioState.sfxSynth.triggerAttackRelease('G2', '4n', now, 0.6)
      break
    case 'void_hit':
      // Dissonant void impact — tritone cluster at low register
      audioState.sfxSynth.triggerAttackRelease('B1', '8n', now, 0.9)
      audioState.sfxSynth.triggerAttackRelease('F2', '8n', now + 0.03, 0.7)
      audioState.sfxSynth.triggerAttackRelease('C#2', '16n', now + 0.06, 0.5)
      break
    default:
      logger.warn('AudioEngine', `Unknown SFX type: ${type}`)
      break
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
