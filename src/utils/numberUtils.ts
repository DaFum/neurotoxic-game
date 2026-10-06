// Module-level cache for Intl.NumberFormat instances to prevent repeated instantiation overhead
const numberFormatters = new Map<string, Intl.NumberFormat>()

/**
 * Clamps a numeric unit interval value to `[0, 1]`.
 *
 * @param value - Number to clamp.
 * @returns `value` bounded to the unit interval.
 */
export const clampUnit = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0

/**
 * Returns a cached Intl.NumberFormat instance based on language and options.
 */
const getFormatter = (
  language: string,
  optionsString: string,
  optionsObj: Intl.NumberFormatOptions
): Intl.NumberFormat => {
  const key = `${language}-${optionsString}`
  let formatter = numberFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(language, optionsObj)
    numberFormatters.set(key, formatter)
  }
  return formatter
}

/**
 * Formats a number with the user's selected language.
 *
 * @param value - Number to display.
 * @param language - BCP 47 language tag used by `Intl.NumberFormat`.
 * @param fractionDigits - Exact number of fractional digits. Defaults to `0`.
 * @returns Locale-formatted decimal string, so German gets a decimal comma.
 */
export const formatNumber = (
  value: number,
  language: string,
  fractionDigits = 0
): string => {
  const formatter = getFormatter(language, `decimal-${fractionDigits}`, {
    style: 'decimal',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  })
  return formatter.format(value)
}

/**
 * Formats a fraction as a locale-aware percentage.
 *
 * @param value - Fraction to display, where `0.25` renders as 25%.
 * @param language - BCP 47 language tag used by `Intl.NumberFormat`.
 * @param options - Fraction digits (both default to `0`) and sign policy.
 * @returns Locale-formatted percent string, including the percent sign.
 *
 * @remarks
 * Non-finite input renders as 0% rather than `NaN%`, and `-0` is normalized to
 * `+0` so it never prints a leading minus. German output uses a decimal comma
 * and a no-break space before the sign.
 */
export const formatPercent = (
  value: number,
  language: string,
  options: Pick<
    Intl.NumberFormatOptions,
    'minimumFractionDigits' | 'maximumFractionDigits' | 'signDisplay'
  > = {}
): string => {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = Math.max(0, minimumFractionDigits),
    signDisplay = 'auto'
  } = options
  const formatter = getFormatter(
    language,
    `percent-${minimumFractionDigits}-${maximumFractionDigits}-${signDisplay}`,
    {
      style: 'percent',
      minimumFractionDigits,
      maximumFractionDigits,
      signDisplay
    }
  )
  const safe = Number.isFinite(value) ? value : 0
  return formatter.format(safe === 0 ? 0 : safe)
}

/**
 * Formats a financial amount as a signed currency string for post-gig reports.
 * Income forces a leading `+`, expenses force a leading `-` so the column-vs-row
 * sign stays consistent regardless of the raw value's sign. Locale-correct
 * currency glyph + separators come from Intl.NumberFormat.
 */
export const formatSignedFinancialAmount = (
  value: number,
  type: 'income' | 'expense',
  language: string
): string => {
  const magnitude = Math.abs(value)
  const signed = type === 'income' ? magnitude : -magnitude
  return formatCurrency(signed, language, 'always')
}

/**
 * Formats a euro amount with locale-aware separators and sign handling.
 *
 * @param value - Currency amount in euros.
 * @param language - BCP 47 language tag used by `Intl.NumberFormat`.
 * @param signDisplay - Intl sign display policy. Defaults to `'auto'`.
 * @returns Locale-formatted euro currency string.
 *
 * @remarks
 * `-0` is normalized to `+0` before formatting. `Intl.NumberFormat` renders it
 * with a leading minus, so a zero expense coming through
 * {@link formatSignedFinancialAmount} would otherwise read as `-€0`.
 */
export const formatCurrency = (
  value: number,
  language: string,
  signDisplay: Intl.NumberFormatOptions['signDisplay'] = 'auto'
): string => {
  const formatter = getFormatter(language, `currency-EUR-0-${signDisplay}`, {
    style: 'currency',
    currency: 'EUR',
    signDisplay,
    maximumFractionDigits: 0
  })
  return formatter.format(value === 0 ? 0 : value)
}
