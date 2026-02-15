/**
 * Normalizes MIDI playback options.
 * @param {object} [options] - Optional playback settings.
 * @param {boolean} [options.useCleanPlayback=true] - Whether to bypass FX for MIDI playback.
 * @param {Function} [options.onEnded] - Callback invoked when playback ends.
 * @param {number} [options.stopAfterSeconds] - Optional playback duration limit in seconds.
 * @param {number} [options.startTimeSec] - Absolute Tone.js time to start playback.
 * @returns {{useCleanPlayback: boolean, onEnded: Function|null, stopAfterSeconds: number|null, startTimeSec: number|null}} Normalized options.
 */
export const normalizeMidiPlaybackOptions = options => {
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
    ? options.startTimeSec
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
 * Resolves an asset URL from the bundled map or a public fallback path.
 * @param {string} filename - Filename or relative path to the asset.
 * @param {Record<string, string>} assetUrlMap - Map of asset keys to bundled URLs.
 * @param {string} [publicBasePath='/assets'] - Base path for public assets.
 * @returns {{url: string|null, source: 'bundled'|'public'|null}} Resolved URL info.
 */
export const resolveAssetUrl = (
  filename,
  assetUrlMap,
  publicBasePath = '/assets'
) => {
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
  assetGlob,
  warn = console.warn,
  label = 'Asset'
) => {
  const entries = Object.entries(assetGlob ?? {})
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
        `[audioEngine] ${label} basename conflict for "${baseName}". ` +
          `Keeping "${existingBasenameUrl}" and ignoring "${url}".`
      )
    }

    return accumulator
  }, {})
}

/**
 * Builds a MIDI URL map with conflict detection for duplicate basenames.
 * @param {Record<string, string>} midiGlob - Vite glob map of asset paths to URLs.
 * @param {(message: string) => void} [warn] - Warning callback for conflicts.
 * @returns {Record<string, string>} Map of relative paths and basenames to URLs.
 */
export const buildMidiUrlMap = (midiGlob, warn = console.warn) => {
  return buildAssetUrlMap(midiGlob, warn, 'MIDI')
}
