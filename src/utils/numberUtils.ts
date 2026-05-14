// Module-level cache for Intl.NumberFormat instances to prevent repeated instantiation overhead
const numberFormatters = new Map<string, Intl.NumberFormat>()

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

export const formatNumber = (value: number, language = 'en'): string => {
  const formatter = getFormatter(language, 'decimal-0', {
    style: 'decimal',
    maximumFractionDigits: 0
  })
  return formatter.format(value)
}

/**
 * Formats a financial amount as a translated, signed string for post-gig reports.
 * Routes through `economy:report.amount_positive` / `amount_negative` so each
 * locale controls sign placement and currency glyph.
 */
export const formatSignedFinancialAmount = (
  value: number,
  type: 'income' | 'expense',
  t: (key: string, options?: Record<string, unknown>) => string,
  language = 'en'
): string => {
  const key =
    type === 'income'
      ? 'economy:report.amount_positive'
      : 'economy:report.amount_negative'
  return t(key, { amount: formatNumber(Math.abs(value), language) })
}

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
