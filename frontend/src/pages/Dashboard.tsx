import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BudgetBar from '../components/BudgetBar'
import StatCard from '../components/StatCard'
import UtilizationRing from '../components/UtilizationRing'
import { financeApi, type Account, type Budget, type Category, type CreditProfile, type Tx } from '../api/finance'
import TransactionListItem from '../components/TransactionListItem'
import { formatCurrency, utilizationLabels, utilizationLevel } from '../utils/format'

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [txs, setTxs] = useState<Tx[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [profiles, setProfiles] = useState<CreditProfile[]>([])
  const [budgetRows, setBudgetRows] = useState<Budget[]>([])

  useEffect(() => {
    const n = new Date()
    Promise.all([
      financeApi.accounts(),
      financeApi.transactions(),
      financeApi.categories(),
      financeApi.creditProfiles(),
      financeApi.budgets(n.getMonth() + 1, n.getFullYear()),
    ]).then(([a, t, c, p, b]) => {
      setAccounts(a)
      setTxs(t)
      setCategories(c)
      setProfiles(p)
      setBudgetRows(b)
    })
  }, [])

  const since = daysAgo(30)
  const recent = txs.filter((t) => new Date(t.transaction_date + 'T00:00:00') >= since)

  const income = recent
    .filter((t) => t.transaction_type === 'income' || t.transaction_type === 'refund')
    .reduce((s, t) => s + Number(t.amount), 0)
  const expenses = recent
    .filter((t) => t.transaction_type === 'expense' || t.transaction_type === 'fee')
    .reduce((s, t) => s + Number(t.amount), 0)

  const assets = accounts
    .filter((a) => a.account_type !== 'credit_card')
    .reduce((s, a) => s + Number(a.current_balance), 0)
  const ccDebt = accounts
    .filter((a) => a.account_type === 'credit_card')
    .reduce((s, a) => s + Number(a.current_balance), 0)
  const totalBalance = assets - ccDebt

  const totalCcBal = profiles.reduce((s, p) => s + Number(p.current_balance), 0)
  const totalCcLimit = profiles.reduce((s, p) => s + Number(p.credit_limit), 0)
  const utilization = totalCcLimit > 0 ? totalCcBal / totalCcLimit : 0
  const level = utilizationLevel(utilization)

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const accById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])

  const monthTxs = txs.filter((t) => {
    const d = new Date(t.transaction_date + 'T00:00:00')
    const n = new Date()
    return t.transaction_type === 'expense' && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
  })

  const topBudgets = budgetRows
    .map((b) => {
      const cat = catById.get(b.category_id)
      if (!cat) return null
      const spent = monthTxs.filter((t) => t.category_id === cat.id).reduce((s, t) => s + Number(t.amount), 0)
      return { cat, limit: Number(b.limit_amount), spent }
    })
    .filter((b): b is { cat: Category; limit: number; spent: number } => b !== null)
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit)
    .slice(0, 4)

  const subtitle = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <span className="subtitle">{subtitle} overview</span>
      </div>

      <div className="stack">
        <div className="grid grid-stats">
          <StatCard
            label="Total Balance"
            value={formatCurrency(totalBalance)}
            hint="Assets minus credit card debt"
          />
          <StatCard label="Income (30d)" value={formatCurrency(income)} tone="positive" />
          <StatCard label="Spending (30d)" value={formatCurrency(expenses)} tone="negative" />
          <StatCard
            label="Credit Utilization"
            value={profiles.length ? `${(utilization * 100).toFixed(1)}%` : '—'}
            hint={profiles.length ? utilizationLabels[level] : 'Add a credit card profile'}
          />
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-title">Budgets <Link to="/app/budgets">View all</Link></div>
            {topBudgets.length === 0 ? (
              <div className="empty">Add transactions to see budget progress.</div>
            ) : (
              topBudgets.map(({ cat, limit, spent }) => (
                <BudgetBar key={cat.id} name={cat.name} color={cat.color ?? '#64748b'} spent={spent} limit={limit} />
              ))
            )}
          </div>

          <div className="card">
            <div className="card-title">Credit Health <Link to="/app/credit">Details</Link></div>
            {profiles.length === 0 ? (
              <div className="empty">Set up a credit card on Accounts or Credit.</div>
            ) : (
              <div className="ring-wrap">
                <UtilizationRing ratio={utilization} />
                <div className="detail-grid" style={{ flex: 1, minWidth: 160 }}>
                  <div>
                    <div className="detail-label">Balance owed</div>
                    <div className="detail-value">{formatCurrency(totalCcBal)}</div>
                  </div>
                  <div>
                    <div className="detail-label">Total limit</div>
                    <div className="detail-value">{formatCurrency(totalCcLimit)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card-title">Recent Transactions <Link to="/app/transactions">View all</Link></div>
          {txs.length === 0 ? (
            <div className="card empty">No transactions yet.</div>
          ) : (
            txs.slice(0, 6).map((tx) => (
              <TransactionListItem
                key={tx.id}
                tx={tx}
                category={tx.category_id ? catById.get(tx.category_id) : null}
                accountName={accById.get(tx.account_id)?.account_name}
              />
            ))
          )}
        </div>
      </div>
    </>
  )
}
