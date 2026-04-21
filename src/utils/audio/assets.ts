import { logger } from '../logger'
import {
  buildAssetUrlMap,
  resolveAssetUrl,
  PATH_PREFIX_REGEX,
  getBaseAssetPath
} from './playbackUtils'
import { getRawAudioContext } from './context'
import { audioState } from './state'
import {
  AUDIO_BUFFER_LOAD_TIMEOUT_MS,
  AUDIO_BUFFER_DECODE_TIMEOUT_MS,
  MAX_AUDIO_BUFFER_CACHE_SIZE,
  MAX_AUDIO_BUFFER_BYTE_SIZE
} from './constants'

// Import all MIDI/OGG files as URLs (Vite `import.meta.glob`).
// Use the literal `import.meta.glob(...)` call so Vite's transform can
// statically replace the call at build/test time.
const midiGlob =
  typeof import.meta.glob === 'function'
    ? import.meta.glob('../../assets/**/*.mid', {
        query: '?url',
        import: 'default',
        eager: true
      })
    : {}

const oggGlob =
  typeof import.meta.glob === 'function'
    ? import.meta.glob('../../assets/**/*.ogg', {
        query: '?url',
        import: 'default',
        eager: true
      })
    : {}

// Create a map of relative asset path + basename -> URL
// Key format in glob is "../../assets/path/to/filename.mid"
export const midiUrlMap = buildAssetUrlMap(
  midiGlob,
  message => logger.warn('AudioEngine', message),
  'MIDI'
)

const oggUrlMap = buildAssetUrlMap(
  oggGlob,
  message => logger.warn('AudioEngine', message),
  'Audio'
)

// Log bundled OGG inventory at module load for diagnostics.
// oggUrlMap stores both full relative paths and basenames; prefer full paths for accurate count.
const oggAssetKeys = Object.keys(oggUrlMap).filter(k => k.endsWith('.ogg'))
// Cache candidate list for ambient playback to avoid repeated filtering
const fullPathCandidates = oggAssetKeys.filter(k => k.includes('/'))
export const oggCandidates =
  fullPathCandidates.length > 0 ? fullPathCandidates : oggAssetKeys

// ⚡ BOLT OPTIMIZATION: Track in-flight requests to deduplicate concurrent loads
const pendingAudioRequests: Map<string, Promise<AudioBuffer | null>> = new Map()

if (oggCandidates.length > 0) {
  logger.info(
    'AudioEngine',
    `Bundled ${oggCandidates.length} OGG asset(s): ${oggCandidates.join(', ')}`
  )
} else {
  logger.warn(
    'AudioEngine',
    'No OGG assets bundled. Gig audio will fall back to MIDI playback.'
  )
}

/**
 * Checks whether the current browser can likely decode a given audio MIME type.
 * Uses HTMLAudioElement.canPlayType (available without user gesture).
 * @param {string} mimeType - e.g. 'audio/ogg; codecs=vorbis'
 * @returns {boolean} True when the browser reports 'probably' or 'maybe'.
 */
function canPlayAudioType(mimeType: string): boolean {
  try {
    const a = new Audio()
    const result = a.canPlayType(mimeType)
    return result === 'probably' || result === 'maybe'
  } catch (error) {
    logger.debug(
      'AudioEngine',
      'canPlayAudioType check failed, returning false.',
      error
    )
    return false
  }
}

/**
 * Checks whether an audio asset exists in the bundled map.
 * @param {string} filename - The audio filename to check.
 * @returns {boolean} True when the asset exists.
 */
export function hasAudioAsset(filename: string): boolean {
  if (typeof filename !== 'string') return false
  const normalized = filename.replace(PATH_PREFIX_REGEX, '')
  const basename = normalized.split('/').pop()
  return Boolean(
    oggUrlMap?.[normalized] || (basename ? oggUrlMap?.[basename] : undefined)
  )
}

/**
 * Calculates the approximate byte size of an AudioBuffer in memory.
 * Assumes 32-bit float samples (4 bytes per sample).
 * @param {AudioBuffer} buffer - The buffer to measure.
 * @returns {number} Estimated size in bytes.
 */
function getAudioBufferSize(buffer: AudioBuffer | null | undefined): number {
  if (!buffer) return 0
  return (buffer.length || 0) * (buffer.numberOfChannels || 0) * 4
}

/**
 * Loads an audio buffer for Web Audio playback.
 * @param {string} filename - Audio filename (e.g. .ogg).
 * @returns {Promise<AudioBuffer|null>} Decoded audio buffer or null on failure.
 */
export async function loadAudioBuffer(
  filename: string
): Promise<AudioBuffer | null> {
  if (typeof filename !== 'string' || filename.length === 0) return null
  const cacheKey = filename.replace(PATH_PREFIX_REGEX, '')
  if (audioState.audioBufferCache.has(cacheKey)) {
    const cached = audioState.audioBufferCache.get(cacheKey)
    if (cached) {
      // Promote to most-recently-used for LRU eviction
      audioState.audioBufferCache.delete(cacheKey)
      audioState.audioBufferCache.set(cacheKey, cached)
      return cached
    }
  }

  // Return existing promise if already loading
  if (pendingAudioRequests.has(cacheKey)) {
    return pendingAudioRequests.get(cacheKey) as Promise<AudioBuffer | null>
  }

  const promise = loadAudioBufferInternal(filename, cacheKey)
  pendingAudioRequests.set(cacheKey, promise)

  try {
    return await promise
  } finally {
    pendingAudioRequests.delete(cacheKey)
  }
}

/**
 * Internal implementation of loading an audio buffer.
 * @param {string} filename - Audio filename.
 * @param {string} cacheKey - The cache key for storage.
 * @returns {Promise<AudioBuffer|null>} Decoded audio buffer or null.
 */
async function loadAudioBufferInternal(
  filename: string,
  cacheKey: string
): Promise<AudioBuffer | null> {
  const { publicBasePath } = getBaseAssetPath()
  const { url, source } = resolveAssetUrl(filename, oggUrlMap, publicBasePath)
  if (!url) {
    const keysPreview =
      oggCandidates.length <= 5
        ? oggCandidates.join(', ')
        : `${oggCandidates.slice(0, 5).join(', ')} … (${oggCandidates.length} total)`
    logger.warn(
      'AudioEngine',
      `Audio asset not found: "${filename}". Available OGG keys: [${keysPreview}]`
    )
    return null
  }
  if (source === 'public') {
    logger.warn(
      'AudioEngine',
      `Audio asset "${filename}" not found in bundle, falling back to public path: ${url}`
    )
  }

  try {
    // Avoid hanging gig initialization on stalled network/body reads.
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      AUDIO_BUFFER_LOAD_TIMEOUT_MS
    )
    let arrayBuffer = null
    try {
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) {
        logger.warn(
          'AudioEngine',
          `Failed to load audio "${filename}": HTTP ${response.status} from ${url}`
        )
        return null
      }
      arrayBuffer = await response.arrayBuffer()
    } finally {
      clearTimeout(timeoutId)
    }
    const rawContext = getRawAudioContext()
    let decodeTimeoutId = null
    const decodeTimeoutPromise = new Promise((_, reject) => {
      decodeTimeoutId = setTimeout(
        () => reject(new Error('AUDIO_DECODE_TIMEOUT')),
        AUDIO_BUFFER_DECODE_TIMEOUT_MS
      )
    })
    let buffer: AudioBuffer | null = null
    try {
      buffer = (await Promise.race([
        rawContext.decodeAudioData(arrayBuffer),
        decodeTimeoutPromise
      ])) as AudioBuffer | null
    } finally {
      if (decodeTimeoutId) clearTimeout(decodeTimeoutId)
    }

    if (!buffer) return null
    const newBufferSize = getAudioBufferSize(buffer)

    // Evict items until we are within both size and count limits.
    // We always allow at least one item (the new one) to remain, even if it exceeds the byte limit.
    for (const [oldestKey, oldestBuffer] of audioState.audioBufferCache) {
      if (
        (audioState.audioBufferCache.size < MAX_AUDIO_BUFFER_CACHE_SIZE ||
          MAX_AUDIO_BUFFER_CACHE_SIZE <= 0) &&
        audioState.currentCacheByteSize + newBufferSize <=
          MAX_AUDIO_BUFFER_BYTE_SIZE
      ) {
        break
      }

      audioState.currentCacheByteSize -= getAudioBufferSize(oldestBuffer)
      audioState.audioBufferCache.delete(oldestKey)
    }

    audioState.audioBufferCache.set(cacheKey, buffer)
    audioState.currentCacheByteSize += newBufferSize

    logger.debug(
      'AudioEngine',
      `Decoded audio buffer: "${filename}" (${buffer.duration.toFixed(1)}s, ${buffer.sampleRate}Hz, ${(newBufferSize / 1024 / 1024).toFixed(2)}MB). Cache: ${audioState.audioBufferCache.size} items, ${(audioState.currentCacheByteSize / 1024 / 1024).toFixed(2)}MB`
    )
    return buffer
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      logger.warn(
        'AudioEngine',
        `Audio fetch timed out for "${filename}" (${url})`
      )
    } else if (err instanceof Error && err.message === 'AUDIO_DECODE_TIMEOUT') {
      logger.warn(
        'AudioEngine',
        `Audio decode timed out for "${filename}" (${url})`
      )
    } else {
      const isOgg = filename.toLowerCase().endsWith('.ogg')
      const codecHint =
        isOgg && !canPlayAudioType('audio/ogg; codecs=vorbis')
          ? ' This browser may not support OGG Vorbis (e.g. Safari/iOS). Consider providing .m4a or .mp3 fallbacks.'
          : ''
      logger.warn(
        'AudioEngine',
        `Failed to decode audio buffer for "${filename}".${codecHint}`,
        err
      )
    }
    return null
  }
}
