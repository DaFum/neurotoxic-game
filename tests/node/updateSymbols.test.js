import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'

function loadSymbols() {
  return JSON.parse(fs.readFileSync('symbols.json', 'utf8')).knownSymbols
}

function runUpdateSymbols() {
  execSync('node scripts/update-symbols.mjs', { stdio: 'pipe' })
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
  runUpdateSymbols()
  const first = fs.readFileSync('symbols.json', 'utf8')
  runUpdateSymbols()
  const second = fs.readFileSync('symbols.json', 'utf8')
  assert.equal(
    first,
    second,
    'Two consecutive runs should produce identical symbols.json'
  )
})

test('direct exports from declaration files remain indexed', () => {
  runUpdateSymbols()
  const ks = loadSymbols()
  const expectedDeclarationSymbols = [
    ['BandPatch', 'src/types/purchase.d.ts'],
    ['ConnectorType', 'src/types/kabelsalat.d.ts'],
    ['GigStats', 'src/types/rhythmGame.d.ts'],
    ['TempoMapEntry', 'src/types/rhythm.d.ts'],
    ['TourbusObstacle', 'src/types/tourbus.d.ts'],
    ['ValidationResult', 'src/types/validation.d.ts']
  ]

  for (const [name, expectedPath] of expectedDeclarationSymbols) {
    assert.ok(
      ks[name]?.some(entry => entry.path === expectedPath),
      `${name} should be indexed from ${expectedPath}`
    )
  }
})

test('test, spec, and story files are ignored while React HOCs keep render signatures', () => {
  const fixtureDir = path.join('src', '__symbolIndexFixtures')

  try {
    fs.mkdirSync(fixtureDir, { recursive: true })
    fs.writeFileSync(
      path.join(fixtureDir, 'SymbolIndexNoise.test.ts'),
      'export const SymbolIndexTestNoise = true\n'
    )
    fs.writeFileSync(
      path.join(fixtureDir, 'SymbolIndexNoise.spec.ts'),
      'export const SymbolIndexSpecNoise = true\n'
    )
    fs.writeFileSync(
      path.join(fixtureDir, 'SymbolIndexNoise.stories.tsx'),
      'export const SymbolIndexStoryNoise = true\n'
    )
    fs.writeFileSync(
      path.join(fixtureDir, 'SymbolIndexHocFixture.tsx'),
      [
        "import { forwardRef, memo } from 'react'",
        '',
        'type SymbolIndexHocFixtureProps = {',
        '  label: string',
        '}',
        '',
        'export const SymbolIndexMemoFixture = memo(({ label }: SymbolIndexHocFixtureProps) => <span>{label}</span>)',
        '',
        'export const SymbolIndexForwardRefFixture = forwardRef<HTMLDivElement, SymbolIndexHocFixtureProps>(',
        '  function SymbolIndexForwardRefFixture({ label }, ref) {',
        '    return <div ref={ref}>{label}</div>',
        '  }',
        ')',
        ''
      ].join('\n')
    )

    runUpdateSymbols()
    const ks = loadSymbols()

    assert.equal(ks.SymbolIndexTestNoise, undefined)
    assert.equal(ks.SymbolIndexSpecNoise, undefined)
    assert.equal(ks.SymbolIndexStoryNoise, undefined)

    const memoFixture = ks.SymbolIndexMemoFixture.find(
      entry =>
        entry.path === 'src/__symbolIndexFixtures/SymbolIndexHocFixture.tsx'
    )
    assert.equal(memoFixture.isComponent, true)
    assert.equal(memoFixture.parameters[0].name, '{ label }')
    assert.equal(memoFixture.parameters[0].type, 'SymbolIndexHocFixtureProps')

    const forwardRefFixture = ks.SymbolIndexForwardRefFixture.find(
      entry =>
        entry.path === 'src/__symbolIndexFixtures/SymbolIndexHocFixture.tsx'
    )
    assert.equal(forwardRefFixture.isComponent, true)
    assert.deepEqual(
      forwardRefFixture.parameters.map(parameter => parameter.name),
      ['{ label }', 'ref']
    )
    assert.equal(
      forwardRefFixture.parameters[0].type,
      'SymbolIndexHocFixtureProps'
    )
  } finally {
    fs.rmSync(fixtureDir, { recursive: true, force: true })
    runUpdateSymbols()
  }
})

test('local symbols include signatures, structure, docs, graph, location, and framework metadata', () => {
  runUpdateSymbols()
  const ks = loadSymbols()

  const getQuestRewards = ks.getQuestRewards.find(
    entry => entry.path === 'src/domain/questRewards.ts'
  )
  assert.deepEqual(getQuestRewards.parameters, [
    { name: 'quest', optional: false, rest: false, type: 'QuestState' }
  ])
  assert.equal(getQuestRewards.returnType, 'QuestReward[]')
  assert.equal(getQuestRewards.exportKind, 'named')
  assert.equal(getQuestRewards.exportedName, 'getQuestRewards')
  assert.equal(typeof getQuestRewards.lineStart, 'number')
  assert.equal(typeof getQuestRewards.lineEnd, 'number')
  assert.ok(getQuestRewards.lineStart < getQuestRewards.lineEnd)
  assert.ok(
    getQuestRewards.usedBy.some(
      usage => usage.path === 'src/ui/QuestsModal.tsx'
    ),
    'getQuestRewards should list files that import it'
  )

  const applyQuestRewards = ks.applyQuestRewards.find(
    entry => entry.path === 'src/domain/questRewards.ts'
  )
  assert.ok(
    applyQuestRewards.dependencies.includes('getQuestRewards'),
    'applyQuestRewards should list local symbols it calls'
  )
  assert.ok(
    applyQuestRewards.dependencies.includes('clampPlayerMoney'),
    'applyQuestRewards should list imported local helpers it calls'
  )

  const questState = ks.QuestState.find(
    entry => entry.path === 'src/types/quest.d.ts'
  )
  assert.ok(
    questState.properties.some(
      property =>
        property.name === 'followupQuestId' &&
        property.optional === true &&
        property.type === 'string'
    ),
    'QuestState should expose optional interface properties'
  )

  const assetKind = ks.AssetKind.find(
    entry => entry.path === 'src/types/assets.d.ts'
  )
  assert.equal(
    assetKind.properties,
    undefined,
    'Primitive string-literal type aliases should not expose string prototype properties'
  )

  const gigModifiers = ks.GigModifiers.find(
    entry => entry.path === 'src/types/gig.d.ts'
  )
  assert.ok(
    gigModifiers.properties.some(
      property =>
        property.name === '[key: string]' &&
        property.optional === false &&
        property.type === 'boolean'
    ),
    'Interfaces should expose string index signatures'
  )

  const gameState = ks.GameState.find(
    entry => entry.path === 'src/types/game.d.ts'
  )
  assert.equal(
    gameState.properties.find(property => property.name === 'assets')?.type,
    'LongTermAsset[]',
    'Type strings should avoid import("..."). qualifiers'
  )

  const settingsActionsReturn = ks.UseSettingsActionsReturn.find(
    entry => entry.path === 'src/hooks/useSettingsActions.ts'
  )
  assert.ok(
    settingsActionsReturn.properties.some(
      property =>
        property.name === 'handleToggleCRT' && property.type === '() => void'
    ),
    'Object-like type aliases should keep their declared properties'
  )

  const rhythmSetlistEntry = ks.RhythmSetlistEntry.find(
    entry => entry.path === 'src/types/rhythmGame.d.ts'
  )
  assert.ok(
    rhythmSetlistEntry.variants.some(
      variant => variant.kind === 'primitive' && variant.type === 'string'
    ),
    'Mixed union type aliases should expose primitive variants'
  )
  const rhythmSetlistObjectVariant = rhythmSetlistEntry.variants.find(
    variant => variant.kind === 'object'
  )
  assert.ok(
    rhythmSetlistObjectVariant.properties.some(
      property =>
        property.name === 'sourceOgg' &&
        property.optional === true &&
        property.type === 'string | null'
    ),
    'Mixed union type aliases should expose object branch properties'
  )

  const questCooldown = ks.QuestCooldown.find(
    entry => entry.path === 'src/types/quest.d.ts'
  )
  assert.match(questCooldown.jsDoc.summary, /repeatPolicy/)

  const bandHq = ks.BandHQ.find(entry => entry.path === 'src/ui/BandHQ.tsx')
  assert.equal(bandHq.isComponent, true)

  const postGigState = ks.usePostGigState.find(
    entry => entry.path === 'src/hooks/postGig/usePostGigState.ts'
  )
  assert.equal(postGigState.isHook, true)
})
