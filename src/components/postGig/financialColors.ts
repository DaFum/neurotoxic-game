export type FinancialEntryType = 'income' | 'expense'

interface FinancialColorClasses {
  text: string
  border: string
  borderLight: string
}

const INCOME_COLORS: FinancialColorClasses = {
  text: 'text-toxic-green',
  border: 'border-toxic-green',
  borderLight: 'border-toxic-green/40'
}

const EXPENSE_COLORS: FinancialColorClasses = {
  text: 'text-blood-red',
  border: 'border-blood-red',
  borderLight: 'border-blood-red/40'
}

export const getFinancialColors = (
  type: FinancialEntryType
): FinancialColorClasses => (type === 'income' ? INCOME_COLORS : EXPENSE_COLORS)
