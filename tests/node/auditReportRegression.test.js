import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const readSource = path => readFileSync(path, 'utf8')

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
