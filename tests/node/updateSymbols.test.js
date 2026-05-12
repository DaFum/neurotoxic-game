import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { test } from 'node:test'
import fs from 'node:fs'

function loadSymbols() {
  return JSON.parse(fs.readFileSync('symbols.json', 'utf8')).knownSymbols
}

test('every local symbol entry has source: "local"', () => {
  const ks = loadSymbols()
  for (const [name, entries] of Object.entries(ks)) {
    for (const entry of entries) {
      if (entry.path !== undefined) {
        assert.equal(entry.source, 'local', `${name} missing source: "local"`)
      }
    }
  }
})

test('every external symbol entry has source: "external"', () => {
  const ks = loadSymbols()
  for (const [name, entries] of Object.entries(ks)) {
    for (const entry of entries) {
      if (entry.module !== undefined) {
        assert.equal(
          entry.source,
          'external',
          `${name} missing source: "external"`
        )
      }
    }
  }
})

test('symbols.json output is deterministic across two consecutive runs', () => {
  execSync('node scripts/update-symbols.mjs', { stdio: 'pipe' })
  const first = fs.readFileSync('symbols.json', 'utf8')
  execSync('node scripts/update-symbols.mjs', { stdio: 'pipe' })
  const second = fs.readFileSync('symbols.json', 'utf8')
  assert.equal(
    first,
    second,
    'Two consecutive runs should produce identical symbols.json'
  )
})
