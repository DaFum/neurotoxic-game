import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  flattenTranslationsObj,
  resolveNamespaceKey
} from './utils/localeTestUtils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.join(__dirname, '..')

const UI_SOURCE_FILES = [
  'src/ui/bandhq/DetailedStatsTab.jsx',
  'src/ui/bandhq/StatsTab.jsx',
  'src/ui/bandhq/SetlistTab.jsx',
  'src/ui/bandhq/LeaderboardTab.jsx',
  'src/ui/shared/SettingsPanel.jsx',
  'src/scenes/GameOver.jsx',
  'src/scenes/MainMenu.jsx',
  'src/scenes/IntroVideo.jsx',
  'src/components/ChatterOverlay.jsx'
]

const KEY_PATTERN = /\bt\(\s*['"]([^'"]+)['"]/g

const extractLocalizedKeys = () => {
  const localizedKeys = new Set()

  UI_SOURCE_FILES.forEach(filePath => {
    const absolutePath = path.join(REPO_ROOT, filePath)
    const source = readFileSync(absolutePath, 'utf8')

    for (const match of source.matchAll(KEY_PATTERN)) {
      const resolved = resolveNamespaceKey(match[1])
      if (resolved) {
        localizedKeys.add(`${resolved.namespace}:${resolved.key}`)
      }
    }
  })

  return localizedKeys
}

const readLocaleMap = (locale, namespace) => {
  const localePath = path.join(REPO_ROOT, 'public', 'locales', locale, `${namespace}.json`)
  const localeData = JSON.parse(readFileSync(localePath, 'utf8'))
  return { ...flattenTranslationsObj(localeData), ...localeData }
}

test('localized keys used in UI integration files exist in both en and de locales', () => {
  const localizedKeys = extractLocalizedKeys()

  const missingInEnglish = []
  const missingInGerman = []

  const localeCache = new Map()

  localizedKeys.forEach(namespaceKey => {
    const [namespace, key] = namespaceKey.split(/:(.+)/)

    const enCacheKey = `en:${namespace}`
    if (!localeCache.has(enCacheKey)) {
      localeCache.set(enCacheKey, readLocaleMap('en', namespace))
    }
    const englishMap = localeCache.get(enCacheKey)

    const deCacheKey = `de:${namespace}`
    if (!localeCache.has(deCacheKey)) {
      localeCache.set(deCacheKey, readLocaleMap('de', namespace))
    }
    const germanMap = localeCache.get(deCacheKey)

    if (!(key in englishMap)) {
      missingInEnglish.push(namespaceKey)
    }
    if (!(key in germanMap)) {
      missingInGerman.push(namespaceKey)
    }
  })

  assert.deepEqual(
    missingInEnglish,
    [],
    `Missing localized keys in English locale: ${missingInEnglish.join(', ')}`
  )
  assert.deepEqual(
    missingInGerman,
    [],
    `Missing localized keys in German locale: ${missingInGerman.join(', ')}`
  )
})
