import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { before, test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'

let cachedDocument
let cachedSymbolsText

function refreshSymbolsCache() {
  cachedSymbolsText = fs.readFileSync('symbols.json', 'utf8')
  cachedDocument = JSON.parse(cachedSymbolsText)
  return cachedDocument
}

function restoreSymbolsCache(symbolsText) {
  fs.writeFileSync('symbols.json', symbolsText)
  cachedSymbolsText = symbolsText
  cachedDocument = JSON.parse(symbolsText)
  return cachedDocument
}

function loadSymbols() {
  return cachedDocument.knownSymbols
}

function loadDocument() {
  return cachedDocument
}

function runUpdateSymbols() {
  execSync('node scripts/update-symbols.mjs', { stdio: 'pipe' })
}

function runUpdateSymbolsAndRefreshCache() {
  runUpdateSymbols()
  return refreshSymbolsCache()
}

before(() => {
  runUpdateSymbolsAndRefreshCache()
})

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
  const first = cachedSymbolsText
  runUpdateSymbolsAndRefreshCache()
  const second = cachedSymbolsText
  assert.equal(
    first,
    second,
    'Two consecutive runs should produce identical symbols.json'
  )
})

test('direct exports from declaration files remain indexed', () => {
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
  const symbolsBeforeFixture = cachedSymbolsText

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
    refreshSymbolsCache()
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
    assert.equal(memoFixture.parameters[0].bindingKind, 'objectPattern')
    assert.deepEqual(memoFixture.parameters[0].destructuredNames, ['label'])
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
    assert.equal(forwardRefFixture.parameters[0].bindingKind, 'objectPattern')
    assert.deepEqual(forwardRefFixture.parameters[0].destructuredNames, [
      'label'
    ])
    assert.equal(
      forwardRefFixture.parameters[0].type,
      'SymbolIndexHocFixtureProps'
    )
  } finally {
    fs.rmSync(fixtureDir, { recursive: true, force: true })
    restoreSymbolsCache(symbolsBeforeFixture)
  }
})

test('local symbols include signatures, structure, docs, graph, location, and framework metadata', () => {
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

  const calculateBarCut = ks.calculateBarCut.find(
    entry => entry.path === 'src/utils/economyEngine.ts'
  )
  assert.ok(
    calculateBarCut.referencedByLocal.some(
      reference =>
        reference.path === 'src/utils/economyEngine.ts' &&
        reference.symbol === 'calculateGigFinancials'
    ),
    'same-file exported helper references should expose local reverse references'
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

  const actionButton = ks.ActionButton.find(
    entry => entry.path === 'src/ui/shared/ActionButton.tsx'
  )
  assert.equal(actionButton.parameters[0].bindingKind, 'objectPattern')
  assert.ok(
    actionButton.parameters[0].destructuredNames.includes('onClick'),
    'destructured parameter names should be exposed separately from raw text'
  )
  assert.ok(
    actionButton.usedByTests.some(
      usage => usage.path === 'tests/ui/ActionButton.test.jsx'
    ),
    'test imports should be tracked separately from production imports'
  )

  const postGigState = ks.usePostGigState.find(
    entry => entry.path === 'src/hooks/postGig/usePostGigState.ts'
  )
  assert.equal(postGigState.isHook, true)
})

test('aliased re-exports record the real declared identifier and value', () => {
  const ks = loadSymbols()

  // useTourbusLogic.ts re-exports `TOURBUS_BASE_SPEED as BASE_SPEED`. The entry
  // must surface the alias so jumping to path:lineStart is unambiguous.
  const baseSpeed = ks.BASE_SPEED.find(
    entry => entry.path === 'src/hooks/minigames/minigameConstants.ts'
  )
  assert.equal(baseSpeed.isAlias, true)
  assert.equal(baseSpeed.localName, 'TOURBUS_BASE_SPEED')
  assert.equal(baseSpeed.exportPath, 'src/hooks/minigames/useTourbusLogic.ts')
  assert.equal(baseSpeed.value, 0.05)

  // The canonical (non-aliased) export carries no alias markers.
  const tourbusBaseSpeed = ks.TOURBUS_BASE_SPEED.find(
    entry => entry.path === 'src/hooks/minigames/minigameConstants.ts'
  )
  assert.equal(tourbusBaseSpeed.isAlias, undefined)
  assert.equal(tourbusBaseSpeed.localName, undefined)
})

test('local symbols expose generics, async, heritage, and literal values', () => {
  const ks = loadSymbols()

  const action = ks.Action.find(entry => entry.path === 'src/types/game.d.ts')
  assert.deepEqual(action.typeParameters, [
    'TType extends ActionType',
    'TPayload = undefined'
  ])

  const ensureAudioContext = ks.ensureAudioContext.find(
    entry => entry.path === 'src/utils/audio/context.ts'
  )
  assert.equal(ensureAudioContext.async, true)

  const activeQuestState = ks.ActiveQuestState.find(
    entry => entry.path === 'src/types/quest.d.ts'
  )
  assert.ok(
    activeQuestState.extends.includes('UnknownRecord'),
    'interface heritage should be recorded under `extends`'
  )

  const modifierCosts = ks.MODIFIER_COSTS.find(
    entry => entry.path === 'src/utils/economyEngine.ts'
  )
  assert.deepEqual(
    modifierCosts.literalKeys,
    ['catering', 'guestlist', 'merch', 'promo', 'soundcheck'],
    'object literal const exports should expose stable top-level literal keys'
  )
})

test('document exposes a self-documenting meta block', () => {
  const doc = loadDocument()

  assert.equal(doc.meta.schemaVersion, 3)
  assert.equal(doc.meta.guidePath, 'docs/agent-symbols-guide.md')
  assert.match(doc.meta.sourceHash, /^[a-f0-9]{64}$/)
  assert.equal(typeof doc.meta.localSymbols, 'number')
  assert.equal(typeof doc.meta.externalSymbols, 'number')
  assert.ok(doc.meta.aliasedReexports >= 1)
  assert.equal(typeof doc.meta.fieldGuide.files, 'string')
  assert.equal(typeof doc.meta.fieldGuide.localName, 'string')
  assert.equal(typeof doc.meta.fieldGuide.literalKeys, 'string')
  assert.equal(typeof doc.meta.fieldGuide.referencedByLocal, 'string')
  assert.equal(typeof doc.meta.fieldGuide.usedByTests, 'string')
  assert.equal(typeof doc.meta.fieldGuide.usedBy, 'string')
  assert.ok(
    doc.meta.indexedFiles >= doc.meta.sourceFiles,
    'indexed file count should include src files and reference-only files'
  )
  // knownSymbols remains the primary index alongside meta.
  assert.equal(typeof doc.knownSymbols, 'object')
  assert.ok(Array.isArray(doc.files['src/domain/questRewards.ts'].exports))
  assert.ok(
    doc.files['src/domain/questRewards.ts'].exports.includes(
      'applyQuestRewards'
    )
  )
  assert.ok(
    doc.files['src/domain/questRewards.ts'].imports.includes('QuestReward')
  )
  assert.ok(
    doc.files['src/hooks/postGig/usePostGigState.ts'].hooks.includes(
      'usePostGigState'
    )
  )
})
