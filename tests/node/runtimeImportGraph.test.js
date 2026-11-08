import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import {
  buildRuntimeImportGraph,
  evaluateRuntimeGraph,
  findShortestReturnPath
} from '../../scripts/utils/runtime-import-graph.mjs'

const EMPTY_MODULE = 'export {}\n'

// `tests/loader.mjs` rewrites the literal glob call text in every loaded
// module, string literals included, so fixtures assemble it at runtime.
const META_GLOB = ['import', 'meta', 'glob'].join('.')

/** A temporary root holding `src` plus `files`, removed after the test. */
const createWorkspace = (t, files = {}) => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'runtime-import-graph-')
  )
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  fs.mkdirSync(path.join(directory, 'src'))
  for (const [relative, content] of Object.entries(files)) {
    const full = path.join(directory, relative)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, content)
  }
  return directory
}

const emptyModules = (...files) =>
  Object.fromEntries(files.map(file => [file, EMPTY_MODULE]))

const noExclusions = {
  packages: 0,
  virtualModules: 0,
  assets: 0,
  assetGlobs: 0
}

test('discovers sorted non-declaration code files under src as POSIX paths', t => {
  const root = createWorkspace(t, {
    ...emptyModules(
      'src/b.ts',
      'src/a.tsx',
      'src/nested/deep/c.js',
      'src/d.jsx',
      'src/e.mjs',
      'src/skipped.mts',
      'src/skipped.cjs',
      'lib/unreached.ts'
    ),
    'src/types.d.ts': 'export type T = number\n',
    'src/style.css': 'body {}\n',
    'src/data.json': '{}\n'
  })

  const graph = buildRuntimeImportGraph(root)

  assert.deepEqual(graph.vertices, [
    'src/a.tsx',
    'src/b.ts',
    'src/d.jsx',
    'src/e.mjs',
    'src/nested/deep/c.js'
  ])
  assert.deepEqual(graph.edges, [])
  assert.deepEqual(graph.sccs, [])
  assert.deepEqual(graph.cyclicEdges, [])
  assert.deepEqual(evaluateRuntimeGraph(graph), { ok: true, failures: [] })
})

test('records runtime import and re-export forms and skips type forms', t => {
  const targets = [
    'side',
    'def',
    'ns',
    'value',
    'mixedDefault',
    'mixedNamed',
    'star',
    'starNs',
    'reexport',
    'legacy',
    'typeImport',
    'typeNamespace',
    'typeDefault',
    'inlineTypes',
    'typeExport',
    'typeStar',
    'inlineTypeExport',
    'legacyType',
    'importType',
    'lazy',
    'lazyTemplate'
  ]
  const root = createWorkspace(t, {
    ...emptyModules(...targets.map(name => `src/${name}.ts`)),
    'src/forms.ts': [
      "import './side'",
      "import def from './def'",
      "import * as ns from './ns'",
      "import { value } from './value'",
      "import mixedDefault, { type MixedType } from './mixedDefault'",
      "import { type PartType, partValue } from './mixedNamed'",
      "export * from './star'",
      "export * as starNs from './starNs'",
      "export { reexported } from './reexport'",
      "import legacy = require('./legacy')",
      "import type { T1 } from './typeImport'",
      "import type * as TNs from './typeNamespace'",
      "import type TDefault from './typeDefault'",
      "import { type Inline1, type Inline2 } from './inlineTypes'",
      "export type { T2 } from './typeExport'",
      "export type * from './typeStar'",
      "export { type Inline3 } from './inlineTypeExport'",
      "import type LegacyType = require('./legacyType')",
      "export type Imported = import('./importType').Thing",
      "export const lazy = () => import('./lazy')",
      'export const lazyTemplate = () => import(`./lazyTemplate`)',
      'void [def, ns, value, mixedDefault, partValue, legacy]',
      ''
    ].join('\n')
  })

  const graph = buildRuntimeImportGraph(root)

  assert.deepEqual(
    graph.vertices,
    [...targets, 'forms'].map(name => `src/${name}.ts`).sort()
  )
  assert.deepEqual(
    graph.edges,
    [
      'def',
      'legacy',
      'mixedDefault',
      'mixedNamed',
      'ns',
      'reexport',
      'side',
      'star',
      'starNs',
      'value'
    ].map(name => ['src/forms.ts', `src/${name}.ts`])
  )
  assert.deepEqual(graph.diagnostics.dynamicImports, [
    {
      importer: 'src/forms.ts',
      specifier: './lazy',
      target: 'src/lazy.ts',
      line: 20
    },
    {
      importer: 'src/forms.ts',
      specifier: './lazyTemplate',
      target: 'src/lazyTemplate.ts',
      line: 21
    }
  ])
  assert.deepEqual(graph.diagnostics.parseErrors, [])
  assert.deepEqual(evaluateRuntimeGraph(graph), { ok: true, failures: [] })
})

test('resolves local specifiers file-first with extension, index, .js and alias rules', t => {
  const root = createWorkspace(t, {
    ...emptyModules(
      'src/exact.ts',
      'src/ext/a.mjs',
      'src/ext/a.js',
      'src/ext/b.js',
      'src/ext/b.mts',
      'src/ext/c.mts',
      'src/ext/c.ts',
      'src/ext/d.ts',
      'src/ext/d.jsx',
      'src/ext/e.jsx',
      'src/ext/e.tsx',
      'src/ext/f.tsx',
      'src/file.ts',
      'src/file/index.ts',
      'src/dir/index.js',
      'src/dir/index.ts',
      'src/mapped.ts',
      'src/mappedTsx.tsx',
      'src/both.js',
      'src/both.ts',
      'src/lib/aliased.ts',
      'src/rooted.ts'
    ),
    'src/main.ts': [
      "import './exact.ts'",
      "import './ext/a'",
      "import './ext/b'",
      "import './ext/c'",
      "import './ext/d'",
      "import './ext/e'",
      "import './ext/f'",
      "import './file'",
      "import './dir'",
      "import './mapped.js'",
      "import './mappedTsx.js'",
      "import './both.js'",
      "import '@/lib/aliased'",
      "import '/src/rooted'",
      ''
    ].join('\n')
  })

  const graph = buildRuntimeImportGraph(root)

  assert.deepEqual(
    graph.edges,
    [
      'src/both.js',
      'src/dir/index.js',
      'src/exact.ts',
      'src/ext/a.mjs',
      'src/ext/b.js',
      'src/ext/c.mts',
      'src/ext/d.ts',
      'src/ext/e.jsx',
      'src/ext/f.tsx',
      'src/file.ts',
      'src/lib/aliased.ts',
      'src/mapped.ts',
      'src/mappedTsx.tsx',
      'src/rooted.ts'
    ].map(target => ['src/main.ts', target])
  )
  // `.mts` is not discovered, but a resolved `.mts` target is followed.
  assert.ok(graph.vertices.includes('src/ext/c.mts'))
  assert.ok(!graph.vertices.includes('src/ext/b.mts'))
  assert.deepEqual(evaluateRuntimeGraph(graph), { ok: true, failures: [] })
})

test('follows local code outside src, with literal require as an edge there', t => {
  const root = createWorkspace(t, {
    'src/app.ts': "import { helper } from '../lib/helper.js'\nvoid helper\n",
    'src/shared.ts': [
      "const inSrc = require('./reqInSrc')",
      'const dynamicInSrc = require(process.env.NAME)',
      'export { inSrc, dynamicInSrc }',
      ''
    ].join('\n'),
    'src/reqInSrc.ts': EMPTY_MODULE,
    'lib/helper.js': [
      "const cjs = require('./cjs.cjs')",
      "const shared = require('../src/shared')",
      "const pkg = require('some-package')",
      'const dynamic = require(process.env.NAME)',
      'module.exports = { cjs, shared, pkg, dynamic }',
      ''
    ].join('\n'),
    'lib/cjs.cjs': "module.exports = require('./deeper')\n",
    'lib/deeper.js': "module.exports = require('../src/app')\n",
    'lib/unreached.js': EMPTY_MODULE
  })

  const graph = buildRuntimeImportGraph(root)

  assert.deepEqual(graph.vertices, [
    'lib/cjs.cjs',
    'lib/deeper.js',
    'lib/helper.js',
    'src/app.ts',
    'src/reqInSrc.ts',
    'src/shared.ts'
  ])
  assert.deepEqual(graph.edges, [
    ['lib/cjs.cjs', 'lib/deeper.js'],
    ['lib/deeper.js', 'src/app.ts'],
    ['lib/helper.js', 'lib/cjs.cjs'],
    ['lib/helper.js', 'src/shared.ts'],
    ['src/app.ts', 'lib/helper.js']
  ])
  assert.deepEqual(graph.sccs, [
    ['lib/cjs.cjs', 'lib/deeper.js', 'lib/helper.js', 'src/app.ts']
  ])
  assert.equal(graph.diagnostics.excluded.packages, 1)
  assert.deepEqual(graph.diagnostics.unsupported, [
    { importer: 'lib/helper.js', line: 4, kind: 'nonliteral-require' }
  ])
  assert.deepEqual(evaluateRuntimeGraph(graph), {
    ok: false,
    failures: ['unsupported nonliteral-require in lib/helper.js:4']
  })
})

test('counts excluded packages, virtual modules, assets and eager asset globs', t => {
  const root = createWorkspace(t, {
    ...emptyModules('src/worker.ts', 'src/modules/one.ts'),
    'src/style.css': 'body {}\n',
    'src/data.json': '{}\n',
    'src/logo.svg': '<svg/>\n',
    'src/main.ts': [
      "import React from 'react'",
      "import { scoped } from '@scope/pkg'",
      "import fs from 'node:fs'",
      "import { useRegisterSW } from 'virtual:pwa-register/react'",
      "import './style.css'",
      "import data from './data.json'",
      "import logoUrl from './logo.svg?url'",
      "import workerUrl from './worker.ts?url'",
      `const sounds = ${META_GLOB}('./assets/*.ogg', { eager: true, query: '?url', import: 'default' })`,
      `const images = ${META_GLOB}(['./assets/*.png', '!./assets/skip.png'], { eager: true })`,
      `const lazyModules = ${META_GLOB}('./modules/*.ts')`,
      "const lazyPackage = () => import('lodash')",
      'void [React, scoped, fs, useRegisterSW, data, logoUrl, workerUrl, sounds, images, lazyModules, lazyPackage]',
      ''
    ].join('\n')
  })

  const graph = buildRuntimeImportGraph(root)

  assert.deepEqual(graph.vertices, [
    'src/main.ts',
    'src/modules/one.ts',
    'src/worker.ts'
  ])
  assert.deepEqual(graph.edges, [])
  assert.deepEqual(graph.diagnostics.excluded, {
    packages: 4,
    virtualModules: 1,
    assets: 4,
    assetGlobs: 2
  })
  assert.deepEqual(evaluateRuntimeGraph(graph), { ok: true, failures: [] })
})

test('lists declaration-only targets and keeps them out of the graph', t => {
  const root = createWorkspace(t, {
    'src/types.d.ts': 'export interface A { a: number }\n',
    'src/typesDir/index.d.ts': 'export {}\n',
    'src/legacy.d.ts': 'export {}\n',
    'src/main.ts': [
      "import { A } from './types'",
      "import './typesDir'",
      "import './legacy.js'",
      'export type B = A',
      ''
    ].join('\n')
  })

  const graph = buildRuntimeImportGraph(root)

  assert.deepEqual(graph.vertices, ['src/main.ts'])
  assert.deepEqual(graph.edges, [])
  assert.deepEqual(graph.diagnostics.declarationOnly, [
    {
      importer: 'src/main.ts',
      specifier: './types',
      target: 'src/types.d.ts',
      line: 1
    },
    {
      importer: 'src/main.ts',
      specifier: './typesDir',
      target: 'src/typesDir/index.d.ts',
      line: 2
    },
    {
      importer: 'src/main.ts',
      specifier: './legacy.js',
      target: 'src/legacy.d.ts',
      line: 3
    }
  ])
  assert.deepEqual(graph.diagnostics.unresolved, [])
  assert.deepEqual(evaluateRuntimeGraph(graph), { ok: true, failures: [] })
})

test('finds cyclic SCCs with Tarjan, self-loops included, and shortest return paths', t => {
  const root = createWorkspace(t, {
    'src/a.ts': "import './b'\nimport './v'\n",
    'src/b.ts': "import './a'\n",
    'src/p.ts': "import './q'\n",
    'src/q.ts': "import './r'\nimport './p'\n",
    'src/r.ts': "import './p'\n",
    'src/s.ts': "import './s'\n",
    'src/u.ts': "import './a'\n",
    'src/v.ts': EMPTY_MODULE
  })

  const graph = buildRuntimeImportGraph(root)

  assert.deepEqual(graph.edges, [
    ['src/a.ts', 'src/b.ts'],
    ['src/a.ts', 'src/v.ts'],
    ['src/b.ts', 'src/a.ts'],
    ['src/p.ts', 'src/q.ts'],
    ['src/q.ts', 'src/p.ts'],
    ['src/q.ts', 'src/r.ts'],
    ['src/r.ts', 'src/p.ts'],
    ['src/s.ts', 'src/s.ts'],
    ['src/u.ts', 'src/a.ts']
  ])
  assert.deepEqual(graph.sccs, [
    ['src/p.ts', 'src/q.ts', 'src/r.ts'],
    ['src/a.ts', 'src/b.ts'],
    ['src/s.ts']
  ])
  assert.deepEqual(graph.cyclicEdges, [
    ['src/a.ts', 'src/b.ts'],
    ['src/b.ts', 'src/a.ts'],
    ['src/p.ts', 'src/q.ts'],
    ['src/q.ts', 'src/p.ts'],
    ['src/q.ts', 'src/r.ts'],
    ['src/r.ts', 'src/p.ts'],
    ['src/s.ts', 'src/s.ts']
  ])
  assert.deepEqual(findShortestReturnPath(graph, 'src/p.ts', 'src/q.ts'), [
    'src/q.ts',
    'src/p.ts'
  ])
  assert.deepEqual(findShortestReturnPath(graph, 'src/r.ts', 'src/p.ts'), [
    'src/p.ts',
    'src/q.ts',
    'src/r.ts'
  ])
  assert.deepEqual(findShortestReturnPath(graph, 'src/s.ts', 'src/s.ts'), [
    'src/s.ts'
  ])
  assert.equal(findShortestReturnPath(graph, 'src/u.ts', 'src/a.ts'), null)
  assert.equal(findShortestReturnPath(graph, 'src/a.ts', 'src/v.ts'), null)
})

test('an empty src tree fails the verdict', t => {
  const graph = buildRuntimeImportGraph(createWorkspace(t))

  assert.deepEqual(graph.vertices, [])
  assert.deepEqual(graph.edges, [])
  assert.deepEqual(graph.diagnostics.excluded, noExclusions)
  assert.deepEqual(evaluateRuntimeGraph(graph), {
    ok: false,
    failures: ['only 0 vertices discovered, expected at least 1']
  })
})

test('a file with a syntax error fails the verdict from parser diagnostics', t => {
  const root = createWorkspace(t, {
    'src/ok.ts': "import './broken'\n",
    'src/broken.ts': 'export const = 1\n'
  })

  const graph = buildRuntimeImportGraph(root)

  assert.deepEqual(graph.vertices, ['src/broken.ts', 'src/ok.ts'])
  assert.deepEqual(graph.edges, [['src/ok.ts', 'src/broken.ts']])
  assert.ok(graph.diagnostics.parseErrors.length > 0)
  assert.ok(
    graph.diagnostics.parseErrors.every(error => error.file === 'src/broken.ts')
  )
  const verdict = evaluateRuntimeGraph(graph)
  assert.equal(verdict.ok, false)
  assert.match(
    verdict.failures.join('\n'),
    /^parse error in src\/broken\.ts:1:/
  )
})

test('a parse error that drops edges and hides a cycle fails the verdict', t => {
  const root = createWorkspace(t, {
    'src/a.ts': EMPTY_MODULE,
    'src/b.ts': "import './broken'\n",
    'src/c.ts': EMPTY_MODULE,
    'src/broken.ts': [
      "import './a'",
      'function broken( {',
      "import './b'",
      "export * from './c'",
      ''
    ].join('\n')
  })

  const graph = buildRuntimeImportGraph(root)

  // The parser recovered past line 2 inside the function, so the edges to
  // b.ts and c.ts are gone and the broken.ts <-> b.ts cycle with them.
  assert.deepEqual(graph.vertices, [
    'src/a.ts',
    'src/b.ts',
    'src/broken.ts',
    'src/c.ts'
  ])
  assert.deepEqual(graph.edges, [
    ['src/b.ts', 'src/broken.ts'],
    ['src/broken.ts', 'src/a.ts']
  ])
  assert.deepEqual(graph.sccs, [])
  const verdict = evaluateRuntimeGraph(graph)
  assert.equal(verdict.ok, false)
  assert.ok(verdict.failures.length > 0)
  assert.ok(
    verdict.failures.every(failure =>
      failure.startsWith('parse error in src/broken.ts:')
    ),
    verdict.failures.join('\n')
  )
})

test('unresolved local specifiers and nonliteral dynamic imports fail the verdict', t => {
  const root = createWorkspace(t, {
    'src/main.ts': [
      "import './missing'",
      "import '@/nowhere'",
      "export const load = (name: string) => import('./gone').then(() => import(name))",
      "import 'missing-package-is-not-local'",
      ''
    ].join('\n')
  })

  const graph = buildRuntimeImportGraph(root)

  assert.deepEqual(graph.vertices, ['src/main.ts'])
  assert.deepEqual(graph.edges, [])
  assert.deepEqual(graph.diagnostics.unresolved, [
    { importer: 'src/main.ts', specifier: './missing', line: 1 },
    { importer: 'src/main.ts', specifier: '@/nowhere', line: 2 },
    { importer: 'src/main.ts', specifier: './gone', line: 3 }
  ])
  assert.deepEqual(graph.diagnostics.nonliteralDynamicImports, [
    { importer: 'src/main.ts', line: 3 }
  ])
  assert.equal(graph.diagnostics.excluded.packages, 1)
  assert.deepEqual(evaluateRuntimeGraph(graph), {
    ok: false,
    failures: [
      "unresolved specifier './missing' in src/main.ts:1",
      "unresolved specifier '@/nowhere' in src/main.ts:2",
      "unresolved specifier './gone' in src/main.ts:3",
      'nonliteral dynamic import in src/main.ts:3'
    ]
  })
})

test('an eager glob over code is unsupported and fails the verdict', t => {
  const root = createWorkspace(t, {
    'src/modules/one.ts': EMPTY_MODULE,
    'src/main.ts': `export const modules = ${META_GLOB}('./modules/*.ts', { eager: true })\n`
  })

  const graph = buildRuntimeImportGraph(root)

  assert.deepEqual(graph.edges, [])
  assert.deepEqual(graph.diagnostics.excluded.assetGlobs, 0)
  assert.deepEqual(evaluateRuntimeGraph(graph), {
    ok: false,
    failures: ['unsupported eager-code-glob in src/main.ts:1']
  })
})

test('a healthy workspace passes, subject to the minimum vertex count', t => {
  const root = createWorkspace(t, {
    'src/main.ts': "import { value } from './value'\nvoid value\n",
    'src/value.ts': 'export const value = 1\n'
  })

  const graph = buildRuntimeImportGraph(root)

  assert.deepEqual(graph.vertices, ['src/main.ts', 'src/value.ts'])
  assert.deepEqual(graph.edges, [['src/main.ts', 'src/value.ts']])
  assert.deepEqual(graph.diagnostics, {
    parseErrors: [],
    unresolved: [],
    nonliteralDynamicImports: [],
    unsupported: [],
    declarationOnly: [],
    dynamicImports: [],
    excluded: noExclusions
  })
  assert.deepEqual(evaluateRuntimeGraph(graph), { ok: true, failures: [] })
  assert.deepEqual(evaluateRuntimeGraph(graph, { minVertices: 2 }), {
    ok: true,
    failures: []
  })
  assert.deepEqual(evaluateRuntimeGraph(graph, { minVertices: 3 }), {
    ok: false,
    failures: ['only 2 vertices discovered, expected at least 3']
  })
})
