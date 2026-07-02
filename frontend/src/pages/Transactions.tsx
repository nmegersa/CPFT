import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/auth'
import { financeApi, type Account, type Category, type Tx } from '../api/finance'
import DateField from '../components/DateField'
import Toast from '../components/Toast'
import TransactionListItem from '../components/TransactionListItem'

const today = () => new Date().toISOString().slice(0, 10)
const PAGE = 50

export default function Transactions() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    merchant: '',
    amount: '',
    categoryId: '',
    accountId: '',
    type: 'expense',
    date: today(),
    description: '',
  })

  useEffect(() => {
    Promise.all([
      financeApi.transactions({ limit: PAGE }),
      financeApi.accounts(),
      financeApi.categories(),
    ])
      .then(([t, a, c]) => {
        setTxs(t)
        setHasMore(t.length === PAGE)
        setAccounts(a)
        setCategories(c)
        if (a.length) setForm((f) => ({ ...f, accountId: a[0].id }))
        const firstExpense = c.find((x) => x.category_type === 'expense')
        if (firstExpense) setForm((f) => ({ ...f, categoryId: firstExpense.id }))
      })
      .catch(() => setError('Could not load transactions.'))
  }, [])

  // Server-side search (debounced).
  useEffect(() => {
    const t = setTimeout(() => {
      financeApi
        .transactions({ search, limit: PAGE })
        .then((rows) => {
          setTxs(rows)
          setHasMore(rows.length === PAGE)
        })
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  function loadMore() {
    financeApi
      .transactions({ search, limit: PAGE, offset: txs.length })
      .then((rows) => {
        setTxs((t) => [...t, ...rows])
        setHasMore(rows.length === PAGE)
      })
      .catch(() => {})
  }

  function startEdit(tx: Tx) {
    setError('')
    setEditingId(tx.id)
    setForm({
      merchant: tx.merchant,
      amount: String(tx.amount),
      categoryId: tx.category_id ?? '',
      accountId: tx.account_id,
      type: tx.transaction_type,
      date: tx.transaction_date,
      description: tx.description ?? '',
    })
    setShowModal(true)
  }

  async function handleDelete(tx: Tx) {
    if (!window.confirm(`Delete "${tx.merchant}"? The account balance will be adjusted back.`))
      return
    try {
      await financeApi.deleteTransaction(tx.id)
      setTxs((t) => t.filter((x) => x.id !== tx.id))
      financeApi.accounts().then(setAccounts)
      setToast('Transaction deleted')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    }
  }

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const accById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])

  const usedCategories = useMemo(
    () => categories.filter((c) => txs.some((t) => t.category_id === c.id)),
    [categories, txs],
  )
  const filtered = filter === 'all' ? txs : txs.filter((t) => t.category_id === filter)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const amount = parseFloat(form.amount)
    if (!form.merchant.trim()) return setError('Give the transaction a name.')
    if (isNaN(amount) || amount <= 0) return setError('Enter an amount greater than 0.')
    if (!form.accountId) return setError('Choose an account.')
    setSaving(true)
    try {
      const payload = {
        account_id: form.accountId,
        category_id: form.categoryId || null,
        transaction_type: form.type,
        merchant: form.merchant.trim(),
        description: form.description.trim() || null,
        amount,
        transaction_date: form.date,
      }
      if (editingId) {
        const tx = await financeApi.updateTransaction(editingId, payload)
        setTxs((t) => t.map((x) => (x.id === editingId ? tx : x)))
        setToast('Transaction updated')
      } else {
        const tx = await financeApi.createTransaction(payload)
        setTxs((t) => [tx, ...t])
        setToast('Transaction successfully added')
      }
      // refresh balances shown elsewhere
      financeApi.accounts().then(setAccounts)
      setShowModal(false)
      setEditingId(null)
      setForm((f) => ({ ...f, merchant: '', amount: '', description: '', date: today() }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Transactions</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => financeApi.exportTransactions().catch(() => setError('Export failed.'))}>
            Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => { setError(''); setEditingId(null); setShowModal(true) }}>
            + Add transaction
          </button>
        </div>
      </div>

      <div className="field" style={{ marginBottom: 14 }}>
        <input
          type="search"
          placeholder="Search transactions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {accounts.length === 0 && (
        <div className="form-alert error" style={{ marginBottom: 16 }}>
          You need an account first — add one on the <Link to="/app/accounts" style={{ color: 'inherit' }}>Accounts page</Link>.
        </div>
      )}

      <div className="filters">
        <button className={`chip${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
          All
        </button>
        {usedCategories.map((c) => (
          <button
            key={c.id}
            className={`chip${filter === c.id ? ' active' : ''}`}
            onClick={() => setFilter(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card empty">No transactions yet.</div>
      ) : (
        filtered.map((tx) => (
          <TransactionListItem
            key={tx.id}
            tx={tx}
            category={tx.category_id ? catById.get(tx.category_id) : null}
            accountName={accById.get(tx.account_id)?.account_name}
            onEdit={() => startEdit(tx)}
            onDelete={() => handleDelete(tx)}
          />
        ))
      )}

      {hasMore && filter === 'all' && (
        <button className="btn btn-ghost" style={{ margin: '14px auto', display: 'block' }} onClick={loadMore}>
          Load more
        </button>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit transaction' : 'Add transaction'}</h2>
            {error && <div className="form-alert error">{error}</div>}
            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chipotle"
                  value={form.merchant}
                  onChange={(e) => setForm((f) => ({ ...f, merchant: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <DateField
                  id="tx-date"
                  value={form.date}
                  onChange={(date) => setForm((f) => ({ ...f, date }))}
                />
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Paid with</label>
                  <select
                    value={form.accountId}
                    onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.account_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="refund">Refund</option>
                  <option value="credit_card_payment">Credit card payment</option>
                </select>
              </div>
              <div className="field">
                <label>Description (optional)</label>
                <input
                  type="text"
                  placeholder="What was it for?"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving || !accounts.length}>
                  {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </>
  )
}
