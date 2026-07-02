import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../api/auth'
import { financeApi, type Account, type Budget, type Category, type Tx } from '../api/finance'
import BudgetBar from '../components/BudgetBar'
import StatCard from '../components/StatCard'
import Toast from '../components/Toast'
import TransactionListItem from '../components/TransactionListItem'
import { budgetLevel, formatCurrency } from '../utils/format'

export default function Budgets() {
  const [categories, setCategories] = useState<Category[]>([])
  const [txs, setTxs] = useState<Tx[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [budgetRows, setBudgetRows] = useState<Budget[]>([])
  const [selected, setSelected] = useState<Category | null>(null)
  const [editing, setEditing] = useState<{ category: Category; limit: string } | null>(null)
  const [newCat, setNewCat] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  useEffect(() => {
    Promise.all([
      financeApi.categories(),
      financeApi.transactions(),
      financeApi.accounts(),
      financeApi.budgets(month, year),
    ])
      .then(([c, t, a, b]) => {
        setCategories(c)
        setTxs(t)
        setAccounts(a)
        setBudgetRows(b)
      })
      .catch(() => setError('Could not load budgets. Is the backend running?'))
  }, [month, year])

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
  const limitByCat = useMemo(
    () => new Map(budgetRows.map((b) => [b.category_id, Number(b.limit_amount)])),
    [budgetRows],
  )

  const budgets = useMemo(() => {
    return categories
      .filter((c) => limitByCat.has(c.id))
      .map((cat) => {
        const spent = monthTxs
          .filter((t) => t.category_id === cat.id)
          .reduce((s, t) => s + Number(t.amount), 0)
        return { cat, limit: limitByCat.get(cat.id)!, spent }
      })
      .sort((a, b) => b.spent / b.limit - a.spent / a.limit)
  }, [categories, limitByCat, monthTxs])

  const unbudgeted = categories.filter(
    (c) => c.category_type === 'expense' && !limitByCat.has(c.id),
  )

  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const overCount = budgets.filter((b) => budgetLevel(b.spent, b.limit) === 'danger').length
  const warnCount = budgets.filter((b) => budgetLevel(b.spent, b.limit) === 'warning').length

  const selectedTxs = selected ? monthTxs.filter((t) => t.category_id === selected.id) : []

  async function saveBudget(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setModalError('')
    const limit = parseFloat(editing.limit)
    if (isNaN(limit) || limit <= 0) {
      return setModalError('Enter a limit greater than 0.')
    }
    setSaving(true)
    try {
      const saved = await financeApi.setBudget({
        category_id: editing.category.id,
        month,
        year,
        limit_amount: limit,
      })
      setBudgetRows((rows) => [
        ...rows.filter((r) => r.category_id !== saved.category_id),
        saved,
      ])
      setEditing(null)
      setToast('Budget saved')
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  function openEditor(category: Category, currentLimit?: number) {
    setModalError('')
    setEditing({ category, limit: currentLimit ? String(currentLimit) : '' })
  }

  async function removeBudget() {
    if (!editing) return
    const row = budgetRows.find((b) => b.category_id === editing.category.id)
    if (!row) return
    try {
      await financeApi.deleteBudget(row.id)
      setBudgetRows((rows) => rows.filter((r) => r.id !== row.id))
      setEditing(null)
      setToast('Budget removed')
    } catch {
      setModalError('Could not remove the budget.')
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault()
    const name = (newCat ?? '').trim()
    if (!name) return
    try {
      const colors = ['#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#eab308']
      const cat = await financeApi.createCategory({
        name,
        color: colors[name.length % colors.length],
      })
      setCategories((c) => [...c, cat])
      setNewCat(null)
      openEditor(cat)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the category.')
      setNewCat(null)
    }
  }

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

        {budgets.length === 0 && !error && (
          <div className="card empty">
            No budgets set for this month yet — pick a category below to set your first limit.
          </div>
        )}

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
              <button
                className="btn btn-ghost"
                style={{ marginTop: 12, padding: '6px 14px', fontSize: 13 }}
                onClick={(e) => {
                  e.stopPropagation()
                  openEditor(cat, limit)
                }}
              >
                Edit limit
              </button>
            </div>
          ))}
        </div>

        <div>
          <div className="card-title">Set a budget</div>
          <div className="filters">
            {unbudgeted.map((c) => (
              <button key={c.id} className="chip" onClick={() => openEditor(c)}>
                + {c.name}
              </button>
            ))}
            {newCat === null ? (
              <button className="chip" onClick={() => setNewCat('')}>+ New category</button>
            ) : (
              <form onSubmit={addCategory} style={{ display: 'inline-flex', gap: 6 }}>
                <input
                  autoFocus
                  placeholder="Category name"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: 13 }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 13 }}>
                  Add
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing.category.name} budget</h2>
            {modalError && <div className="form-alert error">{modalError}</div>}
            <form onSubmit={saveBudget} noValidate>
              <div className="field">
                <label htmlFor="budget-limit">
                  Monthly limit for {now.toLocaleDateString('en-US', { month: 'long' })}
                </label>
                <input
                  id="budget-limit"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="300.00"
                  autoFocus
                  value={editing.limit}
                  onChange={(e) =>
                    setEditing((ed) => (ed ? { ...ed, limit: e.target.value } : ed))
                  }
                />
              </div>
              <div className="modal-actions">
                {budgetRows.some((b) => b.category_id === editing.category.id) && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ marginRight: 'auto', color: '#f87171' }}
                    onClick={removeBudget}
                  >
                    Remove budget
                  </button>
                )}
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <TransactionListItem
                  key={tx.id}
                  tx={tx}
                  category={selected}
                  accountName={accById.get(tx.account_id)?.account_name}
                />
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

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </>
  )
}
