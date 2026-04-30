export interface FinancialBreakdownItem {
  labelKey: string
  value: number
  detailKey?: string
  detailParams?: Record<string, unknown>
}

export interface PostGigFinancials {
  income: { total: number; breakdown: FinancialBreakdownItem[] }
  expenses: { total: number; breakdown: FinancialBreakdownItem[] }
  net: number
}
