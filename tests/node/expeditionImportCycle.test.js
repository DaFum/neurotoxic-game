import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

const EXPEDITION_DIR = new URL('../../src/domain/expedition/', import.meta.url)

/**
 * Sibling modules a file loads at runtime, via `import` or `export ... from`.
 * `import type` / `export type` statements are erased at compile time, so
 * they cannot form a runtime cycle.
 */
const runtimeSiblingImports = file => {
  const source = readFileSync(new URL(`${file}.ts`, EXPEDITION_DIR), 'utf8')
  const imports = new Set()
  for (const match of source.matchAll(
    /^(?:import|export)\s+(type\s+)?[^;'"]*?from\s+['"]\.\/([^'"]+)['"]/gms
  )) {
    if (match[1]) continue
    imports.add(match[2].replace(/\.(ts|js)$/, ''))
  }
  return imports
}

/** Every sibling module reachable from `start` through runtime imports. */
const reachableFrom = start => {
  const seen = new Set()
  const queue = [start]
  while (queue.length > 0) {
    const file = queue.pop()
    for (const dep of runtimeSiblingImports(file)) {
      if (seen.has(dep)) continue
      seen.add(dep)
      queue.push(dep)
    }
  }
  return seen
}

test('failure.ts and insurance.ts are not part of one runtime import cycle', () => {
  // The original cycle also ran through intermediaries (failure -> legendaries
  // -> authority -> loadout -> insurance -> failure), so direct edges alone
  // would miss a reintroduction.
  assert.ok(
    !(
      reachableFrom('failure').has('insurance') &&
      reachableFrom('insurance').has('failure')
    ),
    'failure.ts <-> insurance.ts runtime import cycle'
  )
})
