import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  flattenToObject,
  collectSourceFiles,
  resolveNamespaceKey,
  readLocaleJson
} from '../utils/localeTestUtils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.join(__dirname, '..', '..')
const SOURCE_ROOT = path.join(REPO_ROOT, 'src')

const TRANSLATION_KEY_PATTERN = /\bt\(\s*['"]([^'"]+)['"]/g
const TRANS_I18NKEY_PATTERN = /<Trans[^>]*i18nKey=['"]([^'"]+)['"]/g

const readLocaleNamespaceMap = async locale => {
  const localePath = path.join(REPO_ROOT, 'public', 'locales', locale)
  const allFiles = await fs.readdir(localePath)
  const namespaceFiles = allFiles.filter(file => file.endsWith('.json'))

  const results = await Promise.all(
    namespaceFiles.map(async namespaceFile => {
      const namespace = namespaceFile.replace('.json', '')
      const namespaceData = await readLocaleJson(localePath, namespaceFile)

      return {
        namespace,
        data: { ...flattenToObject(namespaceData), ...namespaceData }
      }
    })
  )

  return results.reduce((accumulator, item) => {
    accumulator[item.namespace] = item.data
    return accumulator
  }, {})
}

test('all literal translation keys used in src exist in both en and de locale namespaces', async () => {
  const [sourceFiles, englishNamespaces, germanNamespaces] = await Promise.all([
    collectSourceFiles(SOURCE_ROOT),
    readLocaleNamespaceMap('en'),
    readLocaleNamespaceMap('de')
  ])

  const missingInEnglish = []
  const missingInGerman = []

  await Promise.all(
    sourceFiles.map(async filePath => {
      const source = await fs.readFile(filePath, 'utf8')

      const matches = [
        ...source.matchAll(TRANSLATION_KEY_PATTERN),
        ...source.matchAll(TRANS_I18NKEY_PATTERN)
      ]

      for (const match of matches) {
        const resolved = resolveNamespaceKey(match[1])
        if (!resolved) {
          assert.fail(`Unresolved i18n key: ${match[1]} must be namespaced`)
        }

        const namespaceKey = `${resolved.namespace}:${resolved.key}`
        const englishMap = englishNamespaces[resolved.namespace] || {}
        const germanMap = germanNamespaces[resolved.namespace] || {}

        if (!(resolved.key in englishMap)) {
          missingInEnglish.push(`${filePath}:${namespaceKey}`)
        }

        if (!(resolved.key in germanMap)) {
          missingInGerman.push(`${filePath}:${namespaceKey}`)
        }
      }
    })
  )

  assert.deepEqual(
    missingInEnglish,
    [],
    `Missing translation keys in English locale:\n${missingInEnglish.join('\n')}`
  )

  assert.deepEqual(
    missingInGerman,
    [],
    `Missing translation keys in German locale:\n${missingInGerman.join('\n')}`
  )
})
