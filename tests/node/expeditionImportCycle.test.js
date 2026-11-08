import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

const EXPEDITION_DIR = new URL('../../src/domain/expedition/', import.meta.url)

/**
 * Sibling modules a file imports at runtime. `import type` statements are
 * erased at compile time, so they cannot form a runtime cycle.
 */
const runtimeSiblingImports = file => {
  const source = readFileSync(new URL(file, EXPEDITION_DIR), 'utf8')
  const imports = new Set()
  for (const match of source.matchAll(
    /^import\s+(type\s+)?[^;'"]*?from\s+['"]\.\/([^'"]+)['"]/gms
  )) {
    if (match[1]) continue
    imports.add(match[2].replace(/\.(ts|js)$/, ''))
  }
  return imports
}

test('failure.ts and insurance.ts do not import each other at runtime', () => {
  const failureImportsInsurance =
    runtimeSiblingImports('failure.ts').has('insurance')
  const insuranceImportsFailure =
    runtimeSiblingImports('insurance.ts').has('failure')
  assert.ok(
    !(failureImportsInsurance && insuranceImportsFailure),
    'failure.ts <-> insurance.ts runtime import cycle'
  )
})
