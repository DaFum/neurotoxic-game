// TODO: Review this file
import { Assets, ImageSource, Texture } from 'pixi.js'
import { logger } from '../../utils/logger.js'

const PIXI_TOKEN_FALLBACKS = Object.freeze({
  '--void-black': '#0a0a0a',
  '--toxic-green': '#00ff41',
  '--star-white': '#ffffff',
  '--ash-gray': '#888888',
  '--warning-yellow': '#ffcc00',
  '--blood-red': '#cc0000',
  '--roadie-grass': '#1a4d1a',
  '--cosmic-purple': '#6600cc',
  '--roadie-venue-blue': '#0044cc'
})

const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

const normalizeHexColor = colorValue => {
  if (typeof colorValue !== 'string') {
    return null
  }

  const normalizedColorValue = colorValue.trim()
  if (!HEX_COLOR_PATTERN.test(normalizedColorValue)) {
    return null
  }

  if (normalizedColorValue.length === 4) {
    return `#${normalizedColorValue[1]}${normalizedColorValue[1]}${normalizedColorValue[2]}${normalizedColorValue[2]}${normalizedColorValue[3]}${normalizedColorValue[3]}`
  }

  return normalizedColorValue
}

const colorCache = new Map()

/**
 * Resolves a CSS variable token to a Pixi-compatible numeric color value.
 * @param {string} tokenName - CSS custom property name (for example, "--toxic-green").
 * @returns {number} Pixi numeric hex color.
 */
export const getPixiColorFromToken = tokenName => {
  const canReadCssVariables =
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof window.getComputedStyle === 'function'

  if (!canReadCssVariables) {
    const fallbackColor = PIXI_TOKEN_FALLBACKS[tokenName] ?? '#ffffff'
    return Number.parseInt(fallbackColor.slice(1), 16)
  }

  if (colorCache.has(tokenName)) {
    return colorCache.get(tokenName)
  }

  const fallbackColor = PIXI_TOKEN_FALLBACKS[tokenName] ?? '#ffffff'
  // @theme tokens use --color- prefix (e.g. --toxic-green → --color-toxic-green).
  // Guard against double-prefix if caller already passes --color-* directly.
  const cssPropertyName = tokenName.startsWith('--color-')
    ? tokenName
    : tokenName.startsWith('--')
      ? `--color-${tokenName.slice(2)}`
      : tokenName
  const resolvedCssValue = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(cssPropertyName)
  const normalizedHexColor =
    normalizeHexColor(resolvedCssValue) ?? normalizeHexColor(fallbackColor)

  const result = Number.parseInt(normalizedHexColor.slice(1), 16)
  colorCache.set(tokenName, result)
  return result
}

/**
 * Calculates the Y position for a note sprite.
 * @param {number} elapsed - Elapsed time since start in ms.
 * @param {number} noteTime - Scheduled note time in ms.
 * @param {number} targetY - Target hit line Y position.
 * @param {number} speed - Note travel speed.
 * @returns {number} Calculated Y position.
 */
export const calculateNoteY = (elapsed, noteTime, targetY, speed) => {
  const timeUntilHit = noteTime - elapsed
  return targetY - (timeUntilHit / 1000) * speed
}

/**
 * Calculates a crowd member offset based on combo intensity.
 * @param {object} params - Crowd animation inputs.
 * @param {number} params.combo - Current combo count.
 * @param {number} params.timeMs - Current time in ms.
 * @returns {number} The vertical offset.
 */
export const calculateCrowdOffset = ({ combo, timeMs }) => {
  const intensity = combo > 10 ? 2 : 1
  return Math.abs(Math.sin((timeMs / 100) * intensity) * 5)
}

/**
 * Calculates the lane start X position.
 * @param {object} params - Lane layout inputs.
 * @param {number} params.screenWidth - Current screen width.
 * @param {number} params.laneTotalWidth - Total lane width.
 * @returns {number} Lane start X position.
 */
const calculateLaneStartX = ({ screenWidth, laneTotalWidth }) =>
  (screenWidth - laneTotalWidth) / 2

const LANE_TOTAL_WIDTH = 360
const LANE_WIDTH = 100
const LANE_HEIGHT_RATIO = 0.4
const LANE_STROKE_WIDTH = 2
const HIT_LINE_HEIGHT = 20
const HIT_LINE_OFFSET = 60
const HIT_LINE_STROKE_WIDTH = 4
const RHYTHM_OFFSET_RATIO = 0.6

export const RHYTHM_LAYOUT = Object.freeze({
  laneTotalWidth: LANE_TOTAL_WIDTH,
  laneWidth: LANE_WIDTH,
  laneHeightRatio: LANE_HEIGHT_RATIO,
  laneStrokeWidth: LANE_STROKE_WIDTH,
  hitLineHeight: HIT_LINE_HEIGHT,
  hitLineOffset: HIT_LINE_OFFSET,
  hitLineStrokeWidth: HIT_LINE_STROKE_WIDTH,
  rhythmOffsetRatio: RHYTHM_OFFSET_RATIO
})

export const CROWD_LAYOUT = Object.freeze({
  containerYRatio: 0.5,
  memberCount: 50,
  minRadius: 3,
  radiusVariance: 2,
  yRangeRatio: 0.1
})

/**
 * Builds layout metrics for the rhythm lanes.
 * @param {object} params - Layout inputs.
 * @param {number} params.screenWidth - Current screen width.
 * @param {number} params.screenHeight - Current screen height.
 * @returns {{startX: number, laneWidth: number, laneHeight: number, laneStrokeWidth: number, hitLineY: number, hitLineHeight: number, hitLineStrokeWidth: number, rhythmOffsetY: number, laneTotalWidth: number}} Layout metrics.
 */
export const buildRhythmLayout = ({ screenWidth, screenHeight }) => {
  const laneTotalWidth = RHYTHM_LAYOUT.laneTotalWidth
  const startX = calculateLaneStartX({ screenWidth, laneTotalWidth })
  const laneHeight = screenHeight * RHYTHM_LAYOUT.laneHeightRatio
  const hitLineY = laneHeight - RHYTHM_LAYOUT.hitLineOffset

  return {
    startX,
    laneWidth: RHYTHM_LAYOUT.laneWidth,
    laneHeight,
    laneStrokeWidth: RHYTHM_LAYOUT.laneStrokeWidth,
    hitLineY,
    hitLineHeight: RHYTHM_LAYOUT.hitLineHeight,
    hitLineStrokeWidth: RHYTHM_LAYOUT.hitLineStrokeWidth,
    rhythmOffsetY: screenHeight * RHYTHM_LAYOUT.rhythmOffsetRatio,
    laneTotalWidth
  }
}

/**
 * Simple cache for textures loaded via the Image element fallback.
 * Separate from Assets.cache to avoid issues with TilingSprite
 * (Image-based textures lack proper source metadata for tiling).
 * @type {Map<string, Texture>}
 */
const _imageTextureCache = new Map()

/**
 * Checks existing caches for a valid texture.
 * @param {string} url - The URL of the texture.
 * @returns {Texture|null} The cached texture or null.
 */
const _getCachedTexture = url => {
  if (Assets.cache.has(url)) {
    const cached = Assets.cache.get(url)
    if (cached?.source && !cached.source.destroyed) return cached
  }

  const imgCached = _imageTextureCache.get(url)
  if (imgCached?.source && !imgCached.source.destroyed) return imgCached

  return null
}

/**
 * Checks if a URL has a file extension.
 * @param {string} url - The URL to check.
 * @returns {boolean} True if the URL has an extension, false otherwise.
 */
const _hasFileExtension = url => {
  try {
    const pathname = new URL(url).pathname
    const lastSegment = pathname.split('/').pop() || ''
    return lastSegment.includes('.')
  } catch {
    return false
  }
}

/**
 * Loads a texture using an Image element fallback.
 * @param {string} url - The URL to load.
 * @returns {Promise<Texture|null>} The loaded texture or null.
 */
const _loadWithImageFallback = url => {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const source = new ImageSource({ resource: img })
      const texture = new Texture({ source })
      _imageTextureCache.set(url, texture)
      resolve(texture)
    }
    img.onerror = () => {
      logger.warn('loadTexture', `Failed to load image: ${url}`)
      resolve(null)
    }
    img.src = url
  })
}

/**
 * Robustly loads a texture, falling back to an Image element if Pixi Assets fails.
 * Useful for generated URLs without extensions or with query parameters.
 * @param {string} url - The URL to load.
 * @returns {Promise<Texture|null>} The loaded texture or null.
 */
export const loadTexture = async url => {
  const cached = _getCachedTexture(url)
  if (cached) return cached

  if (_hasFileExtension(url)) {
    try {
      return await Assets.load(url)
    } catch (err) {
      logger.warn(
        'loadTexture',
        'Pixi Assets load failed, falling back to Image element',
        err
      )
    }
  }

  return _loadWithImageFallback(url)
}

/**
 * Returns an optimized resolution value capped to prevent performance bottlenecks on high-DPI devices.
 * @returns {number} Optimized resolution (1.0 to 2.0).
 */
export const getOptimalResolution = () => {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  return Math.min(dpr, 2)
}

/**
 * Loads multiple textures concurrently and maps the successful results to keys.
 * Handles errors cleanly without throwing, either via a provided callback or logging.
 *
 * @param {Object.<string, string>} urlMap - A record mapping texture keys to their URLs.
 * @param {function(Error, string): void} [onError] - Optional callback to handle individual load errors (receives error and fallback message).
 * @returns {Promise<Object.<string, Texture|null>>} A record mapping the same keys to loaded Textures (or null if failed).
 */
export const loadTextures = async (urlMap, onError) => {
  const keys = Object.keys(urlMap)
  if (keys.length === 0) {
    return {}
  }

  const promises = keys.map(key => loadTexture(urlMap[key]))
  const settledResults = await Promise.allSettled(promises)

  const result = {}
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index]
    const res = settledResults[index]

    if (res.status === 'fulfilled' && res.value !== null) {
      result[key] = res.value
    } else {
      result[key] = null
      const error =
        res.status === 'fulfilled'
          ? new Error(`Texture '${key}' returned null`)
          : res.reason

      if (onError) {
        onError(error, `Texture '${key}' failed to load.`)
      } else {
        logger.warn(
          'loadTextures',
          `Failed to load texture for '${key}'`,
          error
        )
      }
    }
  }

  return result
}
