// Module-level cache for Intl.NumberFormat instances to prevent repeated instantiation overhead
const numberFormatters = new Map()

/**
 * Returns a cached Intl.NumberFormat instance based on language and options.
 */
const getFormatter = (language, optionsString, optionsObj) => {
  const key = `${language}-${optionsString}`
  if (!numberFormatters.has(key)) {
    numberFormatters.set(key, new Intl.NumberFormat(language, optionsObj))
  }
  return numberFormatters.get(key)
}

export const formatNumber = (value, language = 'en') => {
  const formatter = getFormatter(language, 'decimal-0', {
    style: 'decimal',
    maximumFractionDigits: 0
  })
  return formatter.format(value)
}

export const formatCurrency = (value, language = 'en', signDisplay = 'auto') => {
  const formatter = getFormatter(language, `currency-EUR-0-${signDisplay}`, {
    style: 'currency',
    currency: 'EUR',
    signDisplay,
    maximumFractionDigits: 0
  })
  return formatter.format(value)
}
