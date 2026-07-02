import { useEffect, useState } from 'react'
import { ApiError } from '../api/auth'
import { financeApi, type Account } from '../api/finance'
import Toast from '../components/Toast'
import { formatCurrency } from '../utils/format'

export const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'investment', label: 'Investment / Roth IRA' },
  { value: 'other', label: 'Other' },
]

export const typeLabel = (v: string) =>
  ACCOUNT_TYPES.find((t) => t.value === v)?.label ?? v

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [form, setForm] = useState({ name: '', type: 'checking', balance: '', creditLimit: '' })
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    financeApi.accounts().then(setAccounts).catch(() => setError('Could not load accounts.'))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const balance = parseFloat(form.balance || '0')
    if (!form.name.trim()) return setError('Give the account a name.')
    if (isNaN(balance)) return setError('Enter a valid balance.')
    if (form.type === 'credit_card' && (!form.creditLimit || parseFloat(form.creditLimit) <= 0)) {
      return setError('Credit cards need a credit limit greater than 0.')
    }
    setSaving(true)
    try {
      const acc = await financeApi.createAccount({
        account_name: form.name.trim(),
        account_type: form.type,
        current_balance: balance,
        ...(form.type === 'credit_card'
          ? { credit_limit: parseFloat(form.creditLimit) }
          : {}),
      })
      setAccounts((a) => [...a, acc])
      setForm({ name: '', type: 'checking', balance: '', creditLimit: '' })
      setToast('Account successfully added')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Accounts</h1>
        <span className="subtitle">{accounts.length} account{accounts.length === 1 ? '' : 's'}</span>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Add an account</div>
          {error && <div className="form-alert error">{error}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="accName">Account name</label>
              <input
                id="accName"
                type="text"
                placeholder="e.g. Chase Checking"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="accType">Type</label>
                <select
                  id="accType"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="accBalance">
                  {form.type === 'credit_card' ? 'Current balance owed' : 'Current balance'}
                </label>
                <input
                  id="accBalance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.balance}
                  onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))}
                />
              </div>
            </div>
            {form.type === 'credit_card' && (
              <div className="field">
                <label htmlFor="accLimit">Credit limit</label>
                <input
                  id="accLimit"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1500.00"
                  value={form.creditLimit}
                  onChange={(e) => setForm((f) => ({ ...f, creditLimit: e.target.value }))}
                />
              </div>
            )}
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Adding…' : 'Add account'}
            </button>
          </form>
        </div>

        <div>
          <div className="card-title">Your accounts</div>
          {accounts.length === 0 ? (
            <div className="card empty">No accounts yet — add your first one.</div>
          ) : (
            accounts.map((a) => (
              <div className="row-card" key={a.id}>
                <div className="list-item">
                  <div className="list-icon" style={{ background: 'rgba(16,185,129,0.14)', color: 'var(--accent)' }}>
                    {a.account_name.charAt(0)}
                  </div>
                  <div className="list-body">
                    <div className="list-title">{a.account_name}</div>
                    <div className="list-sub">{typeLabel(a.account_type)}</div>
                  </div>
                  <div className="list-amount">
                    {formatCurrency(Number(a.current_balance))}
                    {a.account_type === 'credit_card' && (
                      <div className="list-sub" style={{ textAlign: 'right' }}>owed</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </>
  )
}
