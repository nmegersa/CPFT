import { Link } from 'react-router-dom'
import BudgetBar from '../components/BudgetBar'
import StatCard from '../components/StatCard'
import TransactionRow from '../components/TransactionRow'
import UtilizationRing from '../components/UtilizationRing'
import {
  accounts,
  budgets,
  creditProfile,
  getCategory,
  insights,
  spentByCategory,
  totalExpenses,
  totalIncome,
  transactions,
} from '../data/mockData'
import {
  formatCurrency,
  utilizationLabels,
  utilizationLevel,
} from '../utils/format'

export default function Dashboard() {
  const spent = spentByCategory()
  const income = totalIncome()
  const expenses = totalExpenses()
  const cashBalance = accounts
    .filter((a) => a.accountType !== 'credit_card')
    .reduce((sum, a) => sum + a.currentBalance, 0)

  const utilization = creditProfile.currentBalance / creditProfile.creditLimit
  const level = utilizationLevel(utilization)

  const topBudgets = [...budgets]
    .sort((a, b) => {
      const ra = (spent.get(a.categoryId) ?? 0) / a.limitAmount
      const rb = (spent.get(b.categoryId) ?? 0) / b.limitAmount
      return rb - ra
    })
    .slice(0, 4)

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <span className="subtitle">July 2026 overview</span>
      </div>

      <div className="stack">
        <div className="grid grid-stats">
          <StatCard
            label="Total Balance"
            value={formatCurrency(cashBalance)}
            hint="Across checking, savings & cash"
          />
          <StatCard
            label="Income (30d)"
            value={formatCurrency(income)}
            tone="positive"
          />
          <StatCard
            label="Spending (30d)"
            value={formatCurrency(expenses)}
            tone="negative"
          />
          <StatCard
            label="Credit Utilization"
            value={`${(utilization * 100).toFixed(1)}%`}
            hint={utilizationLabels[level]}
          />
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-title">
              Budgets
              <Link to="/app/budgets">View all</Link>
            </div>
            {topBudgets.map((b) => {
              const category = getCategory(b.categoryId)
              return (
                <BudgetBar
                  key={b.id}
                  name={category?.name ?? 'Unknown'}
                  color={category?.color ?? '#64748b'}
                  spent={spent.get(b.categoryId) ?? 0}
                  limit={b.limitAmount}
                />
              )
            })}
          </div>

          <div className="stack">
            <div className="card">
              <div className="card-title">
                Credit Health
                <Link to="/app/credit">Simulator</Link>
              </div>
              <div className="ring-wrap">
                <UtilizationRing ratio={utilization} />
                <div className="detail-grid" style={{ flex: 1, minWidth: 160 }}>
                  <div>
                    <div className="detail-label">Balance</div>
                    <div className="detail-value">
                      {formatCurrency(creditProfile.currentBalance)}
                    </div>
                  </div>
                  <div>
                    <div className="detail-label">Credit limit</div>
                    <div className="detail-value">
                      {formatCurrency(creditProfile.creditLimit)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Insights</div>
              {insights.map((ins) => (
                <div className="insight" key={ins.id}>
                  <div className={`insight-bar ${ins.severity}`} />
                  <div>
                    <h4>{ins.title}</h4>
                    <p>{ins.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            Recent Transactions
            <Link to="/app/transactions">View all</Link>
          </div>
          {transactions.slice(0, 6).map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      </div>
    </>
  )
}
