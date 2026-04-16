// TODO: Review this file
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
