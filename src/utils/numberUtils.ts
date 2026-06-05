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
  if (!numberFormatters.has(key)) {
    numberFormatters.set(key, new Intl.NumberFormat(language, optionsObj))
  }
  return numberFormatters.get(key) as Intl.NumberFormat
}

/**
 * Formats an integer-like number with the user's selected language.
 *
 * @param value - Number to display.
 * @param language - BCP 47 language tag used by `Intl.NumberFormat`.
 * @returns Locale-formatted decimal string without fractional digits.
 */
export const formatNumber = (value: number, language = 'en'): string => {
  const formatter = getFormatter(language, 'decimal-0', {
    style: 'decimal',
    maximumFractionDigits: 0
  })
  return formatter.format(value)
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
  language = 'en'
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
 */
export const formatCurrency = (
  value: number,
  language = 'en',
  signDisplay: Intl.NumberFormatOptions['signDisplay'] = 'auto'
): string => {
  const formatter = getFormatter(language, `currency-EUR-0-${signDisplay}`, {
    style: 'currency',
    currency: 'EUR',
    signDisplay,
    maximumFractionDigits: 0
  })
  return formatter.format(value)
}
