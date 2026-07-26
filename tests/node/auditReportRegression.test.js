import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const readSource = path => readFileSync(path, 'utf8')

const parseTypeScript = path =>
  ts.createSourceFile(
    path,
    readSource(path),
    ts.ScriptTarget.Latest,
    true,
    path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )

const walk = (node, visit) => {
  visit(node)
  ts.forEachChild(node, child => walk(child, visit))
}

test('rhythm hook uses audioEngine facade for audio orchestration helpers', () => {
  const source = readSource('src/hooks/rhythmGame/useRhythmGameAudio.ts')
  assert.doesNotMatch(source, /utils\/audio\/rhythmGameAudioUtils/)
  assert.match(source, /utils\/audio\/audioEngine/)
})

test('offline overworld SVG copy and colors are tokenized/i18n-driven', () => {
  const source = readSource(
    'src/components/overworld/hooks/useOverworldUrls.ts'
  )
  const css = readSource('src/index.css')
  assert.match(source, /const SVG_TOKEN_FALLBACKS = /)
  assert.match(source, /getComputedStyle\(document\.documentElement\)/)
  assert.match(source, /const createSvgTokenStyle = \(\): string =>/)
  assert.doesNotMatch(source, /--color-[\w-]+:var\(--color-[\w-]+\)/)
  assert.match(source, /fill="var\(--color-star-white\)"/)
  assert.match(source, /stroke="var\(--color-void-black\)"/)
  // Find mapping of token names to BRAND_COLOR_HEX keys
  for (const [, tokenName] of source.matchAll(
    /'(--color-[^']+)':\s*BRAND_COLOR_HEX\['([^']+)'\]/g
  )) {
    // We don't have the literal value here, so we verify the CSS file has the token name defined
    assert.match(css, new RegExp(`${tokenName}:\\s*(#[0-9a-fA-F]{3,8});`))
  }
  assert.doesNotMatch(source, />OFFLINE MAP</)
  assert.doesNotMatch(
    source,
    />Routes and markers remain distinct while offline</
  )
  assert.doesNotMatch(source, /createOfflineVanUrl\('Player van', 'YOU'\)/)
  assert.doesNotMatch(source, /createOfflineVanUrl\('Rival van', 'RIVAL'\)/)
  assert.doesNotMatch(source, /\b(?:fill|stroke)="(?:black|white)"/)
})

test('offline overworld SVG memo refreshes when translation callback changes', () => {
  const source = readSource(
    'src/components/overworld/hooks/useOverworldUrls.ts'
  )
  assert.match(source, /\}, \[isOnlineNetwork, t\]\)/)
})

test('offline overworld SVG hook does not expose unused test-only cache reset', () => {
  const source = readSource(
    'src/components/overworld/hooks/useOverworldUrls.ts'
  )
  assert.doesNotMatch(source, /resetSvgTokenStyleCacheForTesting/)
})

test('asset hub styles use color tokens instead of hardcoded black literals', () => {
  const source = readSource('src/components/assets/assetsHub.css')
  assert.doesNotMatch(source, /rgb\(0 0 0 \//)
})

test('brand offer duration jitter uses shared random index helper', () => {
  const source = readSource('src/utils/brandOfferFlavor/variants.ts')
  assert.match(source, /const DURATION_JITTERS = /)
  assert.match(source, /pickIndex\(DURATION_JITTERS, rng\)/)
  assert.doesNotMatch(source, /Math\.floor\(rng\(\) \* 4\) - 1/)
})

test('quest event presentations contain no duplicated registry metadata or literal quest ids', () => {
  const sourceFile = parseTypeScript('src/data/events/quests.ts')
  let definitions = 0

  walk(sourceFile, node => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'defineQuestOfferEvent'
    ) {
      definitions++
      const [questId, presentation] = node.arguments
      assert.ok(
        ts.isIdentifier(questId),
        'quest id must use a QUEST_* constant'
      )
      assert.ok(
        ts.isObjectLiteralExpression(presentation),
        'quest presentation must be an object literal'
      )
      const propertyNames = presentation.properties
        .filter(ts.isPropertyAssignment)
        .map(property => property.name.getText(sourceFile))
      for (const forbidden of ['category', 'trigger', 'chance']) {
        assert.ok(
          !propertyNames.includes(forbidden),
          `${questId.text} duplicates registry field ${forbidden}`
        )
      }
    }

    if (
      ts.isPropertyAssignment(node) &&
      node.name.getText(sourceFile) === 'quest' &&
      ts.isStringLiteral(node.initializer) &&
      node.initializer.text.startsWith('quest_')
    ) {
      assert.fail(`literal quest id found: ${node.initializer.text}`)
    }
  })

  assert.ok(definitions > 0, 'expected defineQuestOfferEvent calls')
})

test('random index call sites do not inline Math.floor around RNG calls', () => {
  const files = [
    'src/utils/mapGenerator.ts',
    'src/utils/rhythmUtils.ts',
    'src/utils/rivalEngine.ts',
    'src/utils/shuffleUtils.ts'
  ]

  for (const file of files) {
    const sourceFile = parseTypeScript(file)
    walk(sourceFile, node => {
      if (
        !ts.isCallExpression(node) ||
        !ts.isPropertyAccessExpression(node.expression) ||
        node.expression.expression.getText(sourceFile) !== 'Math' ||
        node.expression.name.text !== 'floor'
      ) {
        return
      }

      let containsRandomCall = false
      for (const argument of node.arguments) {
        walk(argument, descendant => {
          if (!ts.isCallExpression(descendant)) return
          const callee = descendant.expression.getText(sourceFile)
          if (['rng', 'random', 'this.random'].includes(callee)) {
            containsRandomCall = true
          }
        })
      }
      assert.equal(
        containsRandomCall,
        false,
        `${file} inlines a random index calculation: ${node.getText(sourceFile)}`
      )
    })
  }
})

test('tourbus damage constants stay module-private implementation details', () => {
  const source = readSource('src/hooks/minigames/useTourbusLogic.ts')
  assert.doesNotMatch(source, /export const HIT_DAMAGE_/)
})

test('ui guards reuse shared record-object utility', () => {
  const files = [
    'src/components/postGig/NegotiationModal.tsx',
    'src/components/postGig/DealCard.tsx',
    'src/ui/ContrabandStash.tsx'
  ]
  for (const file of files) {
    const source = readSource(file)
    assert.match(source, /isLooseRecord/)
  }
})

test('milestones do not store raw action objects or raw toast actions', () => {
  const milestones = readSource('src/data/milestones/milestones.ts')
  const reducer = readSource('src/context/gameReducer.ts')
  assert.doesNotMatch(milestones, /rewardAction\??:\s*GameAction/)
  assert.doesNotMatch(milestones, /type:\s*ActionTypes\./)
  assert.doesNotMatch(reducer, /type:\s*ActionTypes\.ADD_TOAST/)
  assert.match(reducer, /createAddToastAction/)
})

test('milestone toast labels use namespaced flat ui keys', () => {
  const milestones = readSource('src/data/milestones/milestones.ts')
  const enUi = JSON.parse(readSource('public/locales/en/ui.json'))
  const deUi = JSON.parse(readSource('public/locales/de/ui.json'))
  const labelKeys = [...milestones.matchAll(/labelKey:\s*'([^']+)'/g)].map(
    match => match[1]
  )

  assert.ok(labelKeys.length > 0, 'expected milestone label keys')
  for (const labelKey of labelKeys) {
    assert.match(labelKey, /^ui:milestones\.[\w_]+$/)
    const key = labelKey.slice('ui:'.length)
    for (const [locale, entries] of Object.entries({ en: enUi, de: deUi })) {
      assert.equal(
        typeof entries[key],
        'string',
        `${locale}/ui.json missing ${key}`
      )
      assert.notEqual(entries[key].trim(), '')
    }
  }
})

test('supply stop purchases route through Band HQ purchase logic', () => {
  const source = readSource('src/ui/SupplyStopModal.tsx')
  assert.match(source, /usePurchaseLogic/)
  assert.match(source, /transformPlayerPatch: applyBlackMarketFamePenalty/)
  assert.doesNotMatch(source, /processPurchaseEffect/)
})

test('supply stop black market toast reports applied fame loss', () => {
  const source = readSource('src/ui/SupplyStopModal.tsx')
  const enUi = readSource('public/locales/en/ui.json')
  const deUi = readSource('public/locales/de/ui.json')
  assert.match(source, /fameLostRef\.current = currentFame - nextFame/)
  assert.match(source, /amount: fameLostRef\.current/)
  assert.doesNotMatch(source, /updatePlayer\(\{\s*fame: nextFame/)
  assert.doesNotMatch(source, /Lost 5 Fame/)
  assert.match(enUi, /Lost \{\{amount\}\} Fame/)
  assert.match(deUi, /\{\{amount\}\} Fame verloren/)
})
