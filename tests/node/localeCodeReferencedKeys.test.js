import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (lang, ns) =>
  JSON.parse(readFileSync(`public/locales/${lang}/${ns}.json`, 'utf8'))

// Keys the code references (derivations.ts detailKeys, effectFormatter
// fallback id, venue and trait fallbacks) that previously had no locale entry.
const CODE_REFERENCED_KEYS = [
  ['economy', 'gigExpenses.swingDampener.detail'],
  ['economy', 'gigIncome.swingBoost.detail'],
  ['economy', 'unknownBreakdownLabel'],
  ['ui', 'quest.unknown'],
  ['ui', 'event.venueFallback'],
  ['traits', 'neuroOverclock.name'],
  ['traits', 'neuroOverclock.desc'],
  ['traits', 'neuroOverclock.unlockHint'],
  ['items', 'contraband.c_diy_overdrive.name'],
  ['items', 'contraband.c_diy_overdrive.description']
]

test('code-referenced keys exist in both locales with non-empty text', () => {
  for (const lang of ['en', 'de']) {
    for (const [ns, key] of CODE_REFERENCED_KEYS) {
      const value = read(lang, ns)[key]
      assert.equal(typeof value, 'string', `${lang} ${ns}:${key}`)
      assert.ok(value.length > 0, `${lang} ${ns}:${key} is empty`)
    }
  }
})
