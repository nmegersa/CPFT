import { budgetLevel, formatCurrency } from '../utils/format'

interface BudgetBarProps {
  name: string
  color: string
  spent: number
  limit: number
}

export default function BudgetBar({ name, color, spent, limit }: BudgetBarProps) {
  const ratio = limit > 0 ? spent / limit : 0
  const level = budgetLevel(spent, limit)
  const remaining = limit - spent

  return (
    <div className="progress-row">
      <div className="progress-meta">
        <span className="progress-name">
          <span className="dot" style={{ background: color }} />
          {name}
        </span>
        <span className="progress-amounts">
          <strong>{formatCurrency(spent)}</strong> / {formatCurrency(limit)}
        </span>
      </div>
      <div className="progress-track">
        <div
          className={`progress-fill ${level}`}
          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
        />
      </div>
      <div className="progress-footer">
        <span>{Math.round(ratio * 100)}% used</span>
        <span>
          {remaining >= 0
            ? `${formatCurrency(remaining)} left`
            : `${formatCurrency(Math.abs(remaining))} over`}
        </span>
      </div>
    </div>
  )
}
