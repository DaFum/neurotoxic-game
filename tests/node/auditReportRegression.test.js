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
  const source = readSource('src/components/overworld/OverworldMap.tsx')
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
  const source = readSource('src/components/overworld/OverworldMap.tsx')
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

test('supply stop purchases route through Band HQ purchase logic', () => {
  const source = readSource('src/ui/SupplyStopModal.tsx')
  assert.match(source, /usePurchaseLogic/)
  assert.doesNotMatch(source, /processPurchaseEffect/)
})
