import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import { collectSourceFiles } from '../utils/localeTestUtils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOURCE_ROOT = path.join(__dirname, '..', '..', 'src')

// A template-literal `defaultValue` bakes the value in at call time, so the
// fallback bypasses i18next interpolation and formatting. Use `{{var}}` plus
// the interpolation options instead.
const TEMPLATE_DEFAULT_VALUE = /defaultValue:\s*`[^`]*\$\{/

test('t() defaultValue fallbacks use {{var}} interpolation, not JS template literals', async () => {
  const offenders = []
  for (const filePath of await collectSourceFiles(SOURCE_ROOT)) {
    const source = await fs.readFile(filePath, 'utf8')
    if (TEMPLATE_DEFAULT_VALUE.test(source)) {
      offenders.push(path.relative(SOURCE_ROOT, filePath))
    }
  }
  assert.deepEqual(offenders, [])
})
