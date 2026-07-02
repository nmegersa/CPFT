import type { Tx } from '../api/finance'
import { formatCurrency, formatDate } from '../utils/format'

interface Props {
  tx: Tx
  category?: { name: string; color: string | null } | null
  accountName?: string
  onEdit?: () => void
  onDelete?: () => void
}

/** Matches the Transactions page row: icon, merchant, meta, amount in a row-card. */
export default function TransactionListItem({ tx, category, accountName, onEdit, onDelete }: Props) {
  const isIncome = tx.transaction_type === 'income' || tx.transaction_type === 'refund'
  const color = category?.color ?? '#64748b'

  return (
    <div className="row-card">
      <div className="list-item">
        <div className="list-icon" style={{ background: `${color}22`, color }}>
          {(category?.name ?? tx.merchant).charAt(0)}
        </div>
        <div className="list-body">
          <div className="list-title">{tx.merchant}</div>
          <div className="list-sub">
            {[category?.name, accountName, formatDate(tx.transaction_date)]
              .filter(Boolean)
              .join(' · ')}
            {tx.description ? ` — ${tx.description}` : ''}
          </div>
        </div>
        <div className={`list-amount${isIncome ? ' income' : ''}`}>
          {isIncome ? '+' : '−'}
          {formatCurrency(Number(tx.amount))}
        </div>
        {(onEdit || onDelete) && (
          <div className="tx-actions">
            {onEdit && (
              <button className="tx-action" title="Edit" onClick={onEdit}>✎</button>
            )}
            {onDelete && (
              <button className="tx-action danger" title="Delete" onClick={onDelete}>✕</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
