import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../api/auth'
import { financeApi, type Account, type SavingsPlan, type Tx } from '../api/finance'
import DateField from '../components/DateField'
import StatCard from '../components/StatCard'
import Toast from '../components/Toast'
import { formatCurrency, formatDate } from '../utils/format'

const today = () => new Date().toISOString().slice(0, 10)

export default function Savings() {
  const [plans, setPlans] = useState<SavingsPlan[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [txs, setTxs] = useState<Tx[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    next_run_date: today(),
    from_account_id: '',
    to_account_id: '',
  })

  const load = () =>
    Promise.all([financeApi.savingsPlans(), financeApi.accounts(), financeApi.transactions()])
      .then(([p, a, t]) => {
        setPlans(p)
        setAccounts(a)
        setTxs(t)
      })
      .catch(() => setError('Could not load savings plans. Is the backend running?'))

  useEffect(() => {
    load()
  }, [])

  const accById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])
  const savingsAccounts = accounts.filter(
    (a) => a.account_type === 'savings' || a.account_type === 'investment',
  )
  const savingsTotal = savingsAccounts.reduce((s, a) => s + Number(a.current_balance), 0)
  const transfers = txs.filter((t) => t.transaction_type === 'transfer')
  const activePlans = plans.filter((p) => p.is_active)
  const monthlyPace = activePlans.reduce(
    (s, p) => s + Number(p.amount) * (p.frequency === 'weekly' ? 4.33 : 1),
    0,
  )

  async function toggle(plan: SavingsPlan) {
    try {
      const updated = await financeApi.toggleSavingsPlan(plan.id, !plan.is_active)
      setPlans((all) => all.map((p) => (p.id === plan.id ? updated : p)))
      setToast(updated.is_active ? `${plan.name} resumed` : `${plan.name} paused`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setModalError('')
    const amount = parseFloat(form.amount)
    if (!form.name.trim()) return setModalError('Enter a plan name.')
    if (isNaN(amount) || amount <= 0) return setModalError('Enter an amount greater than 0.')
    if (!form.from_account_id) return setModalError('Choose the account money comes from.')
    if (!form.to_account_id) return setModalError('Choose the savings account money goes to.')
    if (form.from_account_id === form.to_account_id)
      return setModalError('Source and destination must be different accounts.')
    setSaving(true)
    try {
      await financeApi.createSavingsPlan({
        name: form.name.trim(),
        amount,
        frequency: form.frequency,
        next_run_date: form.next_run_date,
        from_account_id: form.from_account_id,
        to_account_id: form.to_account_id,
      })
      setShowAdd(false)
      setForm({ name: '', amount: '', frequency: 'monthly', next_run_date: today(), from_account_id: '', to_account_id: '' })
      setToast('Savings plan added')
      await load()
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Savings</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Add savings plan
        </button>
      </div>

      {error && <div className="form-alert error">{error}</div>}

      <div className="stack">
        <div className="grid grid-stats">
          <StatCard
            label="Total Saved"
            value={formatCurrency(savingsTotal)}
            hint="Across savings & investment accounts"
          />
          <StatCard
            label="Monthly Pace"
            value={formatCurrency(monthlyPace)}
            hint={`${activePlans.length} active plan${activePlans.length === 1 ? '' : 's'}`}
            tone="positive"
          />
        </div>

        <div>
          <div className="card-title">Automatic transfers</div>
          {plans.length === 0 && (
            <div className="card empty">
              No savings plans yet — set one up to move money into savings automatically.
            </div>
          )}
          {plans.map((plan) => (
            <div className="row-card" key={plan.id}>
              <div className="list-item">
                <div
                  className="list-icon"
                  style={{
                    background: plan.is_active ? 'rgba(34,211,238,0.15)' : 'rgba(148,163,184,0.1)',
                    color: plan.is_active ? '#22d3ee' : 'var(--text-muted)',
                  }}
                >
                  {plan.name.charAt(0)}
                </div>
                <div className="list-body">
                  <div className="list-title">{plan.name}</div>
                  <div className="list-sub">
                    {plan.frequency} ·{' '}
                    {accById.get(plan.from_account_id ?? '')?.account_name ?? '?'} →{' '}
                    {accById.get(plan.to_account_id ?? '')?.account_name ?? '?'}
                    {plan.is_active ? ` · next transfer ${formatDate(plan.next_run_date)}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div className="list-amount income">{formatCurrency(Number(plan.amount))}</div>
                    <span className={`badge ${plan.is_active ? 'good' : 'muted'}`}>
                      {plan.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '6px 12px', fontSize: 13 }}
                    onClick={() => toggle(plan)}
                  >
                    {plan.is_active ? 'Pause' : 'Resume'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="card-title">Transfer history</div>
          {transfers.length === 0 ? (
            <div className="card empty">No savings transfers recorded yet.</div>
          ) : (
            transfers.slice(0, 10).map((tx) => (
              <div className="row-card" key={tx.id}>
                <div className="list-item">
                  <div className="list-icon" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
                    S
                  </div>
                  <div className="list-body">
                    <div className="list-title">{tx.merchant}</div>
                    <div className="list-sub">
                      {[tx.description, accById.get(tx.account_id)?.account_name, formatDate(tx.transaction_date)]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  <div className="list-amount income">{formatCurrency(Number(tx.amount))}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add savings plan</h2>
            {modalError && <div className="form-alert error">{modalError}</div>}
            <form onSubmit={submit} noValidate>
              <div className="field">
                <label htmlFor="sp-name">Plan name</label>
                <input
                  type="text"
                  id="sp-name"
                  placeholder="Emergency fund"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="sp-amount">Amount per transfer</label>
                <input
                  id="sp-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="100.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="sp-freq">Frequency</label>
                <select
                  id="sp-freq"
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="sp-from">From account</label>
                <select
                  id="sp-from"
                  value={form.from_account_id}
                  onChange={(e) => setForm({ ...form, from_account_id: e.target.value })}
                >
                  <option value="">Select an account…</option>
                  {accounts
                    .filter((a) => a.account_type !== 'credit_card')
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.account_name} ({a.account_type.replace('_', ' ')})
                      </option>
                    ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="sp-to">To savings account</label>
                <select
                  id="sp-to"
                  value={form.to_account_id}
                  onChange={(e) => setForm({ ...form, to_account_id: e.target.value })}
                >
                  <option value="">Select an account…</option>
                  {(savingsAccounts.length ? savingsAccounts : accounts).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_name} ({a.account_type.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>
              <DateField
                label="First transfer date"
                id="sp-date"
                value={form.next_run_date}
                onChange={(v) => setForm({ ...form, next_run_date: v })}
              />
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Add plan'}
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
