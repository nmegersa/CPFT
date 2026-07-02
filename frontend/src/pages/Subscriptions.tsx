import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../api/auth'
import { financeApi, type Account, type Category, type Sub } from '../api/finance'
import DateField from '../components/DateField'
import StatCard from '../components/StatCard'
import Toast from '../components/Toast'
import { formatCurrency, formatDate } from '../utils/format'

const today = () => new Date().toISOString().slice(0, 10)

export default function Subscriptions() {
  const [subs, setSubs] = useState<Sub[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    amount: '',
    billing_cycle: 'monthly',
    next_payment_date: today(),
    account_id: '',
  })

  const load = () =>
    Promise.all([financeApi.subscriptions(), financeApi.accounts(), financeApi.categories()])
      .then(([s, a, c]) => {
        setSubs(s)
        setAccounts(a)
        setCategories(c)
      })
      .catch(() => setError('Could not load subscriptions. Is the backend running?'))

  useEffect(() => {
    load()
  }, [])

  const accById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])
  const active = subs.filter((s) => s.is_active)
  const monthlyTotal = active.reduce(
    (sum, s) => sum + Number(s.amount) * (s.billing_cycle === 'weekly' ? 4.33 : 1),
    0,
  )

  const sorted = [...subs].sort((a, b) =>
    a.is_active === b.is_active ? Number(b.amount) - Number(a.amount) : a.is_active ? -1 : 1,
  )

  async function remove(sub: Sub) {
    if (!window.confirm(`Delete "${sub.name}"? Past payments stay in your transactions.`)) return
    try {
      await financeApi.deleteSubscription(sub.id)
      setSubs((all) => all.filter((s) => s.id !== sub.id))
      setToast('Subscription deleted')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    }
  }

  async function toggle(sub: Sub) {
    try {
      const updated = await financeApi.toggleSubscription(sub.id, !sub.is_active)
      setSubs((all) => all.map((s) => (s.id === sub.id ? updated : s)))
      setToast(updated.is_active ? `${sub.name} resumed` : `${sub.name} paused`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setModalError('')
    const amount = parseFloat(form.amount)
    if (!form.name.trim()) return setModalError('Enter a subscription name.')
    if (isNaN(amount) || amount <= 0) return setModalError('Enter an amount greater than 0.')
    if (!form.account_id) return setModalError('Choose a payment account.')
    setSaving(true)
    try {
      const subsCat = categories.find((c) => c.name === 'Subscriptions')
      await financeApi.createSubscription({
        name: form.name.trim(),
        amount,
        billing_cycle: form.billing_cycle,
        next_payment_date: form.next_payment_date,
        account_id: form.account_id,
        category_id: subsCat?.id ?? null,
      })
      setShowAdd(false)
      setForm({ name: '', amount: '', billing_cycle: 'monthly', next_payment_date: today(), account_id: '' })
      setToast('Subscription added')
      await load() // refresh: payment may have been billed immediately
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Subscriptions</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Add subscription
        </button>
      </div>

      {error && <div className="form-alert error">{error}</div>}

      <div className="stack">
        <div className="grid grid-stats">
          <StatCard
            label="Monthly Total"
            value={formatCurrency(monthlyTotal)}
            hint="Active subscriptions only"
          />
          <StatCard
            label="Yearly Cost"
            value={formatCurrency(monthlyTotal * 12)}
            hint="If nothing changes"
          />
        </div>

        <div>
          <div className="card-title">Recurring payments</div>
          {sorted.length === 0 && (
            <div className="card empty">No subscriptions yet — add one to start tracking.</div>
          )}
          {sorted.map((sub) => (
            <div className="row-card" key={sub.id}>
              <div className="list-item">
                <div
                  className="list-icon"
                  style={{
                    background: sub.is_active ? 'rgba(99,102,241,0.15)' : 'rgba(148,163,184,0.1)',
                    color: sub.is_active ? '#818cf8' : 'var(--text-muted)',
                  }}
                >
                  {sub.name.charAt(0)}
                </div>
                <div className="list-body">
                  <div className="list-title">{sub.name}</div>
                  <div className="list-sub">
                    {sub.billing_cycle}
                    {sub.account_id && accById.get(sub.account_id)
                      ? ` · ${accById.get(sub.account_id)!.account_name}`
                      : ''}
                    {sub.is_active && sub.next_payment_date
                      ? ` · next payment ${formatDate(sub.next_payment_date)}`
                      : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div className="list-amount">{formatCurrency(Number(sub.amount))}</div>
                    <span className={`badge ${sub.is_active ? 'good' : 'muted'}`}>
                      {sub.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '6px 12px', fontSize: 13 }}
                    onClick={() => toggle(sub)}
                  >
                    {sub.is_active ? 'Pause' : 'Resume'}
                  </button>
                  <button className="tx-action danger" title="Delete" onClick={() => remove(sub)}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add subscription</h2>
            {modalError && <div className="form-alert error">{modalError}</div>}
            <form onSubmit={submit} noValidate>
              <div className="field">
                <label htmlFor="sub-name">Name</label>
                <input
                  type="text"
                  id="sub-name"
                  placeholder="Netflix"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="sub-amount">Amount</label>
                <input
                  id="sub-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="15.99"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="sub-cycle">Billing cycle</label>
                <select
                  id="sub-cycle"
                  value={form.billing_cycle}
                  onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="sub-account">Payment account</label>
                <select
                  id="sub-account"
                  value={form.account_id}
                  onChange={(e) => setForm({ ...form, account_id: e.target.value })}
                >
                  <option value="">Select an account…</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_name} ({a.account_type.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>
              <DateField
                label="First / next payment date"
                id="sub-date"
                value={form.next_payment_date}
                onChange={(v) => setForm({ ...form, next_payment_date: v })}
              />
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Add subscription'}
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
