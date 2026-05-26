import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFile } from 'node:fs/promises'

const requiredKeys = [
  'section.tourbus.alt',
  'section.studio.alt',
  'section.bandhaus.alt',
  'section.workshop.alt',
  'hub.status.cash',
  'hub.status.daily',
  'hub.status.debt',
  'hub.status.campaigns',
  'hub.status.noDebt',
  'hub.actions.acquire',
  'hub.actions.manageSlot',
  'hub.actions.inspectFinance',
  'hub.slotState.empty',
  'hub.slotState.installed',
  'hub.slotState.locked',
  'hub.slotState.damaged',
  'hub.finance.title',
  'hub.finance.noCampaigns',
  'hub.accessibility.sectionTabs',
  'hub.accessibility.slotAction'
]

const readAssetsLocale = async locale => {
  const raw = await readFile(`public/locales/${locale}/assets.json`, 'utf8')
  return JSON.parse(raw)
}

const en = await readAssetsLocale('en')
const de = await readAssetsLocale('de')

describe('asset hub locale keys', () => {
  for (const key of requiredKeys) {
    it(`${key} exists in en and de`, () => {
      assert.equal(typeof en[key], 'string')
      assert.notEqual(en[key].trim(), '')
      assert.equal(typeof de[key], 'string')
      assert.notEqual(de[key].trim(), '')
    })
  }
})
