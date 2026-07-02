import BudgetBar from '../components/BudgetBar'
import StatCard from '../components/StatCard'
import { budgets, getCategory, spentByCategory } from '../data/mockData'
import { budgetLevel, formatCurrency } from '../utils/format'

export default function Budgets() {
  const spent = spentByCategory()

  const totalLimit = budgets.reduce((sum, b) => sum + b.limitAmount, 0)
  const totalSpent = budgets.reduce(
    (sum, b) => sum + (spent.get(b.categoryId) ?? 0),
    0,
  )
  const overCount = budgets.filter(
    (b) => budgetLevel(spent.get(b.categoryId) ?? 0, b.limitAmount) === 'danger',
  ).length
  const warningCount = budgets.filter(
    (b) => budgetLevel(spent.get(b.categoryId) ?? 0, b.limitAmount) === 'warning',
  ).length

  const sorted = [...budgets].sort((a, b) => {
    const ra = (spent.get(a.categoryId) ?? 0) / a.limitAmount
    const rb = (spent.get(b.categoryId) ?? 0) / b.limitAmount
    return rb - ra
  })

  return (
    <>
      <div className="page-header">
        <h1>Budgets</h1>
        <span className="subtitle">July 2026</span>
      </div>

      <div className="stack">
        <div className="grid grid-stats">
          <StatCard
            label="Total Budgeted"
            value={formatCurrency(totalLimit)}
          />
          <StatCard
            label="Total Spent"
            value={formatCurrency(totalSpent)}
            hint={`${Math.round((totalSpent / totalLimit) * 100)}% of monthly budget`}
          />
          <StatCard
            label="Needs Attention"
            value={`${overCount + warningCount}`}
            hint={`${overCount} over budget · ${warningCount} near limit`}
            tone={overCount > 0 ? 'negative' : 'default'}
          />
        </div>

        <div className="grid budget-grid">
          {sorted.map((b) => {
            const category = getCategory(b.categoryId)
            return (
              <div className="card budget-card" key={b.id}>
                <BudgetBar
                  name={category?.name ?? 'Unknown'}
                  color={category?.color ?? '#64748b'}
                  spent={spent.get(b.categoryId) ?? 0}
                  limit={b.limitAmount}
                />
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
