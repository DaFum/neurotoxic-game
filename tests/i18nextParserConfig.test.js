import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const getConfig = async () => {
  const configPath = path.join(__dirname, '..', 'i18next-parser.config.js')
  return (await import(configPath)).default
}

test('i18next-parser.config.js exports valid configuration', async () => {
  const config = await getConfig()

  assert.ok(config, 'Configuration should be exported')
  assert.equal(typeof config, 'object', 'Configuration should be an object')
})

test('i18next-parser.config.js defines required locales', async () => {
  const config = await getConfig()

  assert.ok(Array.isArray(config.locales), 'locales should be an array')
  assert.ok(config.locales.length > 0, 'locales should not be empty')
  assert.ok(
    config.locales.includes('en'),
    'locales should include English (en)'
  )
  assert.ok(config.locales.includes('de'), 'locales should include German (de)')
})

test('i18next-parser.config.js defines required namespaces', async () => {
  const config = await getConfig()

  assert.ok(Array.isArray(config.ns), 'ns should be an array')
  assert.ok(config.ns.length > 0, 'ns should not be empty')

  const requiredNamespaces = [
    'ui',
    'items',
    'venues',
    'events',
    'economy',
    'chatter',
    'minigame',
    'unlocks'
  ]

  requiredNamespaces.forEach(ns => {
    assert.ok(config.ns.includes(ns), `namespaces should include '${ns}'`)
  })
})

test('i18next-parser.config.js defines default namespace', async () => {
  const config = await getConfig()

  assert.ok(config.defaultNamespace, 'defaultNamespace should be defined')
  assert.equal(
    typeof config.defaultNamespace,
    'string',
    'defaultNamespace should be a string'
  )
  assert.equal(config.defaultNamespace, 'ui', 'defaultNamespace should be "ui"')
})

test('i18next-parser.config.js defines input patterns', async () => {
  const config = await getConfig()

  assert.ok(Array.isArray(config.input), 'input should be an array')
  assert.ok(config.input.length > 0, 'input should not be empty')
  assert.ok(
    config.input.some(pattern => pattern.includes('src/**')),
    'input should include src/** pattern'
  )
})

test('i18next-parser.config.js output pattern includes locale and namespace placeholders', async () => {
  const config = await getConfig()

  assert.ok(config.output, 'output should be defined')
  assert.equal(typeof config.output, 'string', 'output should be a string')
  assert.ok(
    config.output.includes('$LOCALE'),
    'output should include $LOCALE placeholder'
  )
  assert.ok(
    config.output.includes('$NAMESPACE'),
    'output should include $NAMESPACE placeholder'
  )
})

test('i18next-parser.config.js defines formatting options used by this repository', async () => {
  const config = await getConfig()

  assert.equal(typeof config.sort, 'boolean', 'sort should be a boolean')
  assert.equal(
    typeof config.createOldCatalogs,
    'boolean',
    'createOldCatalogs should be a boolean'
  )
  assert.equal(
    typeof config.keepRemoved,
    'boolean',
    'keepRemoved should be a boolean'
  )
  assert.equal(
    typeof config.useKeysAsDefaultValue,
    'boolean',
    'useKeysAsDefaultValue should be a boolean'
  )
})

test('i18next-parser.config.js defines separators for flat key extraction', async () => {
  const config = await getConfig()

  assert.ok(config.keySeparator !== undefined, 'keySeparator should be defined')
  assert.ok(
    config.namespaceSeparator !== undefined,
    'namespaceSeparator should be defined'
  )
  assert.equal(config.keySeparator, false, 'keySeparator should be false')
  assert.equal(
    config.namespaceSeparator,
    ':',
    'namespaceSeparator should be ":"'
  )
})

test('i18next-parser.config.js defines lexers', async () => {
  const config = await getConfig()

  assert.ok(config.lexers, 'lexers should be defined')
  assert.equal(typeof config.lexers, 'object', 'lexers should be an object')
  assert.ok(Array.isArray(config.lexers.js), 'lexers.js should be an array')
  assert.ok(Array.isArray(config.lexers.jsx), 'lexers.jsx should be an array')
  assert.ok(
    config.lexers.js.includes('JavascriptLexer'),
    'lexers.js should include JavascriptLexer'
  )
  assert.ok(
    config.lexers.jsx.includes('JsxLexer'),
    'lexers.jsx should include JsxLexer'
  )
})
