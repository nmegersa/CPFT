import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/auth'
import { financeApi, type Account, type Category, type Tx } from '../api/finance'
import DateField from '../components/DateField'
import TransactionListItem from '../components/TransactionListItem'
import Toast from '../components/Toast'
import { formatCurrency } from '../utils/format'

const today = () => new Date().toISOString().slice(0, 10)

export default function Payroll() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [incomeCategory, setIncomeCategory] = useState<Category | null>(null)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    source: '',
    amount: '',
    accountId: '',
    date: today(),
    description: '',
  })

  useEffect(() => {
    Promise.all([financeApi.transactions(), financeApi.accounts(), financeApi.categories()])
      .then(([t, a, c]) => {
        setTxs(t)
        setAccounts(a)
        setIncomeCategory(c.find((x) => x.category_type === 'income') ?? null)
        if (a.length) setForm((f) => ({ ...f, accountId: a[0].id }))
      })
      .catch(() => setError('Could not load payroll data.'))
  }, [])

  const accById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])
  const payments = txs.filter((t) => t.transaction_type === 'income')
  const total = payments.reduce((s, t) => s + Number(t.amount), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const amount = parseFloat(form.amount)
    if (!form.source.trim()) return setError('Name the payment (e.g. "Campus Job Paycheck").')
    if (isNaN(amount) || amount <= 0) return setError('Enter an amount greater than 0.')
    if (!form.accountId) return setError('Choose the account it goes to.')
    setSaving(true)
    try {
      const tx = await financeApi.createTransaction({
        account_id: form.accountId,
        category_id: incomeCategory?.id ?? null,
        transaction_type: 'income',
        merchant: form.source.trim(),
        description: form.description.trim() || null,
        amount,
        transaction_date: form.date,
      })
      setTxs((t) => [tx, ...t])
      financeApi.accounts().then(setAccounts)
      setForm((f) => ({ ...f, source: '', amount: '', description: '', date: today() }))
      setToast('Payment successfully added')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Payroll</h1>
        <span className="subtitle">Total received: {formatCurrency(total)}</span>
      </div>

      {accounts.length === 0 && (
        <div className="form-alert error" style={{ marginBottom: 16 }}>
          You need an account first — add one on the <Link to="/app/accounts" style={{ color: 'inherit' }}>Accounts page</Link>.
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Add a payment</div>
          {error && <div className="form-alert error">{error}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label>Source</label>
              <input
                type="text"
                placeholder="e.g. Summer Internship Paycheck"
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
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
                id="payroll-date"
                value={form.date}
                onChange={(date) => setForm((f) => ({ ...f, date }))}
              />
            </div>
            <div className="field">
              <label>Deposit to</label>
              <select
                value={form.accountId}
                onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.account_name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Description (optional)</label>
              <input
                type="text"
                placeholder="e.g. Biweekly pay"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving || !accounts.length}>
              {saving ? 'Adding…' : 'Add payment'}
            </button>
          </form>
        </div>

        <div>
          <div className="card-title">Payment history</div>
          {payments.length === 0 ? (
            <div className="card empty">No payments recorded yet.</div>
          ) : (
            payments.map((tx) => (
              <TransactionListItem
                key={tx.id}
                tx={tx}
                category={{ name: 'Income', color: '#10b981' }}
                accountName={accById.get(tx.account_id)?.account_name}
              />
            ))
          )}
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </>
  )
}
