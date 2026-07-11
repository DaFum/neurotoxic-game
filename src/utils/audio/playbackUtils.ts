import * as Tone from 'tone'
import { logger } from '../logger'
import { audioState } from './state'
import { ensureAudioContext } from './context'
import { stopTransportAndClear, cleanupTransportEvents } from './cleanupUtils'

/**
 * Claims the next playback request and prepares the Tone.js transport for it.
 *
 * Normalizes options, advances the play request ID, unlocks the audio context,
 * clears existing transport events, and rejects the request if another caller
 * supersedes it while the audio context is unlocking.
 *
 * @param options - Candidate playback options.
 * @returns Playback preparation status, request ID, and normalized options.
 */
export async function prepareTransportPlayback(options: unknown = {}): Promise<{
  success: boolean
  reqId: number
  normalizedOptions: ReturnType<typeof normalizeMidiPlaybackOptions>
}> {
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
 * Normalizes untrusted playback options for Tone.js scheduling.
 *
 * Non-finite timing values become `null`; `useCleanPlayback` defaults to
 * `true`.
 *
 * @param options - Candidate playback settings.
 *
 * Supported option fields:
 * - `useCleanPlayback`: whether to bypass FX for MIDI playback. Defaults to `true`.
 * - `onEnded`: callback invoked when playback ends.
 * - `stopAfterSeconds`: playback duration limit in seconds.
 * - `startTimeSec`: absolute Tone.js time to start playback.
 *
 * @returns Safe playback options for MIDI and song-data scheduling.
 */
export const normalizeMidiPlaybackOptions = (
  options: unknown
): {
  useCleanPlayback: boolean
  onEnded: ((...args: unknown[]) => void) | null
  stopAfterSeconds: number | null
  startTimeSec: number | null
} => {
  const opt =
    typeof options === 'object' && options !== null
      ? (options as Record<string, unknown>)
      : {}
  const useCleanPlayback =
    typeof opt.useCleanPlayback === 'boolean'
      ? Boolean(opt.useCleanPlayback)
      : true
  const onEnded =
    typeof opt.onEnded === 'function'
      ? (opt.onEnded as (...args: unknown[]) => void)
      : null
  const stopAfterSeconds = Number.isFinite(opt.stopAfterSeconds as number)
    ? Math.max(0, Number(opt.stopAfterSeconds))
    : null
  const startTimeSec = Number.isFinite(opt.startTimeSec as number)
    ? Math.max(0, Number(opt.startTimeSec))
    : null

  return {
    useCleanPlayback,
    onEnded,
    stopAfterSeconds,
    startTimeSec
  }
}

/**
 * Matches one leading `"./"` or `"/"` prefix to strip from asset paths.
 */
export const PATH_PREFIX_REGEX = /^\.?\//

let cachedAssetPaths: { baseUrl: string; publicBasePath: string } | null = null

/**
 * Derives the Vite base URL and public assets fallback path.
 *
 * Computes once lazily and caches the result for repeated asset resolution.
 *
 * @returns Base URL and public assets fallback path.
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
 * Encodes a public asset path segment-by-segment while preserving slashes.
 *
 * Primarily used by `resolveAssetUrl`; exported for direct testing.
 *
 * @param assetPath - Asset path relative to the public base.
 * @returns Encoded path suitable for URL usage.
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
 * Resolves an asset URL from the Vite bundle map or public assets fallback.
 *
 * Checks an exact relative path key first, then a basename key, then builds an
 * encoded URL under `publicBasePath`.
 *
 * @param filename - Filename or relative path to the asset.
 * @param assetUrlMap - Map of asset keys to bundled URLs.
 * @param publicBasePath - Base path for public assets. Defaults to `'/assets'`.
 * @returns Resolved URL and whether it came from the bundle or public path.
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
 * Builds an asset URL lookup from a Vite asset glob.
 *
 * Duplicate basenames keep the first URL and emit a warning through `warn`.
 *
 * @param assetGlob - Vite glob map of asset paths to URLs.
 * @param warn - Warning callback for basename conflicts.
 * @param label - Label for conflict warnings. Defaults to `'Asset'`.
 * @returns Map of relative paths and basenames to URLs.
 */
export const buildAssetUrlMap = (
  assetGlob: unknown,
  warn: (message: string) => void = msg =>
    logger.warn('AudioEngine', msg.replace('[audioEngine] ', '')),
  label = 'Asset'
): Record<string, string> => {
  const accumulator: Record<string, string> = Object.create(null)
  if (!assetGlob || typeof assetGlob !== 'object') return accumulator
  const map = assetGlob as Record<string, unknown>
  for (const path of Object.keys(map)) {
    const urlRaw = map[path]
    const url = typeof urlRaw === 'string' ? urlRaw : String(urlRaw)
    const relativePath = path.replace(/^.*?\/assets\//, '')
    if (!Object.hasOwn(accumulator, relativePath)) {
      accumulator[relativePath] = url
    }

    const baseName = relativePath.split('/').pop()
    if (!baseName) continue

    const existingBasenameUrl = accumulator[baseName]
    if (!Object.hasOwn(accumulator, baseName)) {
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

  return accumulator
}
