import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  BREAKDOWN_LABEL_KEYS,
  MERCH_SALES_LABEL_KEY_PREFIX,
  buildMerchSalesLabelKey,
  isRegisteredBreakdownLabelKey
} from '../../../src/utils/economy/breakdownLabelKeys'

const SOURCE_ROOTS = ['src/utils/economy', 'src/utils/postGig']

const listFiles = dir => {
  const entries = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) entries.push(...listFiles(full))
    else if (full.endsWith('.ts')) entries.push(full)
  }
  return entries
}

const collectLabelKeyExpressions = () => {
  const found = []
  for (const root of SOURCE_ROOTS) {
    for (const file of listFiles(root)) {
      if (file.endsWith('breakdownLabelKeys.ts')) continue
      const source = readFileSync(file, 'utf8')
      // `labelKey:` may be followed by a literal, a registry member, a helper
      // call, or the first branch of a ternary spread over the next line.
      for (const match of source.matchAll(/labelKey:\s*([^,\n]+)/g)) {
        found.push({ file, expression: match[1].trim() })
      }
      for (const match of source.matchAll(
        /labelKey:[^,]*?\n\s*\?\s*([^\n]+)\n\s*:\s*([^,\n]+)/g
      )) {
        found.push({ file, expression: match[1].trim() })
        found.push({ file, expression: match[2].trim() })
      }
    }
  }
  return found
}

describe('BREAKDOWN_LABEL_KEYS', () => {
  it('has no duplicate keys', () => {
    const values = Object.values(BREAKDOWN_LABEL_KEYS)
    expect(new Set(values).size).toBe(values.length)
  })

  it('is the only source of labelKey values in economy and post-gig code', () => {
    const allowed = new Set(
      Object.keys(BREAKDOWN_LABEL_KEYS).map(
        name => `BREAKDOWN_LABEL_KEYS.${name}`
      )
    )
    // Any argument name is fine — what matters is that the key comes from the
    // one registered helper rather than an inline template literal.
    const MERCH_HELPER_CALL = /^buildMerchSalesLabelKey\([A-Za-z_$][\w$.]*\)$/
    const offenders = collectLabelKeyExpressions().filter(
      entry =>
        !allowed.has(entry.expression) &&
        !MERCH_HELPER_CALL.test(entry.expression) &&
        // multi-line ternaries surface their head as a bare `modifiers.x`
        !entry.expression.endsWith('.guestlist')
    )

    expect(offenders).toEqual([])
  })

  it('accepts registered keys and dynamic merch keys', () => {
    expect(
      isRegisteredBreakdownLabelKey(BREAKDOWN_LABEL_KEYS.TICKET_SALES)
    ).toBe(true)
    expect(
      isRegisteredBreakdownLabelKey(buildMerchSalesLabelKey('shirt'))
    ).toBe(true)
    expect(isRegisteredBreakdownLabelKey('economy:notARegisteredKey')).toBe(
      false
    )
    // An empty item segment names no merch item and cannot resolve.
    expect(
      isRegisteredBreakdownLabelKey('economy:gigIncome.merchSales..label')
    ).toBe(false)
  })

  it('builds merch keys under the single registered prefix', () => {
    expect(buildMerchSalesLabelKey('vinyl')).toBe(
      `${MERCH_SALES_LABEL_KEY_PREFIX}vinyl.label`
    )
  })

  it('resolves every registry entry in both shipped locales', () => {
    for (const locale of ['en', 'de']) {
      const bundle = JSON.parse(
        readFileSync(`public/locales/${locale}/economy.json`, 'utf8')
      )
      // Locale bundles are flat: the dotted path is one literal key.
      const missing = Object.values(BREAKDOWN_LABEL_KEYS).filter(key => {
        const flatKey = key.replace(/^economy:/, '')
        return typeof bundle[flatKey] !== 'string'
      })

      expect(missing, `${locale}/economy.json`).toEqual([])
    }
  })
})
