import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  flattenToObject,
  resolveNamespaceKey,
  readLocaleJson
} from './utils/localeTestUtils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.join(__dirname, '..')

const UI_SOURCE_FILES = [
  'src/ui/bandhq/DetailedStatsTab.jsx',
  'src/ui/bandhq/StatsTab.jsx',
  'src/ui/bandhq/SetlistTab.jsx',
  'src/ui/bandhq/LeaderboardTab.jsx',
  'src/ui/settings/SettingsPanel.jsx',
  'src/scenes/GameOver.jsx',
  'src/scenes/MainMenu.jsx',
  'src/scenes/IntroVideo.jsx',
  'src/components/ChatterOverlay.jsx',
  'src/components/MapNode.jsx'
]

const KEY_PATTERN = /\bt\(\s*['"]([^'"]+)['"]/g

const extractLocalizedKeys = async () => {
  const localizedKeys = new Set()

  await Promise.all(
    UI_SOURCE_FILES.map(async filePath => {
      const absolutePath = path.join(REPO_ROOT, filePath)
      const source = await fs.readFile(absolutePath, 'utf8')

      for (const match of source.matchAll(KEY_PATTERN)) {
        const resolved = resolveNamespaceKey(match[1])
        if (resolved) {
          localizedKeys.add(`${resolved.namespace}:${resolved.key}`)
        }
      }
    })
  )

  return localizedKeys
}

const readLocaleMap = async (locale, namespace) => {
  const localeDir = path.join(REPO_ROOT, 'public', 'locales', locale)
  const localeData = await readLocaleJson(localeDir, `${namespace}.json`)
  return { ...flattenToObject(localeData), ...localeData }
}

test('localized keys used in UI integration files exist in both en and de locales', async () => {
  const localizedKeys = await extractLocalizedKeys()

  const missingInEnglish = []
  const missingInGerman = []

  const localeCache = new Map()

  const getCachedLocaleMap = async (locale, namespace) => {
    const cacheKey = `${locale}:${namespace}`
    if (!localeCache.has(cacheKey)) {
      localeCache.set(cacheKey, await readLocaleMap(locale, namespace))
    }
    return localeCache.get(cacheKey)
  }

  for (const namespaceKey of localizedKeys) {
    const [namespace, key] = namespaceKey.split(/:(.+)/)
    const englishMap = await getCachedLocaleMap('en', namespace)
    const germanMap = await getCachedLocaleMap('de', namespace)

    if (!(key in englishMap)) {
      missingInEnglish.push(namespaceKey)
    }
    if (!(key in germanMap)) {
      missingInGerman.push(namespaceKey)
    }
  }

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
