import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/auth'
import { financeApi, type Account, type Category, type CreditProfile, type Tx } from '../api/finance'
import TransactionListItem from '../components/TransactionListItem'
import UtilizationRing from '../components/UtilizationRing'
import {
  formatCurrency,
  formatPercent,
  utilizationLabels,
  utilizationLevel,
  utilizationMessages,
} from '../utils/format'

type SimulationType = 'add_purchase' | 'make_payment' | 'increase_credit_limit'

function levelTone(ratio: number): 'good' | 'warning' | 'danger' | 'info' {
  const level = utilizationLevel(ratio)
  if (level === 'excellent' || level === 'good') return 'good'
  if (level === 'risky') return 'warning'
  return 'danger'
}

export default function Credit() {
  const [profiles, setProfiles] = useState<CreditProfile[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [txs, setTxs] = useState<Tx[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [simType, setSimType] = useState<SimulationType>('add_purchase')
  const [amount, setAmount] = useState('100')
  const [limitForm, setLimitForm] = useState({ accountId: '', limit: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      financeApi.creditProfiles(),
      financeApi.accounts(),
      financeApi.transactions(),
      financeApi.categories(),
    ])
      .then(([p, a, t, c]) => {
        setProfiles(p)
        setAccounts(a)
        setTxs(t)
        setCategories(c)
        if (p.length) setSelectedId(p[0].id)
      })
      .catch(() => setError('Could not load credit data.'))
  }, [])

  const profile = profiles.find((p) => p.id === selectedId)
  const balance = profile ? Number(profile.current_balance) : 0
  const limit = profile ? Number(profile.credit_limit) : 0
  const utilization = limit > 0 ? balance / limit : 0

  const ccAccounts = accounts.filter((a) => a.account_type === 'credit_card')
  const unlinked = ccAccounts.filter((a) => !profiles.some((p) => p.account_id === a.id))

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const cardTxs = useMemo(
    () =>
      profile
        ? txs.filter((t) => t.account_id === profile.account_id)
        : [],
    [txs, profile],
  )

  const simulation = useMemo(() => {
    const input = Math.max(parseFloat(amount) || 0, 0)
    let simBal = balance
    let simLimit = limit
    if (simType === 'add_purchase') simBal += input
    else if (simType === 'make_payment') simBal = Math.max(simBal - input, 0)
    else if (simType === 'increase_credit_limit') simLimit += input
    const resulting = simLimit > 0 ? simBal / simLimit : 0
    const startLabel = formatPercent(utilization)
    const endLabel = formatPercent(resulting)
    const levelName = utilizationLabels[utilizationLevel(resulting)].toLowerCase()
    const direction =
      resulting > utilization ? 'increase' : resulting < utilization ? 'decrease' : 'stay'
    const message =
      direction === 'stay'
        ? `Your utilization would stay at ${endLabel}. ${utilizationMessages[utilizationLevel(resulting)]}`
        : `Your utilization would ${direction} from ${startLabel} to ${endLabel}, which is considered ${levelName}.`
    return { balance: simBal, limit: simLimit, resulting, message }
  }, [simType, amount, balance, limit, utilization])

  async function addProfile(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const lim = parseFloat(limitForm.limit)
    if (!limitForm.accountId || isNaN(lim) || lim <= 0) {
      return setError('Pick a card and enter a credit limit.')
    }
    try {
      const p = await financeApi.createCreditProfile(limitForm.accountId, lim)
      setProfiles((x) => [...x, p])
      setSelectedId(p.id)
      setLimitForm({ accountId: '', limit: '' })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    }
  }

  if (!profile && profiles.length === 0) {
    return (
      <>
        <div className="page-header"><h1>Credit Health</h1></div>
        {error && <div className="form-alert error">{error}</div>}
        {unlinked.length > 0 ? (
          <div className="card">
            <div className="card-title">Set up a credit profile</div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Add a credit limit for your card to track utilization.
            </p>
            <form onSubmit={addProfile}>
              <div className="field">
                <label>Credit card</label>
                <select
                  value={limitForm.accountId}
                  onChange={(e) => setLimitForm((f) => ({ ...f, accountId: e.target.value }))}
                >
                  <option value="">Select…</option>
                  {unlinked.map((a) => (
                    <option key={a.id} value={a.id}>{a.account_name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Credit limit</label>
                <input
                  type="number"
                  step="0.01"
                  value={limitForm.limit}
                  onChange={(e) => setLimitForm((f) => ({ ...f, limit: e.target.value }))}
                />
              </div>
              <button className="btn btn-primary" type="submit">Save profile</button>
            </form>
          </div>
        ) : (
          <div className="card empty">
            Add a credit card on the <Link to="/app/accounts">Accounts page</Link> first.
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div className="page-header">
        <h1>Credit Health</h1>
        {profiles.length > 1 && (
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.account_name}</option>
            ))}
          </select>
        )}
        {!profile && profiles.length > 0 && (
          <span className="subtitle">{profiles[0]?.account_name}</span>
        )}
      </div>

      {error && <div className="form-alert error">{error}</div>}

      {profile && (
        <div className="stack">
          <div className="grid grid-2">
            <div className="card">
              <div className="card-title">Current utilization</div>
              <div className="ring-wrap">
                <UtilizationRing ratio={utilization} />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <span className={`badge ${levelTone(utilization)}`}>
                    {utilizationLabels[utilizationLevel(utilization)]}
                  </span>
                  <p style={{ marginTop: 10, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                    {utilizationMessages[utilizationLevel(utilization)]}
                  </p>
                </div>
              </div>
              <div className="detail-grid" style={{ marginTop: 18 }}>
                <div>
                  <div className="detail-label">Current balance</div>
                  <div className="detail-value">{formatCurrency(balance)}</div>
                </div>
                <div>
                  <div className="detail-label">Credit limit</div>
                  <div className="detail-value">{formatCurrency(limit)}</div>
                </div>
                <div>
                  <div className="detail-label">Available credit</div>
                  <div className="detail-value">{formatCurrency(Math.max(limit - balance, 0))}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">What-if simulator</div>
              <div className="field">
                <label>Scenario</label>
                <select value={simType} onChange={(e) => setSimType(e.target.value as SimulationType)}>
                  <option value="add_purchase">What if I make a purchase?</option>
                  <option value="make_payment">What if I make a payment?</option>
                  <option value="increase_credit_limit">What if my limit increases?</option>
                </select>
              </div>
              <div className="field">
                <label>Amount</label>
                <input type="number" min="0" step="10" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="sim-compare">
                <div className="sim-box">
                  <div className="sim-label">Now</div>
                  <div className="sim-value">{formatPercent(utilization)}</div>
                </div>
                <div className="sim-arrow">→</div>
                <div className="sim-box">
                  <div className="sim-label">After</div>
                  <div className="sim-value" style={{ color: levelTone(simulation.resulting) === 'good' ? 'var(--good)' : levelTone(simulation.resulting) === 'warning' ? 'var(--warning)' : 'var(--danger)' }}>
                    {formatPercent(simulation.resulting)}
                  </div>
                </div>
              </div>
              <div className={`sim-message ${levelTone(simulation.resulting)}`}>{simulation.message}</div>
              <div className="detail-grid" style={{ marginTop: 16 }}>
                <div>
                  <div className="detail-label">Resulting balance</div>
                  <div className="detail-value">{formatCurrency(simulation.balance)}</div>
                </div>
                <div>
                  <div className="detail-label">Resulting limit</div>
                  <div className="detail-value">{formatCurrency(simulation.limit)}</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="card-title">Card transactions</div>
            {cardTxs.length === 0 ? (
              <div className="card empty">No transactions on this card yet.</div>
            ) : (
              cardTxs.map((tx) => (
                <TransactionListItem
                  key={tx.id}
                  tx={tx}
                  category={tx.category_id ? catById.get(tx.category_id) : null}
                  accountName={profile.account_name}
                />
              ))
            )}
          </div>
        </div>
      )}
    </>
  )
}
