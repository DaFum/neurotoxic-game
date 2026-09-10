import { Assets, ImageSource, Texture } from 'pixi.js'
import { logger } from '../../utils/logger'
import { BRAND_COLOR_HEX, HEX_COLOR_PATTERN } from '../../utils/brandColors'

/**
 * Map of default hex fallback values for CSS token names.
 *
 * @remarks
 * Maps both `--token` and `--color-token` custom property forms to default hex values
 * defined in `BRAND_COLOR_HEX` to align runtime CSS variable resolution with SSR/test environments.
 */
const PIXI_TOKEN_FALLBACKS: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(
    Object.entries(BRAND_COLOR_HEX).flatMap(([name, hex]) => [
      [`--${name}`, hex],
      [`--color-${name}`, hex]
    ])
  )
)

/**
 * Normalizes a raw CSS color value into a standard 6-digit hex string with a leading hash.
 *
 * @remarks
 * Converts shorthand 3-digit hex strings (e.g. `#fff`) into full 6-digit hex format and truncates
 * 8-digit hex-with-alpha strings to 6 digits. Returns `null` if the input is not a string or fails
 * the valid hex color pattern check.
 *
 * @param colorValue - The input color value to normalize.
 * @returns A standard 6-digit hex string starting with `#`, or `null` if the input is invalid.
 */
const normalizeHexColor = (colorValue: unknown): string | null => {
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

  if (normalizedColorValue.length === 9) {
    return normalizedColorValue.slice(0, 7)
  }

  return normalizedColorValue
}

/**
 * Cache mapping CSS variable tokens to previously parsed numeric Pixi color values.
 */
const colorCache = new Map<string, number>()

/**
 * Resolves a CSS variable token to a PixiJS-compatible numeric color value.
 *
 * @remarks
 * Evaluates document computed styles when running in a browser context. Uses cached values
 * when available to avoid repetitive DOM reads. Falls back to static token definitions or
 * `defaultHexFallback` during SSR or test execution.
 *
 * @param tokenName - The CSS custom property name (e.g., `--toxic-green` or `toxic-green`).
 * @param defaultHexFallback - The fallback hex color string if the CSS token is unresolvable.
 * Defaults to `BRAND_COLOR_HEX['star-white']`.
 * @returns The numeric PixiJS hex color representation.
 */
export const getPixiColorFromToken = (
  tokenName: string,
  defaultHexFallback = BRAND_COLOR_HEX['star-white']
): number => {
  const canReadCssVariables =
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof window.getComputedStyle === 'function'

  if (!canReadCssVariables) {
    const fallbackColor = PIXI_TOKEN_FALLBACKS[tokenName] ?? defaultHexFallback
    return Number.parseInt(fallbackColor.slice(1), 16)
  }

  const cacheKey = `${tokenName}-${defaultHexFallback}`
  const cachedColor = colorCache.get(cacheKey)
  if (cachedColor !== undefined) {
    return cachedColor
  }

  const fallbackColor = PIXI_TOKEN_FALLBACKS[tokenName] ?? defaultHexFallback
  // @theme tokens use --color- prefix (e.g. --toxic-green → --color-toxic-green).
  // Guard against double-prefix if caller already passes --color-* directly.
  const cssPropertyName = tokenName.startsWith('--')
    ? tokenName.startsWith('--color-')
      ? tokenName
      : `--color-${tokenName.slice(2)}`
    : `--color-${tokenName}`
  const resolvedCssValue = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(cssPropertyName)
  const normalizedHexColor =
    normalizeHexColor(resolvedCssValue) ?? normalizeHexColor(fallbackColor)

  if (!normalizedHexColor) {
    return Number.parseInt(defaultHexFallback.slice(1), 16)
  }

  const result = Number.parseInt(normalizedHexColor.slice(1), 16)
  colorCache.set(cacheKey, result)
  return result
}

/**
 * Wraps a promise with a maximum timeout duration to prevent indefinite hanging.
 *
 * @remarks
 * If the promise fails or times out, the error is logged via `logger` and `null` is returned,
 * preventing unhandled promise rejections from stalling stage rendering initialization.
 *
 * @typeParam T - The resolved value type carried by the promise.
 * @param promise - The promise to execute with a timeout constraint.
 * @param label - A descriptive label used in timeout/error logging messages.
 * @param timeoutMs - The maximum duration in milliseconds to wait before timing out. Defaults to `10000`.
 * @returns The resolved value of the promise, or `null` if the operation failed or timed out.
 */
export const withTimeout = async <T>(
  promise: Promise<T>,
  label: string,
  timeoutMs = 10000
): Promise<T | null> => {
  let timerId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<null>(resolve => {
    timerId = setTimeout(() => {
      logger.warn(
        'PixiStageController',
        `${label} load timed out, proceeding with fallbacks.`
      )
      // Explicitly resolve null on timeout to ensure non-blocking fallback
      resolve(null)
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([promise, timeout])
    return result
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logger.error(
      'PixiStageController',
      `${label} load failed: ${errorMessage}`,
      err
    )
    return null // Graceful fallback on error
  } finally {
    clearTimeout(timerId)
  }
}

/**
 * Calculates the current vertical Y position of a falling note sprite.
 *
 * @remarks
 * Computes the note's Y position relative to the hit line target by projecting time remaining
 * until scheduled note hit against travel speed.
 *
 * @param elapsed - Total elapsed gameplay time in milliseconds.
 * @param noteTime - Scheduled hit time of the note in milliseconds.
 * @param targetY - Target hit line Y coordinate on stage.
 * @param speed - Note travel speed in pixels per second.
 * @returns The calculated Y screen position for the note sprite.
 */
export const calculateNoteY = (
  elapsed: number,
  noteTime: number,
  targetY: number,
  speed: number
): number => {
  const timeUntilHit = noteTime - elapsed
  return targetY - (timeUntilHit / 1000) * speed
}

/**
 * Calculates a vertical bounce offset for a crowd member based on current hit combo and time.
 *
 * @remarks
 * Uses a sine wave function scaled by hit combo threshold to produce rhythmic animation.
 * Accepts positional parameters to avoid temporary object allocations during 60fps render frames.
 *
 * @param combo - Current consecutive hit streak count.
 * @param timeMs - Current game loop timestamp in milliseconds.
 * @returns The non-negative vertical offset in pixels.
 */
export const calculateCrowdOffset = (combo: number, timeMs: number): number => {
  const intensity = combo > 10 ? 2 : 1
  return Math.abs(Math.sin((timeMs / 100) * intensity) * 5)
}

/**
 * Calculates the horizontal starting coordinate for centering rhythm lanes on screen.
 *
 * @param params - Layout inputs for lane positioning.
 * @returns The horizontal starting X coordinate in pixels.
 */
const calculateLaneStartX = ({
  screenWidth,
  laneTotalWidth
}: {
  screenWidth: number
  laneTotalWidth: number
}) => Math.max(0, (screenWidth - laneTotalWidth) / 2)

const LANE_TOTAL_WIDTH = 360
const LANE_WIDTH = 100
const LANE_GAP = 20
const LANE_COUNT = 3
const LANE_HEIGHT_RATIO = 0.4
const LANE_STROKE_WIDTH = 2
const HIT_LINE_HEIGHT = 20
const HIT_LINE_OFFSET = 60
const HIT_LINE_STROKE_WIDTH = 4
const RHYTHM_OFFSET_RATIO = 0.6

const RHYTHM_LAYOUT = Object.freeze({
  laneTotalWidth: LANE_TOTAL_WIDTH,
  laneWidth: LANE_WIDTH,
  laneGap: LANE_GAP,
  laneCount: LANE_COUNT,
  laneHeightRatio: LANE_HEIGHT_RATIO,
  laneStrokeWidth: LANE_STROKE_WIDTH,
  hitLineHeight: HIT_LINE_HEIGHT,
  hitLineOffset: HIT_LINE_OFFSET,
  hitLineStrokeWidth: HIT_LINE_STROKE_WIDTH,
  rhythmOffsetRatio: RHYTHM_OFFSET_RATIO
})

/**
 * Configuration parameters for crowd member layout and animation on stage.
 */
export const CROWD_LAYOUT = Object.freeze({
  containerYRatio: 0.5,
  memberCount: 50,
  minRadius: 3,
  radiusVariance: 2,
  yRangeRatio: 0.1
})

/**
 * Calculates responsive layout metrics for the rhythm game lanes and hit targets.
 *
 * @remarks
 * Scales lane width, gap, and hit line offsets dynamically according to screen dimensions.
 *
 * @param params - Screen dimensions for scaling lane layout.
 * @returns An object containing calculated layout coordinates, dimensions, and offsets.
 */
export const buildRhythmLayout = ({
  screenWidth,
  screenHeight
}: {
  screenWidth: number
  screenHeight: number
}): {
  startX: number
  laneWidth: number
  laneGap: number
  laneHeight: number
  laneStrokeWidth: number
  hitLineY: number
  hitLineHeight: number
  hitLineStrokeWidth: number
  rhythmOffsetY: number
  laneTotalWidth: number
} => {
  const layoutScale = Math.min(
    1,
    Math.max(0, screenWidth) / RHYTHM_LAYOUT.laneTotalWidth
  )
  const laneTotalWidth = RHYTHM_LAYOUT.laneTotalWidth * layoutScale
  const startX = calculateLaneStartX({ screenWidth, laneTotalWidth })
  const laneHeight = screenHeight * RHYTHM_LAYOUT.laneHeightRatio
  const hitLineY = laneHeight - RHYTHM_LAYOUT.hitLineOffset

  return {
    startX,
    laneWidth: RHYTHM_LAYOUT.laneWidth * layoutScale,
    laneGap: RHYTHM_LAYOUT.laneGap * layoutScale,
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
 * Cache for PixiJS textures loaded via the HTML Image fallback pipeline.
 *
 * @remarks
 * Maintained as a separate cache from `Assets.cache` to prevent rendering bugs with `TilingSprite`,
 * because image-fallback textures lack the proper source metadata required for tiling.
 */
const _imageTextureCache = new Map<string, Texture>()

/**
 * Retrieves a cached texture from PixiJS Assets cache or internal image texture cache.
 *
 * @remarks
 * Validates that the texture source is defined and not destroyed before returning.
 *
 * @param url - The source URL of the texture.
 * @returns The cached active texture, or `null` if missing or destroyed.
 */
const _getCachedTexture = (url: string): Texture | null => {
  const pixiCache = Assets.cache
  if (pixiCache?.has(url)) {
    const cached = pixiCache.get(url)
    if (
      cached instanceof Texture &&
      cached.source &&
      !cached.source.destroyed
    ) {
      return cached
    }
  }

  const imgCached = _imageTextureCache.get(url)
  if (imgCached?.source && !imgCached.source.destroyed) return imgCached

  return null
}

/**
 * Determines whether a URL string contains an explicit file extension in its path.
 *
 * @param url - The URL string to inspect.
 * @param baseUrl - Optional base URL for resolving relative paths.
 * @returns `true` if the URL pathname contains a file extension, or `false` otherwise.
 */
const _hasFileExtension = (url: string, baseUrl?: string): boolean => {
  try {
    const fallbackBase =
      baseUrl ??
      (typeof window !== 'undefined' && window.location
        ? window.location.href
        : 'http://localhost')
    const pathname = new URL(url, fallbackBase).pathname
    const lastSegment = pathname.split('/').pop() || ''
    return lastSegment.includes('.')
  } catch {
    return false
  }
}

/**
 * Loads an image asset using an HTML Image element fallback pipeline.
 *
 * @remarks
 * Used when PixiJS Assets asset resolution fails or when loading non-standard dynamic URLs.
 * Returns `null` gracefully if the runtime lacks HTML Image support or asset loading fails.
 *
 * @param url - The target image URL.
 * @returns A promise resolving to the loaded PixiJS `Texture`, or `null` on failure.
 */
const _loadWithImageFallback = (url: string): Promise<Texture | null> => {
  return new Promise(resolve => {
    if (typeof Image === 'undefined') {
      logger.warn(
        'loadTexture',
        `Image fallback unavailable in this runtime for URL: ${url}`
      )
      resolve(null)
      return
    }
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
 * Robustly loads a PixiJS texture from a URL using Assets with an HTML Image fallback.
 *
 * @remarks
 * First checks internal and PixiJS caches for active textures. Attempts `Assets.load` for URLs with
 * file extensions, falling back to an HTML Image loader on failure or for dynamic URLs.
 *
 * @param url - The target asset URL to load.
 * @returns A promise resolving to the loaded `Texture`, or `null` if loading fails.
 */
export const loadTexture = async (url: string): Promise<Texture | null> => {
  const cached = _getCachedTexture(url)
  if (cached) return cached

  const baseUrl =
    typeof window !== 'undefined' && window.location
      ? window.location.href
      : undefined
  if (_hasFileExtension(url, baseUrl)) {
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
 * Calculates an optimal stage render resolution capped to prevent performance degradation on high-DPI displays.
 *
 * @remarks
 * Caps device pixel ratio between 1.0 and 2.0 to balance sharp visual presentation with GPU performance.
 *
 * @returns The capped resolution factor.
 */
export const getOptimalResolution = () => {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  return Math.min(dpr, 2)
}

/**
 * Concurrently loads multiple stage textures mapped by identifier keys.
 *
 * @remarks
 * Resolves all texture promises using `Promise.allSettled`. Handles individual loading failures cleanly,
 * invoking the optional `onError` callback or logging warnings without throwing exceptions.
 *
 * @param urlMap - A record mapping texture keys to source URL strings or `null`.
 * @param onError - Optional error handler callback invoked when individual texture loading fails.
 * @returns A promise resolving to a record mapping texture keys to loaded `Texture` instances or `null`.
 */
export const loadTextures = async (
  urlMap: Record<string, string | null>,
  onError?: (error: Error, message: string) => void
): Promise<Record<string, Texture | null>> => {
  const keys = Object.keys(urlMap)
  const length = keys.length
  if (length === 0) {
    return {}
  }

  const promises: Array<Promise<Texture | null>> = new Array(length)
  const skippedKeys = new Set<string>()
  for (let i = 0; i < length; i++) {
    const key = keys[i]
    if (!key) continue
    const url = urlMap[key]
    if (!url) {
      skippedKeys.add(key)
      if (onError) {
        onError(
          new Error(`Texture '${key}' has an empty or missing URL.`),
          `Texture '${key}' was skipped because URL is empty.`
        )
      } else {
        logger.warn(
          'loadTextures',
          `Skipped texture '${key}' because URL is empty.`
        )
      }
      promises[i] = Promise.resolve(null)
      continue
    }
    promises[i] = loadTexture(url)
  }
  const settledResults = await Promise.allSettled(promises)

  const result: Record<string, Texture | null> = {}
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index]
    const res = settledResults[index]
    if (!key || !res) continue

    if (res.status === 'fulfilled' && res.value !== null) {
      result[key] = res.value
    } else if (
      res.status === 'fulfilled' &&
      res.value === null &&
      skippedKeys.has(key)
    ) {
      result[key] = null
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
