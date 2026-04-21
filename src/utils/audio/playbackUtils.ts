import * as Tone from 'tone'
import { audioState } from './state'
import { ensureAudioContext } from './context'
import { stopTransportAndClear, cleanupTransportEvents } from './cleanupUtils'

/**
 * Prepares the Tone.js transport for playback, returning normalized options and request ID.
 * @param {object} [options] - Playback options.
 * @returns {Promise<{success: boolean, reqId: number, normalizedOptions: object}>}
 */
export async function prepareTransportPlayback(
  options: any = {}
): Promise<{ success: boolean; reqId: number; normalizedOptions: any }> {
  const normalizedOptions = normalizeMidiPlaybackOptions(options)
  const reqId = ++audioState.playRequestId
  const unlocked = await ensureAudioContext()

  if (!unlocked || reqId !== audioState.playRequestId) {
    return { success: false, reqId, normalizedOptions }
  }

  stopTransportAndClear()
  cleanupTransportEvents()
  Tone.getTransport().position = 0

  return { success: true, reqId, normalizedOptions }
}

/**
 * Normalizes MIDI playback options.
 * @param {object} [options] - Optional playback settings.
 * @param {boolean} [options.useCleanPlayback=true] - Whether to bypass FX for MIDI playback.
 * @param {Function} [options.onEnded] - Callback invoked when playback ends.
 * @param {number} [options.stopAfterSeconds] - Optional playback duration limit in seconds.
 * @param {number} [options.startTimeSec] - Absolute Tone.js time to start playback.
 * @returns {{useCleanPlayback: boolean, onEnded: Function|null, stopAfterSeconds: number|null, startTimeSec: number|null}} Normalized options.
 */
export const normalizeMidiPlaybackOptions = (
  options: any
): {
  useCleanPlayback: boolean
  onEnded: ((...args: any[]) => void) | null
  stopAfterSeconds: number | null
  startTimeSec: number | null
} => {
  const useCleanPlayback =
    typeof options?.useCleanPlayback === 'boolean'
      ? options.useCleanPlayback
      : true
  const onEnded =
    typeof options?.onEnded === 'function' ? options.onEnded : null
  const stopAfterSeconds = Number.isFinite(options?.stopAfterSeconds)
    ? Math.max(0, options.stopAfterSeconds)
    : null
  const startTimeSec = Number.isFinite(options?.startTimeSec)
    ? Math.max(0, options.startTimeSec)
    : null

  return {
    useCleanPlayback,
    onEnded,
    stopAfterSeconds,
    startTimeSec
  }
}

/**
 * Path prefix regex to strip leading "./" or "/" from asset paths.
 */
export const PATH_PREFIX_REGEX = /^\.?\//

let cachedAssetPaths: { baseUrl: string; publicBasePath: string } | null = null

/**
 * Derives the base asset path and public base path from import.meta.
 * Computes once lazily and caches the result for performance.
 * @returns {{baseUrl: string, publicBasePath: string}} The resolved paths.
 */
export const getBaseAssetPath = (): {
  baseUrl: string
  publicBasePath: string
} => {
  if (!cachedAssetPaths) {
    const meta = import.meta as unknown as { env?: { BASE_URL?: string } }
    const rawBaseUrl = meta?.env?.BASE_URL ? meta.env.BASE_URL : './'
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl : `${rawBaseUrl}/`
    const publicBasePath = `${baseUrl}assets`
    cachedAssetPaths = { baseUrl, publicBasePath }
  }

  return cachedAssetPaths
}

/**
 * Resets the cached base asset path. Used for testing.
 */
export const __resetBaseAssetPathCache = (): void => {
  cachedAssetPaths = null
}

/**
 * Encodes a public asset path segment-by-segment to preserve slashes.
 * Primarily used by resolveAssetUrl; exported for direct testing.
 * @param {string} assetPath - Asset path relative to the public base.
 * @returns {string} Encoded path suitable for URL usage.
 */
export const encodePublicAssetPath = (assetPath: string): string => {
  if (typeof assetPath !== 'string') return ''
  const trimmedPath = assetPath.replace(/^\/+/, '')
  return trimmedPath
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/')
}

/**
 * Resolves an asset URL from the bundled map or a public fallback path.
 * @param {string} filename - Filename or relative path to the asset.
 * @param {Record<string, string>} assetUrlMap - Map of asset keys to bundled URLs.
 * @param {string} [publicBasePath='/assets'] - Base path for public assets.
 * @returns {{url: string|null, source: 'bundled'|'public'|null}} Resolved URL info.
 */
export const resolveAssetUrl = (
  filename: string,
  assetUrlMap: Record<string, string>,
  publicBasePath = '/assets'
): { url: string | null; source: 'bundled' | 'public' | null } => {
  if (typeof filename !== 'string' || filename.length === 0) {
    return { url: null, source: null }
  }

  const normalizedFilename = filename.replace(PATH_PREFIX_REGEX, '')
  const bundledUrl = assetUrlMap?.[normalizedFilename]
  if (bundledUrl) {
    return { url: bundledUrl, source: 'bundled' }
  }

  const baseName = normalizedFilename.split('/').pop()
  if (baseName && assetUrlMap?.[baseName]) {
    return { url: assetUrlMap[baseName], source: 'bundled' }
  }

  const trimmedBase = publicBasePath.replace(/\/+$/, '')
  const encodedPath = encodePublicAssetPath(normalizedFilename)
  if (encodedPath.length === 0) {
    return { url: null, source: null }
  }

  return {
    url: `${trimmedBase}/${encodedPath}`,
    source: 'public'
  }
}

/**
 * Builds an asset URL map with conflict detection for duplicate basenames.
 * @param {Record<string, string>} assetGlob - Vite glob map of asset paths to URLs.
 * @param {(message: string) => void} [warn] - Warning callback for conflicts.
 * @param {string} [label='Asset'] - Label for conflict warnings.
 * @returns {Record<string, string>} Map of relative paths and basenames to URLs.
 */
export const buildAssetUrlMap = (
  assetGlob: any,
  warn: (message: string) => void = console.warn,
  label = 'Asset'
): Record<string, string> => {
  const accumulator: Record<string, string> = {}
  for (const path in assetGlob || {}) {
    if (Object.hasOwn(assetGlob, path)) {
      const url = assetGlob[path]
      const relativePath = path.replace('../assets/', '')
      if (!accumulator[relativePath]) {
        accumulator[relativePath] = url
      }

      const baseName = relativePath.split('/').pop()
      if (!baseName) continue

      const existingBasenameUrl = accumulator[baseName]
      if (!existingBasenameUrl) {
        accumulator[baseName] = url
        continue
      }

      if (existingBasenameUrl !== url) {
        warn(
          `[audioEngine] ${label} basename conflict for "${baseName}". ` +
            `Keeping "${existingBasenameUrl}" and ignoring "${url}".`
        )
      }
    }
  }
  return accumulator
}
