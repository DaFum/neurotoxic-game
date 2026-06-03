import { isForbiddenKey } from '../objectUtils'
import type { TemplateContext } from './types'

const TEMPLATE_REGEX = /\{([^}]+)\}/gi

const toLowerCaseCache = Object.create(null)

/**
 * Resolves a template string by replacing {key} with the corresponding value from the context.
 * Uses a single pre-compiled regex for performance.
 * @param {string} str - The string containing {key} templates.
 * @param {object} context - The context object containing replacement values.
 * @returns {string} The resolved string.
 */
const resolveTemplateString = (
  str: string,
  context: TemplateContext
): string => {
  if (!str || typeof str !== 'string' || str.indexOf('{') === -1) return str

  let lowerKeysMap: Record<string, string> | null = null

  return str.replace(TEMPLATE_REGEX, (match, key) => {
    // Reject forbidden keys immediately (case-insensitive, matching the
    // canonical key set lowercased).
    if (isForbiddenKey(key.toLowerCase())) {
      return match
    }

    // Fast path: exact case match
    if (typeof context[key] === 'string') {
      return context[key]
    }

    // Fallback: case-insensitive match (as the original implementation used 'gi')
    if (!lowerKeysMap) {
      lowerKeysMap = Object.create(null)
      const lowerMap = lowerKeysMap as Record<string, string>

      for (const k of Object.keys(context)) {
        if (isForbiddenKey(k)) {
          continue
        }

        let lk = toLowerCaseCache[k]
        if (lk === undefined) {
          lk = k.toLowerCase()
          toLowerCaseCache[k] = lk
        }

        if (lowerMap[lk] === undefined) {
          lowerMap[lk] = k
        }
      }
    }

    let lowerKey = toLowerCaseCache[key]
    if (lowerKey === undefined) {
      lowerKey = key.toLowerCase()
      toLowerCaseCache[key] = lowerKey
    }

    const foundKey = (lowerKeysMap as Record<string, string>)[lowerKey]

    if (foundKey && typeof context[foundKey] === 'string') {
      return context[foundKey]
    }

    return match // Return original template if no match is found
  })
}


export const buildTemplateContext = (
  input: Record<string, unknown> | undefined
): TemplateContext => {
  if (!input) return {}
  const output: TemplateContext = {}
  for (const key of Object.keys(input)) {
    const value = input[key]
    if (typeof value === 'string') output[key] = value
  }
  return output
}

export { resolveTemplateString, TEMPLATE_REGEX }