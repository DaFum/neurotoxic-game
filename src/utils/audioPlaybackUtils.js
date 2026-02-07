/**
 * Normalizes MIDI playback options.
 * @param {object} [options] - Optional playback settings.
 * @param {boolean} [options.useCleanPlayback=true] - Whether to bypass FX for MIDI playback.
 * @param {Function} [options.onEnded] - Callback invoked when playback ends.
 * @param {number} [options.stopAfterSeconds] - Optional playback duration limit in seconds.
 * @returns {{useCleanPlayback: boolean, onEnded: Function|null, stopAfterSeconds: number|null}} Normalized options.
 */
export const normalizeMidiPlaybackOptions = options => {
  const useCleanPlayback =
    typeof options?.useCleanPlayback === 'boolean'
      ? options.useCleanPlayback
      : true
  const onEnded = typeof options?.onEnded === 'function' ? options.onEnded : null
  const stopAfterSeconds = Number.isFinite(options?.stopAfterSeconds)
    ? Math.max(0, options.stopAfterSeconds)
    : null

  return {
    useCleanPlayback,
    onEnded,
    stopAfterSeconds
  }
}

/**
 * Calculates remaining playback duration after applying an excerpt offset.
 * @param {number} totalSeconds - Total song duration in seconds.
 * @param {number} offsetSeconds - Excerpt offset in seconds.
 * @returns {number} Remaining playback duration in seconds.
 */
export const calculateRemainingDurationSeconds = (
  totalSeconds,
  offsetSeconds
) => {
  const safeTotal = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0
  const safeOffset = Number.isFinite(offsetSeconds)
    ? Math.max(0, offsetSeconds)
    : 0
  return Math.max(0, safeTotal - safeOffset)
}

/**
 * Encodes a public asset path segment-by-segment to preserve slashes.
 * @param {string} assetPath - Asset path relative to the public base.
 * @returns {string} Encoded path suitable for URL usage.
 */
export const encodePublicAssetPath = assetPath => {
  if (typeof assetPath !== 'string') return ''
  const trimmedPath = assetPath.replace(/^\/+/, '')
  return trimmedPath
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/')
}

/**
 * Resolves a MIDI asset URL from the bundled map or a public fallback path.
 * @param {string} filename - Filename or relative path to the MIDI asset.
 * @param {Record<string, string>} midiUrlMap - Map of asset keys to bundled URLs.
 * @param {string} [publicBasePath='/assets'] - Base path for public assets.
 * @returns {{url: string|null, source: 'bundled'|'public'|null}} Resolved URL info.
 */
export const resolveMidiAssetUrl = (
  filename,
  midiUrlMap,
  publicBasePath = '/assets'
) => {
  if (typeof filename !== 'string' || filename.length === 0) {
    return { url: null, source: null }
  }

  const normalizedFilename = filename.replace(/^\.?\//, '')
  const bundledUrl = midiUrlMap?.[normalizedFilename]
  if (bundledUrl) {
    return { url: bundledUrl, source: 'bundled' }
  }

  const baseName = normalizedFilename.split('/').pop()
  if (baseName && midiUrlMap?.[baseName]) {
    return { url: midiUrlMap[baseName], source: 'bundled' }
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
 * Builds a MIDI URL map with conflict detection for duplicate basenames.
 * @param {Record<string, string>} midiGlob - Vite glob map of asset paths to URLs.
 * @param {(message: string) => void} [warn] - Warning callback for conflicts.
 * @returns {Record<string, string>} Map of relative paths and basenames to URLs.
 */
export const buildMidiUrlMap = (midiGlob, warn = console.warn) => {
  const entries = Object.entries(midiGlob ?? {})
  return entries.reduce((accumulator, [path, url]) => {
    const relativePath = path.replace('../assets/', '')
    if (!accumulator[relativePath]) {
      accumulator[relativePath] = url
    }

    const baseName = relativePath.split('/').pop()
    if (!baseName) {
      return accumulator
    }

    const existingBasenameUrl = accumulator[baseName]
    if (!existingBasenameUrl) {
      accumulator[baseName] = url
      return accumulator
    }

    if (existingBasenameUrl !== url) {
      warn(
        `[audioEngine] MIDI basename conflict for "${baseName}". ` +
          `Keeping "${existingBasenameUrl}" and ignoring "${url}".`
      )
    }

    return accumulator
  }, {})
}
