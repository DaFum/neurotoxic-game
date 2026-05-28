type FinancialEntryType = 'income' | 'expense'

interface FinancialColorClasses {
  text: string
  border: string
  borderLight: string
}

const INCOME_COLORS: FinancialColorClasses = {
  text: 'text-warning-yellow',
  border: 'border-warning-yellow',
  borderLight: 'border-warning-yellow/40'
}

const EXPENSE_COLORS: FinancialColorClasses = {
  text: 'text-blood-red-bright',
  border: 'border-blood-red',
  borderLight: 'border-blood-red/40'
}

export const getFinancialColors = (
  type: FinancialEntryType
): FinancialColorClasses => (type === 'income' ? INCOME_COLORS : EXPENSE_COLORS)
