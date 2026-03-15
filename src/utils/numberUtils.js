export const formatNumber = (value, language = 'en') => {
  return new Intl.NumberFormat(language, {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(value)
}
