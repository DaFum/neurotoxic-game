import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.join(__dirname, '..')
const SOURCE_ROOT = path.join(REPO_ROOT, 'src')

const TRANSLATION_KEY_PATTERN = /\bt\(\s*['"]([^'"]+)['"]/g

const flattenTranslations = (entry, parentKey = '') => {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return {}
  }

  return Object.entries(entry).reduce((accumulator, [childKey, childValue]) => {
    const nextKey = parentKey ? `${parentKey}.${childKey}` : childKey

    if (childValue && typeof childValue === 'object' && !Array.isArray(childValue)) {
      return { ...accumulator, ...flattenTranslations(childValue, nextKey) }
    }

    return { ...accumulator, [nextKey]: childValue }
  }, {})
}

const collectSourceFiles = directory => {
  const entries = readdirSync(directory, { withFileTypes: true })

  return entries.flatMap(entry => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath)
    }

    return /\.(js|jsx|ts|tsx)$/.test(entry.name) ? [entryPath] : []
  })
}

const resolveNamespaceKey = rawKey => {
  if (!rawKey || rawKey.endsWith(':')) {
    return null
  }

  if (rawKey.includes(':')) {
    const [namespace, key] = rawKey.split(/:(.+)/)

    if (!namespace || !key) {
      return null
    }

    return { namespace, key }
  }

  return { namespace: 'ui', key: rawKey }
}

const readLocaleNamespaceMap = locale => {
  const localePath = path.join(REPO_ROOT, 'public', 'locales', locale)
  const namespaceFiles = readdirSync(localePath).filter(file => file.endsWith('.json'))

  return namespaceFiles.reduce((accumulator, namespaceFile) => {
    const namespace = namespaceFile.replace('.json', '')
    const namespaceData = JSON.parse(
      readFileSync(path.join(localePath, namespaceFile), 'utf8')
    )

    return {
      ...accumulator,
      [namespace]: { ...flattenTranslations(namespaceData), ...namespaceData }
    }
  }, {})
}

test('all literal translation keys used in src exist in both en and de locale namespaces', () => {
  const sourceFiles = collectSourceFiles(SOURCE_ROOT)
  const englishNamespaces = readLocaleNamespaceMap('en')
  const germanNamespaces = readLocaleNamespaceMap('de')

  const missingInEnglish = []
  const missingInGerman = []

  sourceFiles.forEach(filePath => {
    const source = readFileSync(filePath, 'utf8')

    for (const match of source.matchAll(TRANSLATION_KEY_PATTERN)) {
      const resolved = resolveNamespaceKey(match[1])
      if (!resolved) {
        continue
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
