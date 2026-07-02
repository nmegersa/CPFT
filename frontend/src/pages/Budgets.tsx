import { useEffect, useMemo, useState } from 'react'
import BudgetBar from '../components/BudgetBar'
import StatCard from '../components/StatCard'
import { financeApi, type Account, type Category, type Tx } from '../api/finance'
import { budgetLevel, formatCurrency, formatDate } from '../utils/format'

// Monthly limits by category name (until budgets are user-editable).
const LIMITS: Record<string, number> = {
  Rent: 850,
  Food: 300,
  School: 200,
  Shopping: 150,
  Gas: 120,
  Entertainment: 100,
  Subscriptions: 60,
}

export default function Budgets() {
  const [categories, setCategories] = useState<Category[]>([])
  const [txs, setTxs] = useState<Tx[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selected, setSelected] = useState<Category | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([financeApi.categories(), financeApi.transactions(), financeApi.accounts()])
      .then(([c, t, a]) => {
        setCategories(c)
        setTxs(t)
        setAccounts(a)
      })
      .catch(() => setError('Could not load budgets. Is the backend running?'))
  }, [])

  const now = new Date()
  const monthTxs = useMemo(
    () =>
      txs.filter((t) => {
        const d = new Date(t.transaction_date + 'T00:00:00')
        return (
          t.transaction_type === 'expense' &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        )
      }),
    [txs], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const accById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])

  const budgets = useMemo(() => {
    return Object.entries(LIMITS)
      .map(([name, limit]) => {
        const cat = categories.find((c) => c.name === name)
        if (!cat) return null
        const spent = monthTxs
          .filter((t) => t.category_id === cat.id)
          .reduce((s, t) => s + Number(t.amount), 0)
        return { cat, limit, spent }
      })
      .filter((b): b is { cat: Category; limit: number; spent: number } => b !== null)
      .sort((a, b) => b.spent / b.limit - a.spent / a.limit)
  }, [categories, monthTxs])

  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const overCount = budgets.filter((b) => budgetLevel(b.spent, b.limit) === 'danger').length
  const warnCount = budgets.filter((b) => budgetLevel(b.spent, b.limit) === 'warning').length

  const selectedTxs = selected ? monthTxs.filter((t) => t.category_id === selected.id) : []

  return (
    <>
      <div className="page-header">
        <h1>Budgets</h1>
        <span className="subtitle">
          {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {error && <div className="form-alert error">{error}</div>}

      <div className="stack">
        <div className="grid grid-stats">
          <StatCard label="Total Budgeted" value={formatCurrency(totalLimit)} />
          <StatCard
            label="Total Spent"
            value={formatCurrency(totalSpent)}
            hint={totalLimit ? `${Math.round((totalSpent / totalLimit) * 100)}% of monthly budget` : undefined}
          />
          <StatCard
            label="Needs Attention"
            value={`${overCount + warnCount}`}
            hint={`${overCount} over budget · ${warnCount} near limit`}
            tone={overCount > 0 ? 'negative' : 'default'}
          />
        </div>

        <div className="grid budget-grid">
          {budgets.map(({ cat, limit, spent }) => (
            <div
              className="card budget-card"
              key={cat.id}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelected(cat)}
              title="Click to see transactions"
            >
              <BudgetBar
                name={cat.name}
                color={cat.color ?? '#64748b'}
                spent={spent}
                limit={limit}
              />
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              {selected.name} — {now.toLocaleDateString('en-US', { month: 'long' })} transactions
            </h2>
            {selectedTxs.length === 0 ? (
              <div className="empty">No transactions in this category this month.</div>
            ) : (
              selectedTxs.map((tx) => (
                <div className="list-item" key={tx.id}>
                  <div
                    className="list-icon"
                    style={{
                      background: `${selected.color ?? '#64748b'}22`,
                      color: selected.color ?? '#64748b',
                    }}
                  >
                    {tx.merchant.charAt(0)}
                  </div>
                  <div className="list-body">
                    <div className="list-title">{tx.merchant}</div>
                    <div className="list-sub">
                      {[accById.get(tx.account_id)?.account_name, formatDate(tx.transaction_date)]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  <div className="list-amount">−{formatCurrency(Number(tx.amount))}</div>
                </div>
              ))
            )}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
