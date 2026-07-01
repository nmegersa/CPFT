import StatCard from '../components/StatCard'
import { subscriptions } from '../data/mockData'
import { formatCurrency, formatDate } from '../utils/format'

export default function Subscriptions() {
  const active = subscriptions.filter((s) => s.isActive)
  const monthlyTotal = active.reduce((sum, s) => sum + s.amount, 0)

  const sorted = [...subscriptions].sort((a, b) =>
    a.isActive === b.isActive ? b.amount - a.amount : a.isActive ? -1 : 1,
  )

  return (
    <>
      <div className="page-header">
        <h1>Subscriptions</h1>
        <span className="subtitle">{active.length} active</span>
      </div>

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

        <div className="card">
          <div className="card-title">Recurring payments</div>
          {sorted.map((sub) => (
            <div className="list-item" key={sub.id}>
              <div
                className="list-icon"
                style={{
                  background: sub.isActive ? 'rgba(99,102,241,0.15)' : 'rgba(148,163,184,0.1)',
                  color: sub.isActive ? '#818cf8' : 'var(--text-muted)',
                }}
              >
                {sub.name.charAt(0)}
              </div>
              <div className="list-body">
                <div className="list-title">{sub.name}</div>
                <div className="list-sub">
                  {sub.billingCycle} · next payment {formatDate(sub.nextPaymentDate)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="list-amount">{formatCurrency(sub.amount)}</div>
                <span className={`badge ${sub.isActive ? 'good' : 'muted'}`}>
                  {sub.isActive ? 'Active' : 'Paused'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
