import { describe, it, expect } from 'vitest'
import {
  clampUnit,
  formatNumber,
  formatCurrency,
  formatSignedFinancialAmount
} from '../../src/utils/numberUtils'
import { finiteNumberOr } from '../../src/utils/finiteNumber'

describe('numberUtils', () => {
  describe('clampUnit', () => {
    it('clamps values to the [0, 1] interval', () => {
      expect(clampUnit(0.5)).toBe(0.5)
      expect(clampUnit(0)).toBe(0)
      expect(clampUnit(1)).toBe(1)
      expect(clampUnit(-0.1)).toBe(0)
      expect(clampUnit(-5)).toBe(0)
      expect(clampUnit(1.1)).toBe(1)
      expect(clampUnit(5)).toBe(1)
    })

    it('returns 0 for non-finite values', () => {
      expect(clampUnit(NaN)).toBe(0)
      expect(clampUnit(Infinity)).toBe(0)
      expect(clampUnit(-Infinity)).toBe(0)
    })
  })

  describe('formatNumber', () => {
    it('formats numbers using en locale by default', () => {
      expect(formatNumber(1234, 'en')).toBe('1,234')
      expect(formatNumber(1234567.89, 'en')).toBe('1,234,568') // Rounds and formats
    })

    it('formats numbers using specified locale', () => {
      // German uses dot as thousands separator
      expect(formatNumber(1234, 'de')).toBe('1.234')
      expect(formatNumber(1234567.89, 'de')).toBe('1.234.568')
    })

    it('handles non-number edge inputs consistently', () => {
      expect(formatNumber(NaN, 'en')).toBe('NaN')
      expect(formatNumber('not a number' as unknown as number, 'en')).toBe(
        'NaN'
      )
      expect(formatNumber(null as unknown as number, 'en')).toBe('0')
      expect(formatNumber(undefined as unknown as number, 'en')).toBe('NaN')
    })
  })

  describe('formatCurrency', () => {
    it('formats currency using en locale by default', () => {
      // 'en' locale currency formatting for EUR
      expect(formatCurrency(50, 'en')).toBe('€50')
      expect(formatCurrency(1234.56, 'en')).toBe('€1,235') // Rounds to 0 fraction digits
    })

    it('formats currency using specified locale', () => {
      // 'de' locale uses non-breaking space before €, but exact space type varies by ICU version.
      // We normalize all whitespace to a standard space for robust environment-independent assertions.
      expect(formatCurrency(50, 'de').replace(/\s/g, ' ')).toBe('50 €')
      expect(formatCurrency(1234.56, 'de').replace(/\s/g, ' ')).toBe('1.235 €')
    })

    it('handles non-number edge inputs consistently', () => {
      expect(formatCurrency(NaN, 'en').replace(/\s+/g, ' ')).toBe('€NaN')
      expect(
        formatCurrency('not a number' as unknown as number, 'en').replace(
          /\s+/g,
          ' '
        )
      ).toBe('€NaN')
      expect(
        formatCurrency(null as unknown as number, 'en').replace(/\s+/g, ' ')
      ).toBe('€0')
      expect(
        formatCurrency(undefined as unknown as number, 'en').replace(
          /\s+/g,
          ' '
        )
      ).toBe('€NaN')
    })

    it('respects signDisplay option', () => {
      expect(formatCurrency(50, 'en', 'always')).toBe('+€50')
      expect(formatCurrency(0, 'en', 'always')).toBe('+€0')
      expect(formatCurrency(-50, 'en', 'always')).toBe('-€50')
      expect(formatCurrency(1000, 'de', 'always').replace(/\s+/g, ' ')).toBe(
        '+1.000 €'
      )

      expect(formatCurrency(1000, 'en', 'exceptZero')).toBe('+€1,000')
      expect(formatCurrency(0, 'en', 'exceptZero')).toBe('€0')

      expect(formatCurrency(50, 'en', 'never')).toBe('€50')
      expect(formatCurrency(-50, 'en', 'never')).toBe('€50')
    })

    // AGENTS.md mandates `formatCurrency(value, i18n.language, signDisplay)` at
    // every currency boundary. These cases pin the full
    // signDisplay × locale × sign matrix so a locale switch can only move
    // separators and the symbol, never precision or the sign policy.
    const SIGN_MATRIX: ReadonlyArray<{
      signDisplay: Intl.NumberFormatOptions['signDisplay']
      value: number
      en: string
      de: string
    }> = [
      { signDisplay: 'auto', value: 1234.56, en: '€1,235', de: '1.235 €' },
      { signDisplay: 'auto', value: 0, en: '€0', de: '0 €' },
      { signDisplay: 'auto', value: -1234.56, en: '-€1,235', de: '-1.235 €' },
      { signDisplay: 'always', value: 1234.56, en: '+€1,235', de: '+1.235 €' },
      { signDisplay: 'always', value: 0, en: '+€0', de: '+0 €' },
      { signDisplay: 'always', value: -1234.56, en: '-€1,235', de: '-1.235 €' },
      {
        signDisplay: 'exceptZero',
        value: 1234.56,
        en: '+€1,235',
        de: '+1.235 €'
      },
      { signDisplay: 'exceptZero', value: 0, en: '€0', de: '0 €' },
      {
        signDisplay: 'exceptZero',
        value: -1234.56,
        en: '-€1,235',
        de: '-1.235 €'
      },
      { signDisplay: 'never', value: 1234.56, en: '€1,235', de: '1.235 €' },
      { signDisplay: 'never', value: 0, en: '€0', de: '0 €' },
      { signDisplay: 'never', value: -1234.56, en: '€1,235', de: '1.235 €' }
    ]

    it.each(SIGN_MATRIX)(
      'formats $value under signDisplay $signDisplay in both locales',
      ({ signDisplay, value, en, de }) => {
        expect(formatCurrency(value, 'en', signDisplay)).toBe(en)
        // German uses a non-breaking space before the symbol whose exact code
        // point varies by ICU version; normalize whitespace only.
        expect(
          formatCurrency(value, 'de', signDisplay).replace(/\s/g, ' ')
        ).toBe(de)
      }
    )

    it('places the symbol and separators per locale convention', () => {
      const enFormatted = formatCurrency(1234567, 'en')
      expect(enFormatted).toBe('€1,234,567')
      expect(enFormatted.startsWith('€')).toBe(true)
      expect(enFormatted).not.toMatch(/€\s/)

      const deFormatted = formatCurrency(1234567, 'de').replace(/\s/g, ' ')
      expect(deFormatted).toBe('1.234.567 €')
      expect(deFormatted.endsWith(' €')).toBe(true)
    })

    it('normalizes -0 to an unsigned zero under every signDisplay', () => {
      const signDisplays: ReadonlyArray<
        Intl.NumberFormatOptions['signDisplay']
      > = ['auto', 'always', 'exceptZero', 'never']
      for (const signDisplay of signDisplays) {
        expect(formatCurrency(-0, 'en', signDisplay)).toBe(
          formatCurrency(0, 'en', signDisplay)
        )
        expect(formatCurrency(-0, 'de', signDisplay)).toBe(
          formatCurrency(0, 'de', signDisplay)
        )
        expect(formatCurrency(-0, 'en', signDisplay)).not.toContain('-')
      }
    })

    it('renders non-finite input without inventing a value', () => {
      expect(formatCurrency(Infinity, 'en')).toBe('€∞')
      expect(formatCurrency(-Infinity, 'en')).toBe('-€∞')
      expect(formatNumber(Infinity, 'en')).toBe('∞')
      expect(formatNumber(-Infinity, 'en')).toBe('-∞')
    })

    it('passes explicit Intl.NumberFormat options so host defaults cannot drift', () => {
      // Formatters are cached per `${language}-${optionsString}`, so this uses a
      // language tag no other case in this file touches.
      const OriginalNumberFormat = Intl.NumberFormat
      const constructorArgs: Array<
        [Intl.LocalesArgument, Intl.NumberFormatOptions | undefined]
      > = []
      // A recording subclass rather than `vi.spyOn`: the production code calls
      // `new Intl.NumberFormat(...)`, and a plain spy is not constructible.
      class RecordingNumberFormat extends OriginalNumberFormat {
        constructor(
          locales?: Intl.LocalesArgument,
          options?: Intl.NumberFormatOptions
        ) {
          constructorArgs.push([locales, options])
          super(locales, options)
        }
      }
      Intl.NumberFormat = RecordingNumberFormat as typeof Intl.NumberFormat
      try {
        formatCurrency(1234, 'fr-CA', 'exceptZero')

        expect(constructorArgs).toEqual([
          [
            'fr-CA',
            {
              style: 'currency',
              currency: 'EUR',
              signDisplay: 'exceptZero',
              maximumFractionDigits: 0
            }
          ]
        ])
      } finally {
        Intl.NumberFormat = OriginalNumberFormat
      }
    })
  })

  describe('finiteNumberOr', () => {
    it('returns finite numbers and falls back for non-finite or non-number values', () => {
      expect(finiteNumberOr(12, 99)).toBe(12)
      expect(finiteNumberOr(Number.NaN, 99)).toBe(99)
      expect(finiteNumberOr(Number.POSITIVE_INFINITY, 99)).toBe(99)
      expect(finiteNumberOr(Number.NEGATIVE_INFINITY, 99)).toBe(99)
      expect(finiteNumberOr('12', 99)).toBe(99)
    })

    it('normalizes -0 to +0 so it cannot reach state', () => {
      // `Object.is` is required here: `-0 === 0` is true, so `toBe` alone would
      // not distinguish the two.
      expect(Object.is(finiteNumberOr(-0, 99), 0)).toBe(true)
      expect(Object.is(finiteNumberOr(-0, 99), -0)).toBe(false)
    })
  })

  describe('formatSignedFinancialAmount', () => {
    it('formats income correctly', () => {
      expect(formatSignedFinancialAmount(50, 'income', 'en')).toBe('+€50')
      // Even if raw value is negative, income forces a leading +
      expect(formatSignedFinancialAmount(-50, 'income', 'en')).toBe('+€50')
      expect(formatSignedFinancialAmount(0, 'income', 'en')).toBe('+€0')
    })

    it('formats expenses correctly', () => {
      expect(formatSignedFinancialAmount(50, 'expense', 'en')).toBe('-€50')
      // Even if raw value is negative, expense forces a leading -
      expect(formatSignedFinancialAmount(-50, 'expense', 'en')).toBe('-€50')
    })

    it('renders a zero expense unsigned rather than as -€0', () => {
      // `-Math.abs(0)` is `-0`; without the normalization in formatCurrency
      // Intl renders it as `-€0`, which reads as a nonexistent debt.
      expect(formatSignedFinancialAmount(0, 'expense', 'en')).toBe('+€0')
      expect(
        formatSignedFinancialAmount(0, 'expense', 'de').replace(/\s/g, ' ')
      ).toBe('+0 €')
    })

    it('uses the specified locale', () => {
      expect(
        formatSignedFinancialAmount(50, 'income', 'de').replace(/\s/g, ' ')
      ).toBe('+50 €')
      expect(
        formatSignedFinancialAmount(50, 'expense', 'de').replace(/\s/g, ' ')
      ).toBe('-50 €')
    })
  })
})
