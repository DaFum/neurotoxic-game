export const MIN_NOTE_DURATION = 0.05
export const MAX_NOTE_DURATION = 10
export const AUDIO_BUFFER_LOAD_TIMEOUT_MS = 10000
export const AUDIO_BUFFER_DECODE_TIMEOUT_MS = 10000
export const MAX_AUDIO_BUFFER_CACHE_SIZE = 10
export const MAX_AUDIO_BUFFER_BYTE_SIZE = 50 * 1024 * 1024 // 50MB total cache size limit

export const HIHAT_CONFIG = {
  envelope: { attack: 0.001, decay: 0.06, release: 0.01 },
  harmonicity: 5.1,
  modulationIndex: 24,
  resonance: 5000,
  octaves: 1.2
}

export const CRASH_CONFIG = {
  envelope: { attack: 0.002, decay: 1.5, release: 0.1 },
  harmonicity: 3.5,
  modulationIndex: 12,
  resonance: 3000,
  octaves: 2.0
}
