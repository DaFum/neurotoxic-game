import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readLocaleJson, flattenToEntries } from '../utils/localeTestUtils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LOCALES_ROOT = path.join(__dirname, '..', '..', 'public', 'locales')
const LOCALES = ['en', 'de']
const CHANGED_NAMESPACES = ['economy', 'minigame', 'ui', 'venues']

test('Smoke tests for locales', async t => {
  for (const locale of LOCALES) {
    for (const namespace of CHANGED_NAMESPACES) {
      await t.test(
        `${locale}/${namespace}.json is valid and structural sound`,
        async () => {
          const localeDir = path.join(LOCALES_ROOT, locale)
          const fileName = `${namespace}.json`

          let data
          try {
            data = await readLocaleJson(localeDir, fileName)
            assert.ok(true)
          } catch (err) {
            assert.fail(
              `${locale}/${namespace}.json should be valid JSON: ${err.message}`
            )
          }

          assert.equal(
            typeof data,
            'object',
            `${locale}/${namespace}.json should have object at root`
          )
          assert.ok(
            !Array.isArray(data),
            `${locale}/${namespace}.json root should not be an array`
          )

          const entries = flattenToEntries(data)
          assert.ok(
            entries.length > 0,
            `${locale}/${namespace}.json should have translations`
          )
          assert.ok(
            Object.keys(data).length > 0,
            `${locale}/${namespace}.json should have top-level keys`
          )
        }
      )
    }
  }
})
