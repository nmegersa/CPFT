export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`
}

export function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export type UtilizationLevel = 'excellent' | 'good' | 'risky' | 'high'

export function utilizationLevel(ratio: number): UtilizationLevel {
  if (ratio < 0.1) return 'excellent'
  if (ratio < 0.3) return 'good'
  if (ratio < 0.5) return 'risky'
  return 'high'
}

export const utilizationLabels: Record<UtilizationLevel, string> = {
  excellent: 'Excellent',
  good: 'Good',
  risky: 'Risky',
  high: 'High Risk',
}

export const utilizationMessages: Record<UtilizationLevel, string> = {
  excellent: 'Excellent utilization. This is generally a healthy range.',
  good: 'Good utilization. You are below the commonly recommended 30% threshold.',
  risky: 'Your utilization is getting high. Consider paying down your balance.',
  high: 'High utilization. This may hurt your credit health if reported.',
}

export type BudgetLevel = 'good' | 'warning' | 'danger'

export function budgetLevel(spent: number, limit: number): BudgetLevel {
  const ratio = spent / limit
  if (ratio >= 1) return 'danger'
  if (ratio >= 0.8) return 'warning'
  return 'good'
}
